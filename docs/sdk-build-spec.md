# Pyxis SDK: build specification

Audience: an engineer, agent or model who will build and publish the public Pyxis SDK and has not seen this repo.
Status: specification, written 2026-11-18 from the code in this repository. Every server behavior below was read from source and cites its file. Items marked **VERIFY** were not checked against live systems and must be confirmed before relying on them. Items marked **DECISION** need a human answer (collected in section 14).

Read these first, in this order: section 1 (rules that cannot be broken), section 3 (what exists), section 5 and 6 (the server contracts), section 13 (acceptance).

---

## 1. Non-negotiable product rules

These come from `PRODUCT.md` and the server code. An SDK that violates any of them is wrong, whatever else it does.

1. **Privacy by omission.** The SDK must be incapable of sending wallet addresses, signatures, transaction XDR, IP addresses, request bodies or free text. The server also rejects them, but the SDK is the first line: it must not accept those fields in its public types and must strip unknown properties at runtime.
2. **Wallet events are frontend-reported, never ledger-confirmed.** No SDK name, doc or example may imply that "submit completed" proves a transaction reached the Stellar ledger. Use "reported".
3. **Metrics only.** Pyxis stores metrics (counters and histograms). It rejects traces and logs. The SDK must never emit them to Pyxis.
4. **Tenant comes from the key, never the payload.** The SDK must not try to send a project or tenant id. There is none to send.
5. **Analytics must never break the host app.** No public method may throw into application code or block a wallet or request flow. All network work is asynchronous and failure is silent (optionally logged in debug mode).
6. **No adoption, uptime or compliance claims** in READMEs, package descriptions or examples. Do not write "trusted by", "production-ready", "GDPR compliant" or any SLA. The product is a **testnet MVP**; the name "Pyxis" and npm scope are provisional (PRODUCT.md, "Open" items).
7. **Honest limits stay visible.** Percentiles are approximations from fixed-boundary histograms. Say so wherever percentiles are mentioned.

## 2. What Pyxis is, in one paragraph

Pyxis is a multi-tenant analytics service for Stellar projects. A project owner signs in with a Stellar wallet, creates a project, mints an **ingest key**, and then sends data three ways: (a) **API metrics** from their backend over OpenTelemetry (OTLP/HTTP JSON) to `POST /v1/metrics`; (b) **wallet-funnel events** from their frontend to `POST /v1/wallet-events`, which is what the SDK in this repo does; (c) **web analytics** through an Umami tracker snippet that Pyxis issues after the owner verifies the domain. Everything is stored as per-minute aggregate counts. Dashboards live in the Next.js app in this repo (`src/app`). Production URL while this spec was written: `https://web-production-3c4c1c5f.up.railway.app` (testnet MVP; do not hard-code it in the SDK).

## 3. What exists today

### 3.1 The alpha wallet SDK

File: `sdk/wallets-kit/index.ts` (81 lines, one file, zero dependencies). Intended name `@pyxis-hq/wallets-kit`, `SDK_VERSION = "0.1.0-alpha.0"`. It has **no package.json, no build output, no README, is not published**, and is imported by the demo page only through a relative path (`src/app/demo/page.tsx` imports `../../../sdk/wallets-kit`).

Public surface today:

```ts
type WalletEvent =
  | "wallet_connect_started" | "wallet_connected" | "wallet_disconnect"
  | "transaction_sign_started" | "transaction_sign_completed" | "transaction_sign_failed"
  | "transaction_submit_started" | "transaction_submit_completed" | "transaction_submit_failed";
type WalletProvider = "freighter" | "xbull" | "albedo" | "lobstr" | "rabet" | "hana" | "ledger" | "hot_wallet" | "other";
type Network = "testnet" | "public" | "other";

interface PyxisWalletOptions {
  endpoint: string;          // e.g. https://pyxis.example/v1/wallet-events
  ingestKey: string;         // pyx_live_...
  network?: Network;         // default "testnet"
  enabled?: boolean;         // default true; wire to consent
  maxQueue?: number;         // default 100; oldest dropped beyond this
  batchSize?: number;        // default 20 (server max 50)
  flushIntervalMs?: number;  // default 5000
  fetchImpl?: typeof fetch;
}
class PyxisWallet {
  constructor(opts: PyxisWalletOptions);
  track(event: WalletEvent, props?: { wallet_provider?: WalletProvider; failure_category?: string }): void;
  setEnabled(v: boolean): void;
  get droppedCount(): number;
  get queued(): number;
  flush(): Promise<void>;
  destroy(): void;
}
```

