import { afterAll, beforeAll, describe, expect, it } from "vitest";
import EmbeddedPostgres from "embedded-postgres";
import { Pool } from "pg";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "../scripts/migrate";
import { withContext } from "@/server/db";
import { createKey, generateKey, parseToken } from "@/server/keys";
import { parseOtlpMetrics, persist } from "@/server/ingest/otlp";
import { quantile, mergeCounts } from "@/server/ingest/histogram";

const PORT = 54400 + Math.floor(Math.random() * 500);
let pg: EmbeddedPostgres;
let app: Pool;
let A = "", B = "";

beforeAll(async () => {
  pg = new EmbeddedPostgres({ databaseDir: mkdtempSync(join(tmpdir(), "pyxis-pg-")), user: "postgres", password: "postgres", port: PORT, persistent: false });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("pyxis");
  await migrate(`postgres://postgres:postgres@localhost:${PORT}/pyxis`);
  app = new Pool({ connectionString: `postgres://pyxis_app:pyxis_app@localhost:${PORT}/pyxis` });
  const mk = async (name: string) =>
    (await app.query("INSERT INTO users(stellar_account) VALUES ($1) RETURNING id", ["G" + name.repeat(55)])).rows[0].id;
  const ua = await mk("A"), ub = await mk("B");
  A = (await app.query("SELECT pyxis_create_project($1,'Alpha',null) id", [ua])).rows[0].id;
  B = (await app.query("SELECT pyxis_create_project($1,'Beta',null) id", [ub])).rows[0].id;
}, 120_000);

afterAll(async () => {
  await app?.end();
  await pg?.stop();
});

const now = Date.now();
const body = (svc: string, route = "/x", status = 200) =>
  parseOtlpMetrics({
    resourceMetrics: [{
      resource: { attributes: [{ key: "service.name", value: { stringValue: svc } }] },
      scopeMetrics: [{ metrics: [{
        name: "http.server.request.duration", unit: "ms",
        histogram: { aggregationTemporality: 1, dataPoints: [{
          timeUnixNano: String(BigInt(now) * 1_000_000n), explicitBounds: [10, 100], bucketCounts: ["5", "5", "0"], sum: 300,
          attributes: [
            { key: "http.request.method", value: { stringValue: "GET" } },
            { key: "http.route", value: { stringValue: route } },
            { key: "http.response.status_code", value: { intValue: status } },
          ],
        }] },
      }] }],
    }],
  }, now);

describe("tenant isolation (RLS, runtime role)", () => {
  it("runtime role is not owner and cannot bypass RLS", async () => {
    const r = await app.query("SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user");
    expect(r.rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
  });

  it("ingest merges into the same bucket and keeps mergeable histograms", async () => {
    for (let i = 0; i < 2; i++) await withContext({ projectId: A }, (c) => persist(c, A, body("api")), app);
    const rows = await withContext({ projectId: A }, async (c) => (await c.query("SELECT request_count, histogram_counts FROM endpoint_metric_buckets")).rows, app);
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].request_count)).toBe(20);
    // source bounds [10,100]ms land on fixed buckets idx1 (<=10) and idx4 (<=100); two exports of 5 each
    expect(rows[0].histogram_counts.slice(0, 5).map(Number)).toEqual([0, 10, 0, 0, 10]);
    expect(quantile(mergeCounts(rows[0].histogram_counts.map(Number), new Array(12).fill(0)), 0.5)).toBeGreaterThan(0);
  });

  it("tenant A cannot see tenant B data on any table", async () => {
    await withContext({ projectId: B }, (c) => persist(c, B, body("other", "/secret")), app);
    for (const t of ["endpoint_metric_buckets", "services", "api_keys", "ingestion_audit", "sites", "project_members", "wallet_event_buckets"]) {
      const rows = await withContext({ projectId: A }, async (c) => (await c.query(`SELECT project_id FROM ${t}`)).rows, app);
      expect(rows.every((r) => r.project_id === A), t).toBe(true);
    }
    const routes = await withContext({ projectId: A }, async (c) => (await c.query("SELECT normalized_route FROM endpoint_metric_buckets")).rows, app);
    expect(routes.map((r) => r.normalized_route)).not.toContain("/secret");
  });

  it("cannot write another tenant's rows (WITH CHECK)", async () => {
    await expect(
      withContext({ projectId: A }, (c) => c.query("INSERT INTO services(project_id, service_name, environment) VALUES ($1,'evil','x')", [B]), app),
    ).rejects.toThrow();
  });

  it("missing tenant context returns no rows", async () => {
    const r = await withContext({}, async (c) => (await c.query("SELECT 1 FROM endpoint_metric_buckets")).rowCount, app);
    expect(r).toBe(0);
  });

  it("pooled connection does not leak previous tenant context", async () => {
    const one = new Pool({ connectionString: `postgres://pyxis_app:pyxis_app@localhost:${PORT}/pyxis`, max: 1 });
    await withContext({ projectId: A }, (c) => c.query("SELECT 1"), one);
    const r = await withContext({}, async (c) => (await c.query("SELECT 1 FROM endpoint_metric_buckets")).rowCount, one);
    expect(r).toBe(0);
    await one.end();
  });

  it("operator context reads across tenants (read-only); tenant context cannot", async () => {
    const all = await withContext({ operator: true }, async (c) => (await c.query("SELECT DISTINCT project_id FROM endpoint_metric_buckets")).rowCount, app);
    expect(all).toBe(2);
    await expect(withContext({ operator: true }, (c) => c.query("DELETE FROM endpoint_metric_buckets"), app).then((r) => r.rowCount)).resolves.toBe(0);
  });

  it("SQL injection strings remain data", async () => {
    await withContext({ projectId: A }, (c) => persist(c, A, body("api", "/x'; DROP TABLE users;--")), app);
    expect((await app.query("SELECT count(*)::int n FROM users")).rows[0].n).toBe(2);
  });
});

describe("api key lifecycle", () => {
  it("stores only a hash, resolves via definer function, and revocation is immediate", async () => {
    const k = await withContext({ projectId: A }, (c) => createKey(c, A, "ci", ["ingest"]), app);
    const parsed = parseToken(k.token)!;
    const stored = await withContext({ projectId: A }, async (c) => (await c.query("SELECT secret_hash FROM api_keys WHERE key_id=$1", [k.keyId])).rows[0], app);
    expect(JSON.stringify(stored)).not.toContain(parsed.secret);
    const r1 = await app.query("SELECT * FROM pyxis_resolve_api_key($1)", [k.keyId]);
    expect(r1.rows[0].project_id).toBe(A);
    expect(r1.rows[0].revoked_at).toBeNull();
    await withContext({ projectId: A }, (c) => c.query("UPDATE api_keys SET revoked_at=now() WHERE key_id=$1", [k.keyId]), app);
    const r2 = await app.query("SELECT * FROM pyxis_resolve_api_key($1)", [k.keyId]);
    expect(r2.rows[0].revoked_at).not.toBeNull();
    expect(generateKey().token).not.toBe(k.token);
  });
});
