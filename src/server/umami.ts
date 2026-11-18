// Thin client over Umami's documented REST API. Pyxis never touches Umami's database (docs/07).
// Written against the Umami v2 API docs; exercised in tests against a fake server only, NOT yet against a real Umami release.
type Cfg = { url: string; user: string; password: string; publicUrl: string };

export const umamiConfig = (): Cfg | null => {
  const url = process.env.UMAMI_URL;
  if (!url || !process.env.UMAMI_USER || !process.env.UMAMI_PASSWORD) return null;
  return { url: url.replace(/\/$/, ""), user: process.env.UMAMI_USER, password: process.env.UMAMI_PASSWORD, publicUrl: (process.env.UMAMI_PUBLIC_URL ?? url).replace(/\/$/, "") };
};

export class Umami {
  private token: string | null = null;
  constructor(private cfg: Cfg, private f: typeof fetch = fetch) {}

  private async req<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
    if (!this.token) {
      const r = await this.f(this.cfg.url + "/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: this.cfg.user, password: this.cfg.password }) });
      if (!r.ok) throw new Error("umami_login_failed");
      this.token = (await r.json()).token;
    }
    const r = await this.f(this.cfg.url + path, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${this.token}`, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(8000) });
    if (r.status === 401 && retry) { this.token = null; return this.req<T>(path, init, false); }
    if (!r.ok) throw new Error(`umami_${r.status}`);
    return r.json() as Promise<T>;
  }

  createWebsite(name: string, domain: string) {
    return this.req<{ id: string }>("/api/websites", { method: "POST", body: JSON.stringify({ name, domain }) });
  }

  async report(websiteId: string, from: Date, to: Date) {
    const q = `startAt=${+from}&endAt=${+to}`;
    const base = `/api/websites/${encodeURIComponent(websiteId)}`;
    const stats = await this.req<{ pageviews: number | { value: number }; visitors: number | { value: number }; visits: number | { value: number }; bounces: number | { value: number }; totaltime: number | { value: number } }>(`${base}/stats?${q}`);
    const v = (x: number | { value: number }) => (typeof x === "number" ? x : x?.value ?? 0);
    const metric = async (type: string) =>
      (await this.req<{ x: string; y: number }[]>(`${base}/metrics?${q}&type=${type}&limit=10`)).map((r) => ({ name: r.x, count: r.y }));
    const [referrers, countries, browsers, devices] = await Promise.all([metric("referrer"), metric("country"), metric("browser"), metric("device")]);
    const visits = v(stats.visits);
    return {
      pageviews: v(stats.pageviews), visitors: v(stats.visitors), visits,
      bounce_rate: visits ? v(stats.bounces) / visits : 0,
      avg_session_seconds: visits ? v(stats.totaltime) / visits : 0,
      referrers, countries, browsers, devices,
    };
  }

  // Version-pinned tracker: served from the Umami we operate; no third-party remote script.
  snippet(websiteId: string, domain: string) {
    return `<script defer src="${this.cfg.publicUrl}/script.js" data-website-id="${websiteId}" data-domains="${domain}"></script>`;
  }
}
