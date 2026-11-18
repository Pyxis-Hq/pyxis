// @pyxis-hq/wallets-kit. Framework-agnostic, browser-first, zero dependencies.
// Records wallet funnel events. Reported by the frontend: NOT proof of ledger inclusion.
// Never accepts addresses, signatures, XDR or free text. The server also rejects any such property.

declare const __SDK_VERSION__: string;

export const SDK_VERSION: string = typeof __SDK_VERSION__ === "string" ? __SDK_VERSION__ : "0.0.0-dev";

export const WALLET_EVENTS = [
  "wallet_connect_started", "wallet_connected", "wallet_disconnect",
  "transaction_sign_started", "transaction_sign_completed", "transaction_sign_failed",
  "transaction_submit_started", "transaction_submit_completed", "transaction_submit_failed",
] as const;
export const WALLET_PROVIDERS = ["freighter", "xbull", "albedo", "lobstr", "rabet", "hana", "ledger", "hot_wallet", "other"] as const;
export const NETWORKS = ["testnet", "public", "other"] as const;

export type WalletEvent = (typeof WALLET_EVENTS)[number];
export type WalletProvider = (typeof WALLET_PROVIDERS)[number];
export type Network = (typeof NETWORKS)[number];

export interface TrackProps {
  wallet_provider?: WalletProvider;
  failure_category?: string;
}

export interface PyxisWalletOptions {
  /** Full URL of the wallet-events endpoint, e.g. https://pyxis.example/v1/wallet-events */
  endpoint: string;
  /** Ingest key, `pyx_live_...`. Safe to ship in a browser: it can only write counts. */
  ingestKey: string;
  network?: Network;
  /** Wire to your consent / opt-out control. Default true. */
  enabled?: boolean;
  /** Honour the browser Do Not Track and Global Privacy Control signals. Default true. */
  respectDoNotTrack?: boolean;
  /** Maximum queued events; the oldest are dropped beyond this. Default 100. */
  maxQueue?: number;
  /** Events per request, 1 to 50. Default 20. */
  batchSize?: number;
  /** Periodic flush interval in ms. Default 5000. */
  flushIntervalMs?: number;
  /** Log SDK decisions to the console (the ingest key is never logged). Default false. */
  debug?: boolean;
  fetchImpl?: typeof fetch;
}

export interface PyxisStats {
  queued: number;
  sent: number;
  dropped: number;
  rejected: number;
  disabled: boolean;
  circuitOpen: boolean;
}

type Queued = { event: WalletEvent; wallet_provider?: WalletProvider; network: Network; failure_category?: string; sdk_version: string };

const MAX_SERVER_BATCH = 50;
const MAX_BODY_CHARS = 15_000; // server limit is 20,000 characters
const MAX_RETRIES = 5;
const BREAKER_AFTER = 3;
const FAILURE_RE = /^[a-z_]{1,32}$/;

export function isWalletEvent(v: unknown): v is WalletEvent {
  return typeof v === "string" && (WALLET_EVENTS as readonly string[]).includes(v);
}

function clamp(n: unknown, lo: number, hi: number, d: number): number {
  return typeof n === "number" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.floor(n))) : d;
}

function privacyOptOut(): boolean {
  try {
    const nav = (globalThis as { navigator?: { doNotTrack?: string | null; globalPrivacyControl?: boolean } }).navigator;
    return nav?.doNotTrack === "1" || nav?.globalPrivacyControl === true;
  } catch { return false; }
}

