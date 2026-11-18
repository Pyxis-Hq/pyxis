// Seeds SYNTHETIC demo data through the real ingestion path. Everything is labelled synthetic; never present it as production traffic.
import { Pool } from "pg";
import { withContext } from "../src/server/db";
import { createKey } from "../src/server/keys";
import { parseOtlpMetrics, persist } from "../src/server/ingest/otlp";

const app = new Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://pyxis_app:pyxis_app@localhost:54329/pyxis" });
const ADMIN = "G" + "A".repeat(55); // placeholder owner for demo projects (not a real key)
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

async function ensureProject(name: string) {
  const u = await app.query("INSERT INTO users(stellar_account) VALUES ($1) ON CONFLICT (stellar_account) DO UPDATE SET stellar_account=EXCLUDED.stellar_account RETURNING id", [ADMIN]);
  const ex = await app.query("SELECT project_id FROM pyxis_user_projects($1) WHERE name=$2", [u.rows[0].id, name]);
  if (ex.rows[0]) return ex.rows[0].project_id as string;
  return (await app.query("SELECT pyxis_create_project($1,$2,$3) AS id", [u.rows[0].id, name, "Synthetic demo data"])).rows[0].id as string;
}

const ROUTES: [string, string, number][] = [
  ["GET", "/accounts/{id}", 60], ["GET", "/accounts/{id}/payments", 35], ["POST", "/transactions", 25], ["GET", "/ledgers/{id}", 15], ["GET", "/health", 10],
];

async function seed(name: string, scale: number) {
  const pid = await ensureProject(name);
  const now = Date.now();
  for (let m = 6 * 60; m >= 0; m--) {
    const t = now - m * 60_000;
    const rows = [];
    for (const [method, route, w] of ROUTES) {
      for (const status of [200, 200, 200, 404, 500]) {
        const n = Math.round((w * scale * rnd(0.6, 1.4)) / (status === 200 ? 3 : status === 404 ? 40 : 90)) + 0;
        if (n < 1) continue;
        const slow = Math.round(n * (status === 500 ? 0.3 : 0.04)), mid = Math.round(n * 0.25), fast = Math.max(0, n - slow - mid);
        rows.push({
          timeUnixNano: String(BigInt(t) * 1_000_000n), explicitBounds: [10, 50, 250, 1000], bucketCounts: [String(fast), String(mid), String(slow), "0", "0"].map(Number).map(String),
          sum: fast * 6 + mid * 30 + slow * 400,
          attributes: [
            { key: "http.request.method", value: { stringValue: method } }, { key: "http.route", value: { stringValue: route } },
            { key: "http.response.status_code", value: { intValue: status } },
          ],
        });
      }
    }
    const parsed = parseOtlpMetrics({ resourceMetrics: [{
      resource: { attributes: [{ key: "service.name", value: { stringValue: "synthetic-api" } }, { key: "deployment.environment.name", value: { stringValue: "testnet" } }] },
      scopeMetrics: [{ metrics: [{ name: "http.server.request.duration", unit: "ms", histogram: { aggregationTemporality: 1, dataPoints: rows } }] }],
    }] }, now);
    await withContext({ projectId: pid }, (c) => persist(c, pid, parsed), app);
  }
  const key = await withContext({ projectId: pid }, (c) => createKey(c, pid, "seed (synthetic)", ["ingest"]), app);
  console.log(`${name}: project ${pid}\n  ingest key (shown once): ${key.token}`);
}

await seed("Synthetic · Horizon Gateway", 30);
await seed("Synthetic · Wallet Backend", 12);
await app.end();
