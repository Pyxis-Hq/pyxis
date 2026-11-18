import { describe, expect, it, vi } from "vitest";
import { PyxisWallet, WALLET_EVENTS, WALLET_PROVIDERS, NETWORKS, SDK_VERSION } from "@pyxis-hq/wallets-kit";
import { validateWalletBatch } from "@/server/wallet-events";

const ok = () => new Response(JSON.stringify({ accepted: 1, rejected: [] }), { status: 200 });
const make = (fetchImpl: typeof fetch, extra = {}) =>
  new PyxisWallet({ endpoint: "https://x.test/v1/wallet-events", ingestKey: "pyx_live_0123456789abcdef.k", fetchImpl, respectDoNotTrack: false, ...extra });

describe("@pyxis-hq/wallets-kit", () => {
  it("imports without touching browser globals and never throws", () => {
    const w = make(vi.fn(async () => ok()) as never);
    expect(() => w.track("nope" as never)).not.toThrow();
    expect(w.queued).toBe(0);
    w.destroy();
  });

  it("sends only allowlisted properties that the server accepts", async () => {
    const calls: { events: Record<string, unknown>[] }[] = [];
    const f = vi.fn(async (_u: unknown, init: RequestInit) => { calls.push(JSON.parse(init.body as string)); return ok(); });
    const w = make(f as never);
    for (const e of WALLET_EVENTS) for (const p of WALLET_PROVIDERS) w.track(e, { wallet_provider: p, failure_category: "user_rejected" });
    // address-like junk must never survive
    w.track("wallet_connected", { wallet_provider: "GABC", failure_category: "GABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOP", address: "G..." } as never);
    await w.flush();
    const all = calls.flatMap((c) => c.events);
    expect(all.length).toBeGreaterThan(0);
    for (const c of calls) {
      expect(c.events.length).toBeLessThanOrEqual(50);
      const v = validateWalletBatch(c);
      expect(v.ok && v.rejected).toEqual([]);
    }
    for (const e of all) {
      expect(Object.keys(e).every((k) => ["event", "wallet_provider", "network", "failure_category", "sdk_version"].includes(k))).toBe(true);
      expect((NETWORKS as readonly string[]).includes(e.network as string)).toBe(true);
      expect(e.sdk_version).toBe(SDK_VERSION);
    }
    expect(JSON.stringify(all)).not.toMatch(/GABC|address/);
    w.destroy();
  });

  it("drops oldest beyond maxQueue and counts it", () => {
    const w = make(vi.fn() as never, { maxQueue: 3, batchSize: 50 });
    for (let i = 0; i < 5; i++) w.track("wallet_connected");
    expect(w.queued).toBe(3);
    expect(w.droppedCount).toBe(2);
    w.destroy();
  });

  it("does nothing when disabled and clears the queue", () => {
    const w = make(vi.fn() as never);
    w.track("wallet_connected");
    w.setEnabled(false);
    expect(w.queued).toBe(0);
    w.track("wallet_connected");
    expect(w.queued).toBe(0);
    expect(w.stats().disabled).toBe(true);
    w.destroy();
  });

  it("requeues on 5xx and drops on other 4xx", async () => {
    let status = 503;
    const f = vi.fn(async () => new Response("{}", { status }));
    const w = make(f as never);
    w.track("wallet_connected");
    await w.flush();
    expect(w.queued).toBe(1);
    status = 400;
    (w as unknown as { retryAt: number }).retryAt = 0;
    await w.flush();
    expect(w.queued).toBe(0);
    expect(w.droppedCount).toBe(1);
    w.destroy();
  });

  it("opens the circuit after 3 consecutive 401s and stops sending", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 401 }));
    const w = make(f as never, { batchSize: 1 });
    for (let i = 0; i < 3; i++) { w.track("wallet_connected"); await w.flush(); }
    expect(w.stats().circuitOpen).toBe(true);
    const n = f.mock.calls.length;
    w.track("wallet_connected");
    await w.flush();
    expect(f.mock.calls.length).toBe(n);
    w.destroy();
  });

  it("splits a batch on 413", async () => {
    const sizes: number[] = [];
    const f = vi.fn(async (_u: unknown, init: RequestInit) => {
      const n = JSON.parse(init.body as string).events.length;
      sizes.push(n);
      return n > 2 ? new Response("{}", { status: 413 }) : ok();
    });
    const w = make(f as never, { batchSize: 8 });
    for (let i = 0; i < 8; i++) w.track("wallet_connected");
    await w.flush();
    expect(sizes[0]).toBe(8);
    expect(sizes.slice(1).every((n) => n <= 4)).toBe(true);
    expect(w.queued).toBe(0);
    w.destroy();
  });

  it("honours Do Not Track", () => {
    const orig = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", { value: { doNotTrack: "1" }, configurable: true });
    const w = make(vi.fn() as never, { respectDoNotTrack: true });
    w.track("wallet_connected");
    expect(w.queued).toBe(0);
    w.destroy();
    if (orig) Object.defineProperty(globalThis, "navigator", orig); else delete (globalThis as { navigator?: unknown }).navigator;
  });
});

describe("react bindings", () => {
  it("render on the server without a window", async () => {
    const { renderToString } = await import("react-dom/server");
    const { createElement } = await import("react");
    const { PyxisProvider, usePyxis } = await import("@pyxis-hq/wallets-kit/react");
    const Child = () => { usePyxis().track("wallet_connected"); return createElement("span", null, "ok"); };
    const html = renderToString(createElement(PyxisProvider, { endpoint: "https://x.test/e", ingestKey: "k", children: createElement(Child) }));
    expect(html).toContain("ok");
  });
});
