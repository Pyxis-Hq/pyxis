import { describe, expect, it } from "vitest";
import { isPrivateIp, normalizeDomain, verifyDomain, WELL_KNOWN } from "@/server/domain";
import { Umami } from "@/server/umami";

describe("domain normalization", () => {
  it.each([
    ["Example.COM", "example.com"],
    ["app.example.com.", "app.example.com"],
    ["bücher.example", "xn--bcher-kva.example"],
  ])("%s -> %s", (i, o) => expect(normalizeDomain(i)).toBe(o));
  it.each(["localhost", "127.0.0.1", "10.0.0.1", "[::1]", "example.com:8080", "example.com/path", "https://example.com", "user@example.com", "intranet", "a.local", "-bad.example.com", ""])(
    "rejects %s", (i) => expect(normalizeDomain(i)).toBeNull());
});

describe("SSRF guard", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "::1", "fd00::1", "::ffff:127.0.0.1"])("%s is private", (ip) => expect(isPrivateIp(ip)).toBe(true));
  it.each(["8.8.8.8", "93.184.216.34", "172.32.0.1", "2606:4700::1111"])("%s is public", (ip) => expect(isPrivateIp(ip)).toBe(false));
});

const T = "pyxis-verify=abc";
const deps = (o: { txt?: string[][] | Error; addrs?: string[]; res?: Partial<Response> & { text?: () => Promise<string> } }) => ({
  resolveTxt: (async () => { if (o.txt instanceof Error || !o.txt) throw new Error("nx"); return o.txt; }) as never,
  lookup: (async () => (o.addrs ?? ["93.184.216.34"]).map((address) => ({ address, family: 4 }))) as never,
  fetch: (async (url: string, init: RequestInit) => {
    expect(url.endsWith(WELL_KNOWN)).toBe(true);
    expect(init.redirect).toBe("manual"); // never follow redirects to unrelated hosts
    return { status: 200, text: async () => "", ...o.res } as Response;
  }) as never,
});

describe("domain verification", () => {
  it("accepts a matching DNS TXT (split strings joined)", async () => expect(await verifyDomain("a.com", T, deps({ txt: [["pyxis-verify=", "abc"]] }))).toMatchObject({ ok: true, method: "dns" }));
  it("accepts a matching well-known file", async () => expect(await verifyDomain("a.com", T, deps({ res: { text: async () => T + "\n" } }))).toMatchObject({ ok: true, method: "http" }));
  it("rejects wrong content, redirects and non-200", async () => {
    expect((await verifyDomain("a.com", T, deps({ res: { text: async () => "other" } }))).ok).toBe(false);
    expect((await verifyDomain("a.com", T, deps({ res: { status: 302 } }))).ok).toBe(false);
  });
  it("refuses domains resolving to private addresses (DNS rebinding / SSRF)", async () => {
    const r = await verifyDomain("evil.com", T, deps({ addrs: ["169.254.169.254"], res: { text: async () => T } }));
    expect(r.ok).toBe(false);
  });
});

describe("Umami client (fake server)", () => {
  const cfg = { url: "http://um", user: "u", password: "p", publicUrl: "https://stats.example" };
  const calls: string[] = [];
  const fake = (async (url: string, init: RequestInit = {}) => {
    calls.push(`${init.method ?? "GET"} ${url.replace("http://um", "")}`);
    const j = (b: unknown) => ({ ok: true, status: 200, json: async () => b }) as Response;
    if (url.endsWith("/api/auth/login")) return j({ token: "T" });
    if (url.endsWith("/api/websites")) return j({ id: "w1" });
    if (url.includes("/stats")) return j({ pageviews: { value: 100 }, visitors: { value: 40 }, visits: { value: 50 }, bounces: { value: 20 }, totaltime: { value: 5000 } });
    return j([{ x: "a", y: 3 }]);
  }) as never;
  it("creates sites, builds report with bounce rate and session duration, logs in once", async () => {
    const um = new Umami(cfg, fake);
    expect((await um.createWebsite("a.com", "a.com")).id).toBe("w1");
    const r = await um.report("w1", new Date(0), new Date(1000));
    expect(r).toMatchObject({ pageviews: 100, visitors: 40, bounce_rate: 0.4, avg_session_seconds: 100 });
    expect(calls.filter((c) => c.includes("auth/login"))).toHaveLength(1);
    expect(um.snippet("w1", "a.com")).toContain('src="https://stats.example/script.js"');
    expect(um.snippet("w1", "a.com")).toContain('data-domains="a.com"');
  });
});