Behavior: `track` never throws or awaits; the queue is bounded (oldest dropped, counted); a timer flushes every `flushIntervalMs`; a flush sends up to 50 events with `fetch(..., { method: "POST", keepalive: true })`; 5xx, 429 and network errors re-queue the batch; other 4xx drop it; `failure_category` must match `/^[a-z_]{1,32}$/` or is omitted.

### 3.2 Existing tests to keep

`tests/wallet.test.ts` covers the server validator (`validateWalletBatch`) and the SDK (bounded queue, no throw on network failure, disabled/destroyed emit nothing, payload has no address-like strings). Port these when you move the code; do not delete them.

### 3.3 Gaps and defects found in the alpha (fix these)

| # | Finding | Why it matters |
|---|---|---|
| 1 | No flush on page hide. Events queued in the last up to 5 s are lost on navigation or tab close. | A wallet funnel is exactly the flow that ends in redirects and closed tabs. Flush on `visibilitychange` (hidden) and `pagehide`. |
| 2 | No backoff. After a 5xx/429/network error the batch is re-queued and retried on the next 5 s tick; when `batchSize` is reached every `track` call triggers a flush. | Can hammer a struggling server. Use capped exponential backoff with jitter, and a max retry count per event. |
| 3 | 4xx responses silently discard the batch and do **not** increment `droppedCount`. | The developer gets no signal that their events are rejected (for example a revoked key). Count them separately and expose them. |
| 4 | The server returns `200` with `{ accepted, rejected: [{ index, reason }] }` even when **every** event is rejected. The SDK ignores the body. | Per-event rejections (`unknown_event`, `prohibited_property`, `bad_failure_category`) are invisible. Surface them in debug mode and in a counter. |
| 5 | Constructor starts a `setInterval` immediately, including during SSR. It is `unref`'d in Node, but a new instance per render leaks timers. | Provide a lazy singleton helper and make the constructor SSR-safe (no timer until the first `track` in a browser). |
| 6 | `keepalive` fetch bodies are limited (about 64 KB in browsers). | Fine for 50 small events, but the cap must be a tested invariant. |
| 7 | `sendBeacon` is not usable because it cannot set the `Authorization` header. | Keep `fetch` with `keepalive`. Do not "optimize" to `sendBeacon`. |
| 8 | The server accepts `flow` and `ts` properties but **ignores** them (time is server-side; only event name, provider and network are stored). | Do not send `ts`. Do not add a `flow` option until the server stores it (**DECISION**, section 14). |
| 9 | Wallet-event requests do **not** update `api_keys.last_used_at` and write no `ingestion_audit` row (the metrics route does both). | The Keys page shows "never" for a key that is actively sending wallet events. This is a **server** follow-up (`src/app/v1/wallet-events/route.ts`); coordinate it with the SDK release. |
| 10 | No TypeScript declarations, no ESM/CJS dual output, no `exports` map, no `sideEffects` flag. | Required for a public package. |
| 11 | Public types allow `failure_category?: string`. | Tighten to a documented set of allowed values with a lowercase-snake `string & {}` escape hatch, validated at runtime. |

## 4. Deliverables

Build, in this priority order. Each is a separate npm package.

| Priority | Package (provisional name) | Purpose |
|---|---|---|
| **P0** | `@pyxis-hq/wallets-kit` | Browser wallet-funnel SDK. Productionize the alpha (section 7). |
| **P0** | `@pyxis-hq/wallets-kit/react` (subpath export, not a separate package) | Optional React hook and provider. Peer dependency on `react`. |
| **P1** | Wallets-Kit adapter, `@pyxis-hq/wallets-kit/stellar-wallets-kit` (subpath export) | Auto-instrument `@creit.tech/stellar-wallets-kit` so integrators do not call `track` by hand (section 7.5). |
| **P2** | `@pyxis-hq/otel` | Node/server helper that configures an OpenTelemetry metrics exporter to match what `/v1/metrics` accepts (section 8). |
| Later | Typed REST client | **Not buildable today**: there is no key-authenticated read API (section 12). |

