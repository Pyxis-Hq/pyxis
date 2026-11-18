import { createHash, randomBytes } from "node:crypto";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { cookies } from "next/headers";
import { pool, withContext } from "../db";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
export const COOKIE = "pyxis_session";
const CHALLENGE_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 7 * 24 * 3600_000;

export const operatorAccounts = () => (process.env.OPERATOR_ACCOUNTS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** SEP-43 style message. Signed payload = sha256("Stellar Signed Message:\n" + message). */
export function challengeMessage(account: string, nonce: string, expiresAt: Date) {
  return `Pyxis sign-in (testnet)\naccount: ${account}\nnonce: ${nonce}\nexpires: ${expiresAt.toISOString()}`;
}
export const signedMessageHash = (message: string) =>
  createHash("sha256").update("Stellar Signed Message:\n" + message).digest();

export async function createChallenge(account: string) {
  if (!StrKey.isValidEd25519PublicKey(account)) throw new Error("invalid_account");
  const nonce = randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + CHALLENGE_TTL_MS);
  await pool().query("INSERT INTO auth_challenges(nonce, stellar_account, expires_at) VALUES ($1,$2,$3)", [nonce, account, expires]);
  return { nonce, message: challengeMessage(account, nonce, expires) };
}

/** Verifies the signature over the server-issued challenge; single use, short lived. Returns a session token. */
export async function verifyChallenge(account: string, nonce: string, signatureB64: string) {
  const { rows } = await pool().query(
    "UPDATE auth_challenges SET used_at = now() WHERE nonce=$1 AND stellar_account=$2 AND used_at IS NULL AND expires_at > now() RETURNING expires_at",
    [nonce, account],
  );
  if (!rows[0]) throw new Error("challenge_invalid");
  const msg = challengeMessage(account, nonce, new Date(rows[0].expires_at));
  const ok = Keypair.fromPublicKey(account).verify(signedMessageHash(msg), Buffer.from(signatureB64, "base64"));
  if (!ok) throw new Error("signature_invalid");
  const isOp = operatorAccounts().includes(account);
  const u = await pool().query(
    "INSERT INTO users(stellar_account, is_operator) VALUES ($1,$2) ON CONFLICT (stellar_account) DO UPDATE SET is_operator = EXCLUDED.is_operator RETURNING id",
    [account, isOp],
  );
  const token = randomBytes(32).toString("base64url");
  await pool().query("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES ($1,$2,$3)", [sha(token), u.rows[0].id, new Date(Date.now() + SESSION_TTL_MS)]);
  return token;
}

export type Me = { id: string; account: string; isOperator: boolean };

export async function currentUser(): Promise<Me | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const { rows } = await pool().query(
    "SELECT u.id, u.stellar_account, u.is_operator FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash=$1 AND s.expires_at > now()",
    [sha(token)],
  );
  return rows[0] ? { id: rows[0].id, account: rows[0].stellar_account, isOperator: rows[0].is_operator } : null;
}

export async function destroySession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) await pool().query("DELETE FROM sessions WHERE token_hash=$1", [sha(token)]);
}

export type Role = "owner" | "admin" | "developer" | "analyst" | "viewer";
const RANK: Record<Role, number> = { viewer: 1, analyst: 2, developer: 3, admin: 4, owner: 5 };

/** Authorizes a member (or operator for read) on a project, then returns the DB context to use. */
export async function authorize(user: Me, projectId: string, min: Role, opts: { operatorRead?: boolean } = {}) {
  if (!/^[0-9a-f-]{36}$/.test(projectId)) return null;
  const { rows } = await pool().query("SELECT pyxis_user_role($1,$2) AS role", [user.id, projectId]);
  const role = rows[0]?.role as Role | null;
  if (role && RANK[role] >= RANK[min]) return { projectId, role };
  if (opts.operatorRead && user.isOperator) return { projectId, role: null };
  return null;
}

export { withContext };
