// @pyxis-hq/wallets-kit (alpha). Framework-agnostic, browser-first, zero dependencies.
// Records wallet funnel events. Reported by the frontend: NOT proof of ledger inclusion.
// Never accepts addresses, signatures, XDR or free text. The server also rejects any such property.

export type WalletEvent =
  | "wallet_connect_started" | "wallet_connected" | "wallet_disconnect"
  | "transaction_sign_started" | "transaction_sign_completed" | "transaction_sign_failed"
  | "transaction_submit_started" | "transaction_submit_completed" | "transaction_submit_failed";

export type WalletProvider = "freighter" | "xbull" | "albedo" | "lobstr" | "rabet" | "hana" | "ledger" | "hot_wallet" | "other";
export type Network = "testnet" | "public" | "other";

export interface PyxisWalletOptions {
  endpoint: string; // e.g. https://pyxis.example/v1/wallet-events
  ingestKey: string; // pyx_live_...
  network?: Network;
  enabled?: boolean; // wire to your consent / opt-out control
  maxQueue?: number; // default 100; oldest events are dropped beyond this
  batchSize?: number; // default 20 (server max 50)
  flushIntervalMs?: number; // default 5000
  fetchImpl?: typeof fetch;
}

type Queued = { event: WalletEvent; wallet_provider?: WalletProvider; network: Network; failure_category?: string; sdk_version: string };
export const SDK_VERSION = "0.1.0-alpha.0";

export class PyxisWallet {
  private q: Queued[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private dropped = 0;
  private inflight: Promise<void> | null = null;
  private destroyed = false;
  private o: Required<Omit<PyxisWalletOptions, "fetchImpl">> & { fetchImpl: typeof fetch };

  constructor(opts: PyxisWalletOptions) {
    this.o = { network: "testnet", enabled: true, maxQueue: 100, batchSize: 20, flushIntervalMs: 5000, fetchImpl: (u: RequestInfo | URL, i?: RequestInit) => fetch(u, i), ...opts } as never;
    this.timer = setInterval(() => void this.flush(), this.o.flushIntervalMs);
    (this.timer as { unref?: () => void }).unref?.();
  }

  /** Never throws and never awaits the network: analytics must not interfere with a wallet flow. */
  track(event: WalletEvent, props: { wallet_provider?: WalletProvider; failure_category?: string } = {}): void {
    if (!this.o.enabled || this.destroyed) return;
    if (this.q.length >= this.o.maxQueue) { this.q.shift(); this.dropped++; }
    const fc = props.failure_category && /^[a-z_]{1,32}$/.test(props.failure_category) ? props.failure_category : undefined;
    this.q.push({ event, wallet_provider: props.wallet_provider, network: this.o.network, failure_category: fc, sdk_version: SDK_VERSION });
    if (this.q.length >= this.o.batchSize) void this.flush();
  }

  setEnabled(v: boolean) { this.o.enabled = v; if (!v) this.q = []; }
  get droppedCount() { return this.dropped; }
  get queued() { return this.q.length; }

  async flush(): Promise<void> {
    if (this.inflight) return this.inflight;
    if (!this.q.length) return;
    const batch = this.q.splice(0, Math.min(this.q.length, 50));
    this.inflight = (async () => {
      try {
        const r = await this.o.fetchImpl(this.o.endpoint, {
          method: "POST", keepalive: true,
          headers: { "content-type": "application/json", authorization: `Bearer ${this.o.ingestKey}` },
          body: JSON.stringify({ events: batch }),
        });
        if (r.status >= 500 || r.status === 429) this.requeue(batch); // transient only; 4xx are dropped, not retried
      } catch { this.requeue(batch); }
      finally { this.inflight = null; }
    })();
    return this.inflight;
  }

  private requeue(batch: Queued[]) {
    for (const e of batch.reverse()) { if (this.q.length >= this.o.maxQueue) { this.dropped++; continue; } this.q.unshift(e); }
  }

  destroy() {
    this.destroyed = true;
    if (this.timer) clearInterval(this.timer);
    this.q = [];
  }
}