Do **not** build a web-analytics SDK. Web analytics use the Umami tracker snippet that Pyxis issues per verified domain (`src/server/umami.ts`, `snippet()`); the product rule is "no third-party remote script", so the snippet loads from the operator's own Umami. A wrapper would add nothing and could re-host the script.

## 5. Server contract: wallet events (authoritative)

Source: `src/app/v1/wallet-events/route.ts`, `src/server/wallet-events.ts`, `src/server/keys.ts`.

### 5.1 Request

```
POST {origin}/v1/wallet-events
Authorization: Bearer pyx_live_<16 hex>.<43 base64url chars>
Content-Type: application/json

{ "events": [ { "event": "wallet_connected", "wallet_provider": "freighter", "network": "testnet", "failure_category": "user_rejected", "sdk_version": "0.1.0" } ] }
```

- Browser-callable: the route answers `OPTIONS` with `204` and `access-control-allow-origin: *`, allowed headers `authorization, content-type`, methods `POST, OPTIONS`, `max-age 86400`. Every response carries `access-control-allow-origin: *`.
- **Allowed event properties (strict allowlist):** `event`, `wallet_provider`, `network`, `flow`, `failure_category`, `sdk_version`, `ts`. Any other property rejects **that event** with `prohibited_property`.
- `event` must be one of the nine values in section 3.1; otherwise `unknown_event`.
- `wallet_provider`: if not in the provider list it is silently coerced to `"other"`. `network`: not in `testnet|public|other` is coerced to `"other"`.
- `failure_category` (optional) must match `/^[a-z_]{1,32}$/` else `bad_failure_category`.
- Time is the **server's** time. Client `ts` is ignored. Events are bucketed to the minute.
- Limits: body at most 20,000 characters (`413 payload_too_large`); at most 50 events per batch (`400 batch_too_large`).
- Stored: only counts per `(project, minute, event, provider category, network)`.

### 5.2 Responses

| Status | Body | Meaning | SDK action |
|---|---|---|---|
| 200 | `{ "accepted": n, "rejected": [{ "index": i, "reason": "..." }] }` | Batch processed; some events may be rejected individually | Count `rejected`; in debug mode log reasons (never event content). Do not retry. |
| 400 | `{ "code": "events_array_required" \| "batch_too_large" \| "invalid_json", "message": "..." }` | Whole batch invalid | Drop, count, debug-log. Never retry. |
| 401 | `{ "code": "auth_malformed" \| "auth_unknown" \| "auth_bad_secret" \| "auth_revoked" \| "auth_expired" \| "auth_project_inactive" }` | Bad or unusable key, or project suspended | Drop. **Disable sending** after repeated 401s (suggested: 3 consecutive) and log once in debug mode. Never retry in a loop. |
| 403 | `{ "code": "auth_scope" }` | Key lacks the `ingest` scope | Same as 401. |
| 413 | `{ "code": "payload_too_large" }` | Body over 20,000 chars | Split the batch (halve) and retry once; if a single event still fails, drop it. |
| 429 / 5xx / network error | any | Transient | Retry with capped exponential backoff and jitter; bounded retries. |

All error messages are deliberately generic ("Invalid credential"). Do not parse `message`.

### 5.3 Key format

`pyx_live_<keyId>.<secret>`; server regex `^pyx_live_([0-9a-f]{16})\.([A-Za-z0-9_-]{43})$` (`src/server/keys.ts`, `parseToken`). The SDK should validate this format at construction in debug mode and warn, but must not throw. The key is visible to every user of a browser app: document that integrators must create a **dedicated ingest-only key** for browser use and can revoke it from the Keys & setup page. Never log a full key; redact to the first 12 characters.

## 6. Server contract: API metrics over OTLP (for `@pyxis-hq/otel`)

Source: `src/app/v1/metrics/route.ts`, `src/server/ingest/otlp.ts`, `normalize.ts`, `histogram.ts`.

### 6.1 Transport

