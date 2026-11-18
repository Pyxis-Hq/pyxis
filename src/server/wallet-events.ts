import type { PoolClient } from "pg";

// Wallet events are FRONTEND-REPORTED engagement signals. They are not ledger confirmation (docs/08).
export const WALLET_EVENTS = [
  "wallet_connect_started", "wallet_connected", "wallet_disconnect",
  "transaction_sign_started", "transaction_sign_completed", "transaction_sign_failed",
  "transaction_submit_started", "transaction_submit_completed", "transaction_submit_failed",
] as const;
export const PROVIDERS = ["freighter", "xbull", "albedo", "lobstr", "rabet", "hana", "ledger", "hot_wallet", "other"] as const;
export const NETWORKS = ["testnet", "public", "other"] as const;
const ALLOWED_KEYS = new Set(["event", "wallet_provider", "network", "flow", "failure_category", "sdk_version", "ts"]);
export const MAX_BATCH = 50;

export type WalletResult = { accepted: number; rejected: { index: number; reason: string }[] };

/** Strict allowlist: any unknown property (address, signature, xdr, ...) rejects the whole event. Nothing is stored but counts. */
export function validateWalletBatch(body: unknown): { ok: true; events: { event: string; provider: string; network: string; ts: number }[]; rejected: WalletResult["rejected"] } | { ok: false; reason: string } {
  const list = (body as { events?: unknown })?.events;
  if (!Array.isArray(list)) return { ok: false, reason: "events_array_required" };
  if (list.length > MAX_BATCH) return { ok: false, reason: "batch_too_large" };
  const events: { event: string; provider: string; network: string; ts: number }[] = [];
  const rejected: WalletResult["rejected"] = [];
  list.forEach((e, index) => {
    if (!e || typeof e !== "object" || Array.isArray(e)) return rejected.push({ index, reason: "not_an_object" });
    const o = e as Record<string, unknown>;
    const extra = Object.keys(o).find((k) => !ALLOWED_KEYS.has(k));
    if (extra) return rejected.push({ index, reason: "prohibited_property" });
    if (!(WALLET_EVENTS as readonly string[]).includes(o.event as string)) return rejected.push({ index, reason: "unknown_event" });
    const provider = (PROVIDERS as readonly string[]).includes(o.wallet_provider as string) ? (o.wallet_provider as string) : "other";
    const network = (NETWORKS as readonly string[]).includes(o.network as string) ? (o.network as string) : "other";
    if (o.failure_category !== undefined && !/^[a-z_]{1,32}$/.test(String(o.failure_category))) return rejected.push({ index, reason: "bad_failure_category" });
    // Time is taken from the server, not the client, so clients cannot back-fill history.
    events.push({ event: o.event as string, provider, network, ts: Date.now() });
  });
  return { ok: true, events, rejected };
}

export async function persistWalletEvents(c: PoolClient, projectId: string, events: { event: string; provider: string; network: string; ts: number }[]) {
  for (const e of events) {
    const bucket = new Date(Math.floor(e.ts / 60_000) * 60_000);
    await c.query(
      `INSERT INTO wallet_event_buckets(project_id, bucket_start, event_name, provider_category, network, event_count)
       VALUES ($1,$2,$3,$4,$5,1)
       ON CONFLICT (project_id, bucket_start, event_name, provider_category, network) DO UPDATE SET event_count = wallet_event_buckets.event_count + 1`,
      [projectId, bucket, e.event, e.provider, e.network],
    );
  }
}

export async function walletFunnel(c: PoolClient, projectId: string, from: Date, to: Date) {
  const { rows } = await c.query(
    "SELECT event_name, sum(event_count)::bigint AS n FROM wallet_event_buckets WHERE project_id=$1 AND bucket_start >= $2 AND bucket_start < $3 GROUP BY 1",
    [projectId, from, to],
  );
  const m = Object.fromEntries(rows.map((r) => [r.event_name, Number(r.n)]));
  return WALLET_EVENTS.map((e) => ({ event: e, count: m[e] ?? 0 }));
}
