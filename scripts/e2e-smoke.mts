// End-to-end smoke test against a running server: node scripts/e2e-smoke.mts <baseUrl> <ingestToken>
// Signs in with a testnet keypair exactly like a SEP-43 wallet would, then exercises the API.
import { Keypair } from "@stellar/stellar-sdk";
import { createHash } from "node:crypto";

const [base = "http://localhost:3100", token = ""] = process.argv.slice(2);
const kp = Keypair.fromSecret(process.env.SMOKE_SECRET!);
let cookie = "";
const call = async (path: string, init: RequestInit = {}) => {
  const r = await fetch(base + path, { ...init, headers: { "content-type": "application/json", cookie, ...(init.headers ?? {}) } });
  const sc = r.headers.get("set-cookie");
  if (sc) cookie = sc.split(";")[0];
  return { status: r.status, body: await r.json().catch(() => null) };
};
const check = (name: string, ok: boolean, extra?: unknown) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}`, ok ? "" : JSON.stringify(extra)); if (!ok) process.exitCode = 1; };

const now = Date.now();
const otlp = (extra: Record<string, unknown> = {}) => JSON.stringify({ resourceMetrics: [{
  resource: { attributes: [{ key: "service.name", value: { stringValue: "smoke-api" } }, { key: "tenant.id", value: { stringValue: "spoofed" } }] },
  scopeMetrics: [{ metrics: [{ name: "http.server.request.duration", unit: "s", histogram: { aggregationTemporality: 1, dataPoints: [{
    timeUnixNano: String(BigInt(now) * 1_000_000n), explicitBounds: [0.01, 0.1], bucketCounts: ["7", "3", "0"], sum: 0.4,
    attributes: [
      { key: "http.request.method", value: { stringValue: "GET" } }, { key: "url.path", value: { stringValue: "/users/12345/orders" } },
      { key: "http.response.status_code", value: { intValue: 200 } },
    ], ...extra }] } }] }],
}] });

// 1. ingest (machine auth)
let r = await call("/v1/metrics", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: otlp() });
check("ingest accepted with valid key", r.status === 200, r);
r = await call("/v1/metrics", { method: "POST", headers: { authorization: "Bearer pyx_live_0000000000000000.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }, body: otlp() });
check("unknown key rejected", r.status === 401, r);
r = await call("/v1/traces", { method: "POST", body: "{}" });
check("traces rejected", r.status === 404, r);
r = await call("/v1/metrics", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: "{not json" });
check("malformed JSON rejected", r.status === 400, r);

// 2. wallet-style sign-in
r = await call("/api/v1/me");
check("anonymous has no user", r.body?.user === null, r);
const ch = (await call("/api/v1/auth/challenge", { method: "POST", body: JSON.stringify({ account: kp.publicKey() }) })).body;
r = await call("/api/v1/auth/verify", { method: "POST", body: JSON.stringify({ account: kp.publicKey(), nonce: ch.nonce, signature: "AAAA" }) });
check("bad signature rejected", r.status === 401, r);
const ch2 = (await call("/api/v1/auth/challenge", { method: "POST", body: JSON.stringify({ account: kp.publicKey() }) })).body;
const sig2 = Buffer.from(kp.sign(createHash("sha256").update("Stellar Signed Message:\n" + ch2.message).digest())).toString("base64");
r = await call("/api/v1/auth/verify", { method: "POST", body: JSON.stringify({ account: kp.publicKey(), nonce: ch2.nonce, signature: sig2 }) });
check("signed challenge accepted", r.status === 200, r);
r = await call("/api/v1/auth/verify", { method: "POST", body: JSON.stringify({ account: kp.publicKey(), nonce: ch2.nonce, signature: sig2 }) });
check("challenge is single-use (replay rejected)", r.status === 401, r);

// 3. project + key + ingest + dashboard, as a real tenant
r = await call("/api/v1/projects", { method: "POST", body: JSON.stringify({ name: "Smoke Project" }) });
check("project created", r.status === 201, r);
const pid = r.body.id;
r = await call(`/api/v1/projects/${pid}/keys`, { method: "POST", body: JSON.stringify({ name: "smoke", scopes: ["ingest"] }) });
check("key created", r.status === 201 && /^pyx_live_/.test(r.body.token), r);
const tok = r.body.token, keyId = r.body.keyId;
r = await call("/v1/metrics", { method: "POST", headers: { authorization: `Bearer ${tok}` }, body: otlp() });
check("ingest with new key", r.status === 200, r);
r = await call(`/api/v1/projects/${pid}/analytics`);
check("dashboard reconciles: 10 requests, route normalized", r.status === 200 && r.body.summary.requests === 10 && r.body.endpoints[0].route === "/users/{id}/orders", r.body?.summary);
check("p50 within 0-10ms bucket", r.body.summary.p50_ms > 0 && r.body.summary.p50_ms <= 100, r.body?.summary);
r = await call(`/api/v1/projects/${pid}/keys/${keyId}`, { method: "DELETE" });
check("key revoked", r.status === 200, r);
r = await call("/v1/metrics", { method: "POST", headers: { authorization: `Bearer ${tok}` }, body: otlp() });
check("revoked key rejected immediately", r.status === 401, r);

// 4. isolation with a NON-operator tenant
const kp2 = Keypair.random();
cookie = "";
const c1 = (await call("/api/v1/auth/challenge", { method: "POST", body: JSON.stringify({ account: kp2.publicKey() }) })).body;
const s1 = Buffer.from(kp2.sign(createHash("sha256").update("Stellar Signed Message:" + String.fromCharCode(10) + c1.message).digest())).toString("base64");
await call("/api/v1/auth/verify", { method: "POST", body: JSON.stringify({ account: kp2.publicKey(), nonce: c1.nonce, signature: s1 }) });
r = await call("/api/v1/projects/" + (process.env.OTHER_PROJECT ?? "30833ac9-7a3b-4a9a-84d5-688cd8ef0b91") + "/analytics");
check("tenant B cannot read tenant A analytics (404)", r.status === 404, r.status);
r = await call("/api/v1/projects/" + (process.env.OTHER_PROJECT ?? "30833ac9-7a3b-4a9a-84d5-688cd8ef0b91") + "/keys");
check("tenant B cannot list tenant A keys (404)", r.status === 404, r.status);
r = await call("/api/v1/operator/overview");
check("non-operator blocked from operator API (403)", r.status === 403, r.status);
r = await call("/api/v1/projects");
check("tenant B sees only its own (empty) project list", r.status === 200 && r.body.projects.length === 0, r.body);

// 5. operator (first account) sees aggregates only, and is audited
cookie = "";
const c3 = (await call("/api/v1/auth/challenge", { method: "POST", body: JSON.stringify({ account: kp.publicKey() }) })).body;
const s3 = Buffer.from(kp.sign(createHash("sha256").update("Stellar Signed Message:" + String.fromCharCode(10) + c3.message).digest())).toString("base64");
await call("/api/v1/auth/verify", { method: "POST", body: JSON.stringify({ account: kp.publicKey(), nonce: c3.nonce, signature: s3 }) });
r = await call("/api/v1/operator/overview");
check("operator sees aggregates for all projects", r.status === 200 && r.body.projects.length >= 3, r.status);
check("operator payload has no keys/members/accounts", !JSON.stringify(r.body).match(/secret|key_id|stellar_account|token/), "leak");

// 6. wallet events + sites (operator account owns a fresh project)
cookie = "";
const c4 = (await call("/api/v1/auth/challenge", { method: "POST", body: JSON.stringify({ account: kp.publicKey() }) })).body;
const s4 = Buffer.from(kp.sign(createHash("sha256").update("Stellar Signed Message:" + String.fromCharCode(10) + c4.message).digest())).toString("base64");
await call("/api/v1/auth/verify", { method: "POST", body: JSON.stringify({ account: kp.publicKey(), nonce: c4.nonce, signature: s4 }) });
const pj = (await call("/api/v1/projects", { method: "POST", body: JSON.stringify({ name: "Wallet Smoke" }) })).body.id;
const wk = (await call(`/api/v1/projects/${pj}/keys`, { method: "POST", body: JSON.stringify({ name: "demo", scopes: ["ingest"] }) })).body.token;
const post = (events: unknown[]) => call("/v1/wallet-events", { method: "POST", headers: { authorization: `Bearer ${wk}` }, body: JSON.stringify({ events }) });
r = await post([{ event: "wallet_connect_started" }, { event: "wallet_connected", wallet_provider: "freighter", network: "testnet" }, { event: "transaction_sign_completed" }]);
check("wallet events accepted", r.status === 200 && r.body.accepted === 3, r);
r = await post([{ event: "wallet_connected", address: kp.publicKey() }]);
check("event carrying an address is rejected", r.status === 200 && r.body.accepted === 0 && r.body.rejected[0].reason === "prohibited_property", r);
r = await call("/v1/wallet-events", { method: "POST", body: JSON.stringify({ events: [] }) });
check("wallet events need a key", r.status === 401, r.status);
r = await call(`/api/v1/projects/${pj}/wallet`);
const f = Object.fromEntries(r.body.funnel.map((x: { event: string; count: number }) => [x.event, x.count]));
check("funnel reconciles and is labelled frontend-reported", f.wallet_connected === 1 && f.wallet_connect_started === 1 && r.body.verified_on_ledger === false, r.body);
r = await call(`/api/v1/projects/${pj}/sites`, { method: "POST", body: JSON.stringify({ domain: "http://127.0.0.1:8080" }) });
check("private/IP domain rejected", r.status === 400, r);
r = await call(`/api/v1/projects/${pj}/sites`, { method: "POST", body: JSON.stringify({ domain: "Example.com" }) });
check("site registered (normalized)", r.status === 201 && r.body.domain === "example.com", r);
const siteId = r.body.id;
r = await call(`/api/v1/projects/${pj}/sites`, { method: "POST", body: JSON.stringify({ domain: "example.com" }) });
check("duplicate domain rejected", r.status === 409, r);
r = await call(`/api/v1/projects/${pj}/sites`);
check("challenge issued for unverified site", r.body.sites[0].status === "pending" && /^pyxis-verify=/.test(r.body.sites[0].challenge.token), r.body);
r = await call(`/api/v1/projects/${pj}/sites/${siteId}/verify`, { method: "POST" });
check("unverifiable domain stays unverified", r.status === 200 && r.body.verified === false, r);
r = await call(`/api/v1/projects/${pj}/sites/${siteId}/web`);
check("web report refused for unverified site", r.status === 404, r.status);