- `POST {origin}/v1/metrics`, `Authorization: Bearer <ingest key>`. Authentication happens **before** the body is read.
- **OTLP/HTTP JSON only.** `Content-Type` must contain `application/json`, else `415 unsupported_content_type` (message: set `OTEL_EXPORTER_OTLP_PROTOCOL=http/json`). Protobuf and gRPC are not supported yet (ROADMAP M2 lists protobuf first; **VERIFY** current status before promising it).
- Traces: `POST /v1/traces` returns `404 signal_not_supported`. Logs: `POST /v1/logs` the same. The helper must configure **only** a metrics pipeline.
- Limits: body at most 1,000,000 bytes (`413 payload_too_large`); at most 5,000 data points per batch (`413 too_many_data_points`).
- Success is `200 {}`. A partially accepted batch returns `200 { "partialSuccess": { "rejectedDataPoints": "<n>", "errorMessage": "<comma-separated reason codes>" } }`. Acknowledgement happens only after the database commit.

### 6.2 What is accepted

- Metric name: `http.server.request.duration` or the legacy `http.server.duration`. Any other metric is dropped (`metric_not_allowed`).
- Type: **histogram**. Anything else is dropped (`wrong_metric_type`).
- **Temporality: DELTA only.** Cumulative is dropped (`cumulative_temporality_unsupported`). This is the most common integration failure because OpenTelemetry SDK defaults are cumulative. The helper must force delta (OTel JS: `temporalityPreference: AggregationTemporalityPreference.DELTA`, or env `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE=delta`).
- Unit: `s`, `ms`, `us`, `ns` or empty (empty is treated as ms). Else `unsupported_unit`.
- Resource attribute `service.name` is **required** (`missing_service_name`). Environment comes from `deployment.environment.name`, or legacy `deployment.environment`, default `"default"`.
- Data-point attributes read: status `http.response.status_code` or `http.status_code` (must be an integer 100-599, else `invalid_status_code`); method `http.request.method` or `http.method` (non-standard methods become `_OTHER`); route `http.route` (trusted template, preferred) or `url.path` / `http.target`.
- Timestamps (`timeUnixNano`): not older than 24 hours (`timestamp_too_old`), not more than 5 minutes in the future (`timestamp_in_future`).
- Histogram must be well formed: `bucketCounts.length === explicitBounds.length + 1`, all counts non-negative finite numbers (`malformed_histogram`).
- Quotas: at most **10 distinct (service, environment) pairs per project** (`service_quota_exceeded`) and at most **200 distinct routes per service** over 7 days; beyond that routes are folded into `/_other` (`route_cardinality_capped`).
- Aggregation: 60-second buckets. Request count is the histogram count (so nothing is double counted). Source buckets are re-bucketed onto a fixed set of upper bounds in ms `[5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, +Inf]`, each source bucket assigned by its **upper** bound so latency is never under-reported. Percentiles (p50/p95/p99) are interpolated from merged counts, so they are **approximations**; the +Inf bucket reports its lower bound (10 s).

### 6.3 Route normalization (so integrators know what to expect)

A trusted `http.route` that starts with `/`, has no `?#` or whitespace and is at most 200 chars is used, then still scrubbed: path segments that look like a UUID become `{uuid}`, Stellar `G...` accounts `{stellar_account}`, `C...` contracts `{contract_id}`, `M...` muxed accounts `{muxed_account}`, all-digit segments `{id}`, long hex strings `{hash}`. More than 12 segments, over 200 chars, or undecodable becomes `/_unmatched`. The helper should tell users to set `http.route` (most framework instrumentations do) because raw paths are lower quality.

### 6.4 Drop reason codes (use these in the troubleshooting docs)

`metric_not_allowed`, `wrong_metric_type`, `cumulative_temporality_unsupported`, `missing_service_name`, `unsupported_unit`, `invalid_status_code`, `timestamp_too_old`, `timestamp_in_future`, `malformed_histogram`, `service_quota_exceeded`, `route_cardinality_capped`.

## 7. Package spec: `@pyxis-hq/wallets-kit`

### 7.1 Target public API (backwards compatible with the alpha where possible)

