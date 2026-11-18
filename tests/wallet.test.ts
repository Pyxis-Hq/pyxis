import { describe, expect, it } from "vitest";
import { validateWalletBatch } from "@/server/wallet-events";
import { PyxisWallet } from "@pyxis-hq/wallets-kit";

const G = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";

describe("wallet event schema (server)", () => {
  it("accepts allowlisted events", () => {
    const r = validateWalletBatch({ events: [{ event: "wallet_connected", wallet_provider: "freighter", network: "testnet" }] });
    expect(r.ok && r.events).toHaveLength(1);
  });
  it.each(["address", "public_key", "signature", "xdr", "message", "email"])("rejects prohibited property %s", (k) => {
    const r = validateWalletBatch({ events: [{ event: "wallet_connected", [k]: G }] });
    expect(r.ok && r.events).toHaveLength(0);
    expect(r.ok && r.rejected[0].reason).toBe("prohibited_property");
  });
  it("rejects unknown events, oversized batches, free-text failure categories", () => {
    expect(validateWalletBatch({ events: [{ event: "drain_wallet" }] })).toMatchObject({ ok: true, events: [] });
    expect(validateWalletBatch({ events: new Array(51).fill({ event: "wallet_connected" }) })).toMatchObject({ ok: false });
    expect(validateWalletBatch({ events: [{ event: "transaction_sign_failed", failure_category: "User said: GABC..." }] })).toMatchObject({ events: [] });
  });
  it("ignores client timestamps (server time only)", () => {
    const r = validateWalletBatch({ events: [{ event: "wallet_connected", ts: 1 }] });
    expect(r.ok && r.events[0].ts).toBeGreaterThan(1_000_000);
  });
});

describe("SDK", () => {
  const mk = (fetchImpl: typeof fetch, extra = {}) => new PyxisWallet({ endpoint: "http://x/e", ingestKey: "k", flushIntervalMs: 60_000, fetchImpl, ...extra });
  it("queue stays bounded and counts drops", () => {
    const s = mk((async () => new Response("{}")) as never, { maxQueue: 3, batchSize: 99 });
    for (let i = 0; i < 10; i++) s.track("wallet_connected");
    expect(s.queued).toBe(3); expect(s.droppedCount).toBe(7); s.destroy();
  });
  it("network failure never throws into the app and events are retried", async () => {
    const s = mk((async () => { throw new Error("offline"); }) as never, { batchSize: 99 });
    s.track("wallet_connected");
    await expect(s.flush()).resolves.toBeUndefined();
    expect(s.queued).toBe(1); s.destroy();
  });
  it("disabled and destroyed SDKs emit nothing; payload carries no addresses", async () => {
    const bodies: string[] = [];
    const f = (async (_u: string, i: RequestInit) => { bodies.push(String(i.body)); return new Response("{}"); }) as never;
    const s = mk(f, { batchSize: 99 });
    s.track("wallet_connected", { wallet_provider: "freighter" });
    s.setEnabled(false); s.track("wallet_disconnect"); await s.flush();
    expect(bodies).toHaveLength(0);
    s.setEnabled(true); s.track("wallet_connected", { wallet_provider: "freighter" }); await s.flush();
    expect(bodies[0]).not.toMatch(/G[A-Z2-7]{55}|signature|xdr/);
    s.destroy(); s.track("wallet_connected"); expect(s.queued).toBe(0);
  });
});
