import { describe, expect, it } from "vitest";
import { normalizePath, resolveRoute } from "@/server/ingest/normalize";
import { mergeCounts, quantile, rebucket } from "@/server/ingest/histogram";
import { parseOtlpMetrics } from "@/server/ingest/otlp";
import { generateKey, parseToken } from "@/server/keys";

const G = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
const C = "CA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUWDA";

describe("route normalization", () => {
  it.each([
    ["/users/123/orders/456", "/users/{id}/orders/{id}"],
    ["/u/550e8400-e29b-41d4-a716-446655440000", "/u/{uuid}"],
    [`/accounts/${G}/payments`, "/accounts/{stellar_account}/payments"],
    [`/contracts/${C}`, "/contracts/{contract_id}"],
    ["/tx/" + "a".repeat(64), "/tx/{hash}"],
    ["/health/", "/health"],
    ["//a///b?x=1#f", "/a/b"],
    ["/%E0%A4%A", "/_unmatched"],
  ])("%s -> %s", (i, o) => expect(normalizePath(i)).toBe(o));

  it("caps segments", () => expect(normalizePath("/a".repeat(20))).toBe("/_unmatched"));
  it("prefers http.route and still scrubs raw ids", () => {
    expect(resolveRoute("/orders/{orderId}", "/orders/99")).toBe("/orders/{orderId}");
    expect(resolveRoute("/orders/99", undefined)).toBe("/orders/{id}");
    expect(resolveRoute("/a b?x", "/ok/1")).toBe("/ok/{id}");
  });
});

describe("histograms", () => {
  it("merges before computing quantiles (never averages percentiles)", () => {
    const a = rebucket([5, 10, 25], [90, 0, 0, 0]); // 90 fast
    const b = rebucket([5, 10, 25], [0, 0, 0, 10]); // 10 slow overflow -> +Inf
    const merged = mergeCounts(a, b);
    expect(quantile(merged, 0.5)!).toBeLessThanOrEqual(5);
    expect(quantile(merged, 0.99)!).toBeGreaterThanOrEqual(10_000);
  });
  it("returns null when empty", () => expect(quantile(new Array(12).fill(0), 0.5)).toBeNull());
});

const now = Date.now();
const point = (over: Record<string, unknown> = {}, attrs: Record<string, string | number> = {}) => ({
  timeUnixNano: String(BigInt(now) * 1_000_000n),
  explicitBounds: [0.005, 0.05, 0.5],
  bucketCounts: ["8", "2", "0", "0"],
  sum: 0.06,
  attributes: Object.entries({ "http.request.method": "GET", "url.path": "/users/42", "http.response.status_code": 200, ...attrs }).map(
    ([key, v]) => ({ key, value: typeof v === "number" ? { intValue: v } : { stringValue: v } }),
  ),
  ...over,
});
const req = (metric: Record<string, unknown>, resAttrs = [{ key: "service.name", value: { stringValue: "api" } }]) => ({
  resourceMetrics: [{ resource: { attributes: resAttrs }, scopeMetrics: [{ metrics: [metric] }] }],
});
const dur = (dps: unknown[], extra: Record<string, unknown> = {}) => ({
  name: "http.server.request.duration",
  unit: "s",
  histogram: { aggregationTemporality: 1, dataPoints: dps },
  ...extra,
});

describe("OTLP parsing", () => {
  it("normalizes, converts s->ms, and counts from the histogram", () => {
    const r = parseOtlpMetrics(req(dur([point()])), now);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ route: "/users/{id}", count: 10, service: "api", status: 200, method: "GET" });
    expect(r.rows[0].sumMs).toBeCloseTo(60);
  });
  it("ignores tenant attributes in payload (no tenant field is ever read)", () => {
    const r = parseOtlpMetrics(req(dur([point({}, { "tenant.id": "victim", project_id: "victim" })])), now);
    expect(JSON.stringify(r.rows)).not.toContain("victim");
  });
  it("rejects cumulative temporality, disallowed metrics, bad status, stale timestamps", () => {
    expect(parseOtlpMetrics(req({ ...dur([point()]), histogram: { aggregationTemporality: 2, dataPoints: [point()] } }), now).dropped).toHaveProperty("cumulative_temporality_unsupported");
    expect(parseOtlpMetrics(req({ name: "process.cpu.time", sum: { dataPoints: [{}] } }), now).dropped).toHaveProperty("metric_not_allowed");
    expect(parseOtlpMetrics(req(dur([point({}, { "http.response.status_code": 999 })])), now).dropped).toHaveProperty("invalid_status_code");
    expect(parseOtlpMetrics(req(dur([point({ timeUnixNano: "1000000000" })])), now).dropped).toHaveProperty("timestamp_too_old");
  });
  it("drops sensitive attributes: nothing from query strings or addresses survives", () => {
    const r = parseOtlpMetrics(req(dur([point({}, { "url.path": `/pay/${G}?secret=abc`, "user.id": "u1" })])), now);
    expect(JSON.stringify(r.rows)).not.toMatch(/secret|GBRP|u1/);
  });
});

describe("api key format", () => {
  it("round-trips and rejects junk", () => {
    const k = generateKey();
    expect(parseToken(k.token)).toEqual({ keyId: k.keyId, secret: k.secret });
    expect(parseToken("pyx_live_x.y")).toBeNull();
    expect(k.secretHash).not.toContain(k.secret);
  });
});