```ts
import { PyxisWallet } from "@pyxis-hq/wallets-kit";

const pyxis = new PyxisWallet({
  endpoint: "https://<your-pyxis-host>/v1/wallet-events", // required
  ingestKey: "pyx_live_...",                               // required
  network: "testnet",                                     // "testnet" | "public" | "other"
  enabled: true,                                          // wire to consent; false = no queue, no network
  respectDoNotTrack: true,                                // default true; honors navigator.doNotTrack / GPC
  debug: false,                                           // console diagnostics, never event content or keys
  // advanced, all optional with the defaults from section 7.3
  maxQueue, batchSize, flushIntervalMs, maxRetries, fetchImpl,
});

pyxis.track("wallet_connected", { wallet_provider: "freighter" });
await pyxis.flush();            // resolves, never rejects
pyxis.setEnabled(false);        // clears the queue
pyxis.destroy();                // stops timers and listeners
pyxis.stats;                    // { queued, sent, rejected, dropped, retried, lastError?: code } (no event content)
```

Add: `createPyxisWallet(opts)` returning a lazy singleton keyed by `endpoint+ingestKey` for SSR frameworks, and a pure `isWalletEvent(x)` type guard. Keep `droppedCount` and `queued` getters for compatibility.

### 7.2 Behavior requirements

1. **Never throws, never blocks.** Wrap `track`, `flush`, `setEnabled` and `destroy` so no exception escapes. `flush()` returns a promise that always resolves.
2. **SSR/edge safe.** Importing the module must not touch `window`, `document` or `navigator`. No timer starts until the first `track` call in an environment that has `fetch`. In Node (without a browser) the SDK should still work but not register page-lifecycle listeners.
3. **Validation mirrors the server.** Drop unknown event names and non-conforming `failure_category` before queuing. Coerce unknown providers/networks to `"other"` exactly like the server. Strip every property not in the public type, at runtime, so a JS caller cannot smuggle an address through.
4. **Page lifecycle.** Flush on `visibilitychange` to hidden and on `pagehide`, using `fetch` with `keepalive: true`. Remove listeners in `destroy()`.
5. **Retry.** Exponential backoff with full jitter on 429, 5xx and network errors (suggested: base 1 s, cap 60 s, max 5 attempts per batch). Never retry 4xx. Never retry in a tight loop.
6. **Auth failure circuit breaker.** After 3 consecutive 401/403 responses, set an internal `disabled` state, clear the queue, and stop sending until `setEnabled(true)` or a new instance. Log once in debug mode.
7. **Bounded memory.** Queue never exceeds `maxQueue` (default 100); drop oldest and count. Do not persist events to `localStorage`/IndexedDB (privacy: nothing survives the page).
8. **Batch size.** Never send more than 50 events per request (server max) or more than about 15,000 characters (server body limit is 20,000; leave margin). On `413`, halve and retry once.
9. **Consent.** `enabled: false` means no queue growth and no network. Respect Do Not Track / Global Privacy Control by default (`respectDoNotTrack`), overridable.
10. **No cookies, no storage, no identifiers.** The SDK sends no user id, session id, fingerprint or timestamp. It sends `sdk_version`, event, provider, network and optional failure category only.
11. **Diagnostics.** `stats` and debug logs may include counts and server reason codes. They must never include the ingest key (redact) or any wallet-derived data.

### 7.3 Defaults

`network: "testnet"`, `enabled: true`, `maxQueue: 100`, `batchSize: 20`, `flushIntervalMs: 5000`, `maxRetries: 5`, `respectDoNotTrack: true`, `debug: false`. `batchSize` is clamped to 1-50.

### 7.4 Packaging

- ESM and CJS builds plus `.d.ts`, via `tsup` (or equivalent). `exports` map with `"."`, `"./react"`, `"./stellar-wallets-kit"`; `"sideEffects": false`; `"types"` condition first.
- Zero runtime dependencies in the core. `react` and `@creit.tech/stellar-wallets-kit` are **optional peer dependencies** used only by their subpath exports.
- Targets: modern browsers, Node 18+, edge/worker runtimes (anything with `fetch`).
- Size budget (suggested, enforce in CI with `size-limit`): core at most 2 KB min+gzip.
- `engines`, `repository`, `license`, `publishConfig: { access: "public", provenance: true }`, `files` limited to `dist` and docs.
- License: the ROADMAP states Apache-2.0 but **the repo currently has no LICENSE file** (**DECISION**; add before publishing).

