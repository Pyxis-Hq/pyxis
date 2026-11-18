import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "./db";

export type KeyScope = "ingest" | "query";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** pyx_live_<keyId>.<secret>; secret is 32 random bytes so a fast hash is appropriate (no password stretching needed). */
export function generateKey() {
  const keyId = randomBytes(8).toString("hex");
  const secret = randomBytes(32).toString("base64url");
  return { keyId, secret, token: `pyx_live_${keyId}.${secret}`, secretHash: sha(secret) };
}

export function parseToken(token: string): { keyId: string; secret: string } | null {
  const m = /^pyx_live_([0-9a-f]{16})\.([A-Za-z0-9_-]{43})$/.exec(token.trim());
  return m ? { keyId: m[1], secret: m[2] } : null;
}

export type ResolvedKey = { id: string; projectId: string; scopes: string[] };
export type KeyFailure = "malformed" | "unknown" | "bad_secret" | "revoked" | "expired" | "project_inactive";

export async function authenticateKey(
  header: string | null,
  scope: KeyScope,
): Promise<{ ok: true; key: ResolvedKey } | { ok: false; reason: KeyFailure | "scope" }> {
  const token = header?.replace(/^Bearer\s+/i, "") ?? "";
  const parsed = parseToken(token);
  if (!parsed) return { ok: false, reason: "malformed" };
  const { rows } = await pool().query("SELECT * FROM pyxis_resolve_api_key($1)", [parsed.keyId]);
  const row = rows[0];
  if (!row) return { ok: false, reason: "unknown" };
  const a = Buffer.from(sha(parsed.secret), "hex");
  const b = Buffer.from(row.secret_hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad_secret" };
  if (row.revoked_at) return { ok: false, reason: "revoked" };
  if (row.expires_at && new Date(row.expires_at) < new Date()) return { ok: false, reason: "expired" };
  if (row.project_status !== "active") return { ok: false, reason: "project_inactive" };
  if (!row.scopes.includes(scope)) return { ok: false, reason: "scope" };
  return { ok: true, key: { id: row.id, projectId: row.project_id, scopes: row.scopes } };
}

export async function createKey(c: PoolClient, projectId: string, name: string, scopes: KeyScope[]) {
  const k = generateKey();
  await c.query(
    "INSERT INTO api_keys(project_id, key_id, secret_hash, name, scopes) VALUES ($1,$2,$3,$4,$5)",
    [projectId, k.keyId, k.secretHash, name, scopes],
  );
  return { keyId: k.keyId, token: k.token }; // token is shown once, never stored
}