export class PyxisWallet {
  private q: Queued[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private inflight: Promise<void> | null = null;
  private destroyed = false;
  private started = false;
  private enabled: boolean;
  private sentN = 0;
  private droppedN = 0;
  private rejectedN = 0;
  private authFailures = 0;
  private breaker = false;
  private retries = 0;
  private retryAt = 0;
  private readonly o: {
    endpoint: string; ingestKey: string; network: Network; respectDoNotTrack: boolean;
    maxQueue: number; batchSize: number; flushIntervalMs: number; debug: boolean; fetchImpl?: typeof fetch;
  };
  private readonly onHide = () => { if (typeof document === "undefined" || document.visibilityState === "hidden") void this.flush(); };
  private readonly onPageHide = () => { void this.flush(); };

  constructor(opts: PyxisWalletOptions) {
    this.enabled = opts.enabled !== false;
    this.o = {
      endpoint: String(opts.endpoint ?? ""),
      ingestKey: String(opts.ingestKey ?? ""),
      network: (NETWORKS as readonly string[]).includes(opts.network as string) ? (opts.network as Network) : "testnet",
      respectDoNotTrack: opts.respectDoNotTrack !== false,
      maxQueue: clamp(opts.maxQueue, 1, 10_000, 100),
      batchSize: clamp(opts.batchSize, 1, MAX_SERVER_BATCH, 20),
      flushIntervalMs: clamp(opts.flushIntervalMs, 250, 600_000, 5000),
      debug: opts.debug === true,
      fetchImpl: opts.fetchImpl,
    };
  }

  /** Never throws and never awaits the network: analytics must not interfere with a wallet flow. */
  track(event: WalletEvent, props: TrackProps = {}): void {
    try {
      if (!this.active()) return;
      if (!isWalletEvent(event)) return this.log("ignored unknown event");
      const p = props ?? {};
      const provider = (WALLET_PROVIDERS as readonly string[]).includes(p.wallet_provider as string) ? p.wallet_provider : p.wallet_provider === undefined ? undefined : "other";
      const fc = typeof p.failure_category === "string" && FAILURE_RE.test(p.failure_category) ? p.failure_category : undefined;
      this.start();
      if (this.q.length >= this.o.maxQueue) { this.q.shift(); this.droppedN++; }
      this.q.push({ event, wallet_provider: provider as WalletProvider | undefined, network: this.o.network, failure_category: fc, sdk_version: SDK_VERSION });
      if (this.q.length >= this.o.batchSize) void this.flush();
    } catch { /* analytics never throws */ }
  }

  setEnabled(v: boolean): void {
    this.enabled = v === true;
    if (!this.enabled) this.q = [];
  }

  get droppedCount(): number { return this.droppedN; }
  get queued(): number { return this.q.length; }

  stats(): PyxisStats {
    return { queued: this.q.length, sent: this.sentN, dropped: this.droppedN, rejected: this.rejectedN, disabled: !this.active(), circuitOpen: this.breaker };
  }

  /** Sends queued events now. Resolves when the in-flight request settles. Never rejects. */
  async flush(): Promise<void> {
    try {
      if (this.inflight) return await this.inflight;
      if (!this.q.length || !this.active() || this.breaker) return;
      this.inflight = this.drain().finally(() => { this.inflight = null; });
      await this.inflight;
    } catch { /* never throws */ }
  }

  destroy(): void {
    this.destroyed = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stop();
    this.q = [];
  }

  private active(): boolean {
    if (this.destroyed || !this.enabled || this.breaker) return false;
    if (!this.o.endpoint || !this.o.ingestKey) return false;
    return !(this.o.respectDoNotTrack && privacyOptOut());
  }

  private log(msg: string) {
    if (this.o.debug) console.debug(`[pyxis] ${msg}`);
  }

  private start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    this.timer = setInterval(() => void this.flush(), this.o.flushIntervalMs);
    (this.timer as { unref?: () => void }).unref?.();
    try {
      document.addEventListener("visibilitychange", this.onHide);
      window.addEventListener("pagehide", this.onPageHide);
    } catch { /* ignore */ }
  }

  private stop() {
    if (typeof window === "undefined") return;
    try {
      document.removeEventListener("visibilitychange", this.onHide);
      window.removeEventListener("pagehide", this.onPageHide);
    } catch { /* ignore */ }
  }

  private async drain(): Promise<void> {
    while (this.q.length && this.active()) {
      if (Date.now() < this.retryAt) return;
      const batch = this.take();
      const outcome = await this.send(batch);
      if (outcome === "retry") {
        this.requeue(batch);
        if (++this.retries > MAX_RETRIES) { this.droppedN += this.q.length; this.q = []; this.retries = 0; return; }
        this.retryAt = Date.now() + Math.min(30_000, 500 * 2 ** this.retries) * (0.5 + Math.random() * 0.5);
        return;
      }
      this.retries = 0;
      this.retryAt = 0;
    }
  }

  private take(): Queued[] {
    const batch: Queued[] = [];
    let chars = 2;
    while (this.q.length && batch.length < Math.min(this.o.batchSize, MAX_SERVER_BATCH)) {
      const len = JSON.stringify(this.q[0]).length + 1;
      if (batch.length && chars + len > MAX_BODY_CHARS) break;
      chars += len;
      batch.push(this.q.shift() as Queued);
    }
    return batch;
  }

  private async send(batch: Queued[]): Promise<"ok" | "retry" | "drop"> {
    const f = this.o.fetchImpl ?? (typeof fetch === "function" ? fetch : undefined);
    if (!f) { this.droppedN += batch.length; return "drop"; }
    try {
      const r = await f(this.o.endpoint, {
        method: "POST",
        keepalive: true,
        credentials: "omit",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.o.ingestKey}` },
        body: JSON.stringify({ events: batch }),
      });
      if (r.status === 401 || r.status === 403) {
        this.droppedN += batch.length;
        if (++this.authFailures >= BREAKER_AFTER) { this.breaker = true; this.q = []; this.log("ingest key rejected; sending stopped"); }
        return "drop";
      }
      this.authFailures = 0;
      if (r.status === 413 && batch.length > 1) {
        const half = Math.ceil(batch.length / 2);
        const a = await this.send(batch.slice(0, half));
        const b = await this.send(batch.slice(half));
        return a === "retry" || b === "retry" ? "retry" : "ok";
      }
      if (r.status >= 500 || r.status === 429) return "retry";
      if (r.ok) {
        this.sentN += batch.length;
        try {
          const j = (await r.json()) as { rejected?: unknown[] };
          if (Array.isArray(j?.rejected)) this.rejectedN += j.rejected.length;
        } catch { /* body optional */ }
        return "ok";
      }
      this.droppedN += batch.length; // other 4xx: not retried
      return "drop";
    } catch {
      return "retry";
    }
  }

  private requeue(batch: Queued[]) {
    for (const e of batch.reverse()) {
      if (this.q.length >= this.o.maxQueue) { this.droppedN++; continue; }
      this.q.unshift(e);
    }
  }
}

let singleton: PyxisWallet | null = null;

/** Returns one shared instance per page (SSR-safe: nothing starts until the first track). */
export function createPyxisWallet(opts: PyxisWalletOptions): PyxisWallet {
  singleton ??= new PyxisWallet(opts);
  return singleton;
}