### 7.5 Stellar Wallets Kit adapter (P1)

`instrumentWalletsKit(StellarWalletsKit, pyxis)` should wrap the kit's `authModal` and `signTransaction` (and expose a helper for the submit step, since the kit does not submit) and emit the funnel automatically:

| Kit call | Events |
|---|---|
| `authModal()` called | `wallet_connect_started` |
| `authModal()` resolves | `wallet_connected` (map the selected module id to a `WalletProvider`, else `"other"`) |
| `authModal()` rejects | no connected event; optionally `wallet_disconnect` is **not** emitted (that is a user action) |
| `signTransaction()` called | `transaction_sign_started` |
| resolves / rejects | `transaction_sign_completed` / `transaction_sign_failed` with `failure_category` derived from the error class (`user_rejected`, `wallet_error`, `network_error`), never from the error message |
| helper `pyxis.trackSubmit(promise)` | `transaction_submit_started`, then `transaction_submit_completed` or `transaction_submit_failed` |

The adapter must **never read, store or forward** the address, the signed XDR or any argument. Use the wrapped function's arguments only to pass them through. The adapter must be removable (`dispose()`), and must not change the return value, timing or errors of the wrapped calls. API shape of `@creit.tech/stellar-wallets-kit` (the repo uses v2.x: `StellarWalletsKit.init`, `authModal`, `signMessage`, `signTransaction`) changes between majors; **VERIFY** against the installed version (`node_modules/@creit.tech/stellar-wallets-kit`) and add an integration test with a fake kit.

### 7.6 React bindings (P0, small)

`<PyxisWalletProvider options>` and `usePyxisWallet()` returning `{ track, setEnabled, stats }`. Provider creates the singleton in an effect (not during render), calls `destroy()` on unmount, and is safe under React 18 StrictMode double-invocation and React Server Components (client-only; mark `"use client"`).

## 8. Package spec: `@pyxis-hq/otel` (P2)

Goal: a few lines that make an existing Node service **dual-export** (keep its current APM, add Pyxis) with settings Pyxis accepts. It is optional; a documented env-var recipe already works (see the snippet in `src/app/projects/[id]/keys/page.tsx`).

```ts
import { createPyxisMetricReader } from "@pyxis-hq/otel";
// add alongside any existing reader on your MeterProvider
const reader = createPyxisMetricReader({
  endpoint: "https://<your-pyxis-host>/v1/metrics",
  ingestKey: process.env.PYXIS_INGEST_KEY!,
  serviceName: "my-api",            // sets service.name if the Resource lacks it
  environment: "testnet",           // sets deployment.environment.name
  exportIntervalMillis: 60_000,
});
```

Requirements:
1. Build on `@opentelemetry/sdk-metrics` and `@opentelemetry/exporter-metrics-otlp-http` as **peer dependencies**. Use the JSON exporter, **delta** temporality and an `Authorization: Bearer` header.
2. Provide a **View** that keeps only the HTTP server duration histogram (`http.server.request.duration`, `http.server.duration`) so nothing else is sent (the server would drop it, but do not waste bandwidth or leak other metrics).
3. Provide an environment-variable-only recipe in the README for users who do not want a package: `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL=http/json`, `..._ENDPOINT`, `..._HEADERS="Authorization=Bearer <key>"`, `..._TEMPORALITY_PREFERENCE=delta`, `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES=deployment.environment.name=<env>`.
4. Never export traces or logs to Pyxis.
5. Document that `http.route` must be present for good route grouping (most framework instrumentations set it) and that the semantic-convention metric name depends on the instrumentation version and `OTEL_SEMCONV_STABILITY_OPT_IN` (**VERIFY** against the instrumentation versions you target; both names are accepted by Pyxis).
6. **Contract test (mandatory):** feed the OTLP JSON produced by the helper to `parseOtlpMetrics` (`src/server/ingest/otlp.ts`) and assert `dropped` is empty and `accepted > 0`.

## 9. Repository layout and tooling

Current repo: a single Next.js app, npm, installs need `npm install --legacy-peer-deps`. Recommended:

```
sdk/
  wallets-kit/   package.json, src/, test/, README.md, tsup.config.ts
  otel/          (P2)
  README.md      overview of the SDK family
```

- Use npm workspaces (`"workspaces": ["sdk/*"]`) so the app and demo import the built package, replacing the relative import in `src/app/demo/page.tsx`. Keep `npm test` at the root running SDK tests.
- Tooling: TypeScript strict, `tsup`, Vitest (already used), `size-limit`, `publint`, `@arethetypeswrong/cli`, Changesets for versioning and changelogs.
- Versioning: SemVer. Start at `0.1.0-beta.0`; `1.0.0` only after the acceptance list in section 13 is green **and** a human approves. `SDK_VERSION` must come from `package.json` at build time (no hand-maintained constant).
- Next.js 16 note: this repo's `AGENTS.md` warns the framework has breaking changes versus common knowledge. Before writing the Next.js example, read `node_modules/next/dist/docs/` for the version in use.

## 10. Documentation to deliver

1. **README per package**: install, 10-line quickstart, options table, "What is sent" table (every field, with an explicit "never sent" list), privacy statement, consent wiring, SSR/Next.js/Vite examples, troubleshooting.
2. **Troubleshooting table keyed by server code**: each `auth_*` code, each reject reason (section 5.2) and each OTLP drop reason (section 6.4), with the one-line fix. Example: `cumulative_temporality_unsupported` -> set delta temporality.
3. **"What is sent" must match the code**: add a test that serializes a worst-case event and fails if it contains anything beyond the allowed fields.
4. **Examples**: vanilla browser, React, a Freighter/Wallets Kit flow, and (P2) an Express service with the OTel helper. Use **synthetic** keys such as `pyx_live_0000000000000000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` and label them as placeholders.
5. **Language rules**: "reported by the frontend", never "confirmed"; no performance, uptime or adoption claims.

## 11. Integrating the SDK back into this app

After a package builds locally (do not wait for npm publication):

1. `src/app/demo/page.tsx`: import from `@pyxis-hq/wallets-kit` via the workspace instead of the relative path. Behavior must be unchanged.
2. `src/components/pyxis/wallet-funnel.tsx`: replace the empty-state sentence with an install snippet and a link to the demo.
3. `src/app/projects/[id]/keys/page.tsx` and the setup checklist on `src/app/projects/[id]/page.tsx`: add an optional "Install the wallet SDK" step with a copyable snippet. Respect the design system in `DESIGN.md` (dark, violet accent only for action/selection, definitions beside numbers).
4. Server follow-up (section 3.3 item 9): update `api_keys.last_used_at` and write an `ingestion_audit` row in the wallet route so the Keys page reflects wallet-only keys.
5. Do not claim anything in the UI that the code does not do.

## 12. Explicitly out of scope (and why)

- **A query/read SDK.** API keys have a `query` scope in the database (`src/server/keys.ts`) but **no route consumes it**; all dashboard reads use a signed-in session cookie. There is no public read API. The ROADMAP lists an exports API for M2. Do not invent endpoints from the SDK side.
- **Traces, logs, spans, request bodies.** Rejected by design.
- **A web-analytics SDK.** See section 4.
- **Soroban / on-ledger event ingestion or transaction verification.** Wallet events are frontend-reported; confirming ledger outcomes is a different product.
- **Server-side wallet events.** The endpoint is browser-oriented (CORS `*`, key in the client). A server-to-server variant would be a deliberate API addition.
- **Offline persistence of events.** Intentionally not stored (privacy).

## 13. Acceptance criteria

The SDK is done when all of the following are true and evidenced by a test run, not by assertion.

**Contract**
- [ ] Every event the SDK can emit passes `validateWalletBatch` with zero `rejected`.
- [ ] A fuzz test of arbitrary JS inputs (extra properties like `address`, `signature`, `xdr`, `email`, `message`, 56-character `G...` strings in every field) produces a request body with **no** such data.
- [ ] `sdk_version` equals the version in `package.json`.

**Behavior (each with an automated test)**
- [ ] `track` never throws, even with a throwing `fetchImpl` or no `fetch` at all.
- [ ] Queue bounded; oldest dropped; drops counted.
- [ ] Flush on `visibilitychange` hidden and `pagehide`, with `keepalive: true`.
- [ ] 429/5xx/network error retried with backoff and a cap; 4xx never retried; per-event reject reasons counted from a `200` body.
- [ ] 3 consecutive 401/403 trips the circuit breaker; no further requests until re-enabled.
- [ ] `enabled: false` and Do Not Track: zero network calls and zero queue growth.
- [ ] Importing the package in Node with no `window` does not throw; React provider is StrictMode-safe.
- [ ] No timer or listener remains after `destroy()`.

**Packaging**
- [ ] `publint` and `@arethetypeswrong/cli` clean; ESM and CJS consumers both resolve types.
- [ ] Core bundle within the size budget; `sideEffects: false` verified by a tree-shaking test.
- [ ] Consumer smoke tests: a Vite app, a Next.js app and plain Node each import and send one event to a locally running Pyxis (`npm run db:dev`, `npm run seed`, `npm run dev`; see README "Run locally").
- [ ] `LICENSE` present (see DECISION) and `package.json` metadata complete.

**End to end**
- [ ] With a seeded local Pyxis and an ingest key, the demo page (using the packaged SDK) produces non-zero counts on the project's Wallet funnel page. This is the same check the existing e2e smoke covers (`scripts/e2e-smoke.mts`); extend it, do not replace it.
- [ ] (P2) The OTel helper's output passes `parseOtlpMetrics` with nothing dropped, and a real sample service shows dashboard numbers that reconcile to the stored buckets.

**Docs**
- [ ] READMEs contain no adoption, uptime or compliance claim and no "confirmed" language for wallet events.
- [ ] Troubleshooting table covers every code in sections 5.2 and 6.4.

## 14. Open decisions for a human (do not guess)

1. **npm scope and package names.** `@pyxis-hq/*` is provisional and unregistered as far as this repo shows. The product name itself is provisional (PRODUCT.md). Confirm availability or choose another scope.
2. **License.** ROADMAP says Apache-2.0; no LICENSE file exists. Add it, or choose otherwise, before any publish. The public site copy currently avoids the phrase "open-source" for this reason.
3. **Store `flow`?** The server accepts a `flow` property but discards it. Do we want per-flow funnels (for example "swap" vs "deposit")? If yes, the server needs a column and the dashboard needs a filter before the SDK exposes `flow`.
4. **Public-network use.** The product is a testnet MVP. Should the SDK default `network` stay `"testnet"` and should docs mention `"public"` at all yet?
5. **OTLP protobuf.** If integrators need `http/protobuf` (the OTel SDK default), the server must support it first. Until then the helper must pin JSON.
6. **Publishing and provenance.** Who owns the npm account, and is CI-based provenance publishing (GitHub Actions) acceptable?
7. **Server follow-ups.** Approve the `last_used_at`/audit fix for the wallet route (section 3.3 item 9) and any rate limiting on `/v1/wallet-events` (none exists today).

## 15. Where to look in this repo

| Need | File |
|---|---|
| Alpha SDK | `sdk/wallets-kit/index.ts` |
| SDK + validator tests | `tests/wallet.test.ts` |
| Wallet ingest route and validator | `src/app/v1/wallet-events/route.ts`, `src/server/wallet-events.ts` |
| OTLP route and parser | `src/app/v1/metrics/route.ts`, `src/server/ingest/otlp.ts` |
| Route templating, histogram bounds | `src/server/ingest/normalize.ts`, `src/server/ingest/histogram.ts` |
| Key format and auth | `src/server/keys.ts` |
| Demo dApp using the SDK | `src/app/demo/page.tsx` |
| Where the OTel snippet is shown | `src/app/projects/[id]/keys/page.tsx` |
| Umami tracker issuance | `src/server/umami.ts` |
| Product constraints | `PRODUCT.md`, `ROADMAP.md`, `README.md` |
| Visual rules for any UI you add | `DESIGN.md` |
| Local run and e2e | `README.md` ("Run locally"), `scripts/e2e-smoke.mts`, `scripts/seed.mts` |

The README also references a documentation pack at `../stellar-pulse-documentation/` (docs 01-12, OpenAPI, SQL, tests matrix; the code cites docs 04 and 08). It is **not in this repo**. Ask the project owner for it if you need the original percentile and wallet-event specs, and treat the code in this repository as the source of truth where they differ.
