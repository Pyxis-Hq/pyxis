# Data and telemetry specification

**Status:** describes what the code at commit `a7df1da` does. Where a property is required by the RFP but not implemented, it is listed under "Not enforced today".
**Evidence basis:** `src/server/ingest/otlp.ts`, `histogram.ts`, `normalize.ts`, `src/server/queries.ts`, `src/server/wallet-events.ts`, `db/migrations/001_init.sql`, `tests/unit.test.ts`, `tests/db.test.ts`, `tests/wallet.test.ts`.
**Related:** [api-reference.md](api-reference.md), [../security/privacy-and-data-protection.md](../security/privacy-and-data-protection.md), [technical-specification.md](technical-specification.md).

## 1. Principle

Pyxis keeps **aggregates, never individuals**. Each signal is reduced at the ingest boundary to counters and fixed-bucket histograms, or to counts of allowlisted event names. The reduction happens in the request handler before anything is written.

## 2. Signals

| Signal | Source | Transport | Stored as | Tenant resolved from |
|---|---|---|---|---|
| API metrics | OpenTelemetry SDK or collector | OTLP/HTTP **JSON** to `/v1/metrics` | `endpoint_metric_buckets` (60-second buckets) | The ingest key; **never** the payload (`otlp.ts:52`) |
| Wallet funnel | `@pyxis-hq/wallets-kit` or any HTTP client | JSON to `/v1/wallet-events` | `wallet_event_buckets` (60-second buckets) | The ingest key |
| Web analytics | Umami tracker on the tenant's site | Umami's own collection endpoint | **Inside Umami**, not in the Pyxis database | The verified site row (`sites.umami_website_id`) |
| Traces, logs | any | `/v1/traces`, `/v1/logs` | **Nothing**: `404 signal_not_supported` | n/a |

OTLP protobuf and OTLP/gRPC are **not supported**. The `@opentelemetry/otlp-transformer` and `protobufjs` packages are declared but unused.

## 3. API metrics

### 3.1 Accepted input

| Aspect | Rule | Reason code when violated |
|---|---|---|
| Metric name | `http.server.request.duration` or `http.server.duration` | `metric_not_allowed` |
| Metric type | Histogram | `wrong_metric_type` |
| Temporality | Delta (`1` or `AGGREGATION_TEMPORALITY_DELTA`) | `cumulative_temporality_unsupported` |
| Service | Resource attribute `service.name`, truncated to 80 characters | `missing_service_name` |
| Environment | `deployment.environment.name`, else `deployment.environment`, else `default`; truncated to 40 | none |
| Unit | `s`, `ms`, `us`, `ns` or empty; an **empty unit is treated as milliseconds** | `unsupported_unit` |
| Status code | `http.response.status_code` or `http.status_code`, integer 100 to 599 | `invalid_status_code` |
| Method | `http.request.method` or `http.method`; unknown values become `_OTHER` | none |
| Route | `http.route` if it starts with `/`, is at most 200 characters and has no `?`, `#` or whitespace; else `url.path` or `http.target`; both are normalized; else `/_unmatched` | none |
| Timestamp | Not older than 24 hours and not more than 5 minutes ahead | `timestamp_too_old`, `timestamp_in_future` |
| Histogram shape | `bucketCounts.length = explicitBounds.length + 1`, all counts finite and non-negative | `malformed_histogram` |

All other attributes and fields on a data point are discarded.

The stable OpenTelemetry metric `http.server.request.duration` is defined in **seconds**; a producer that omits the unit would be recorded 1000 times too small. A fix is planned.

### 3.2 Limits

| Limit | Value | Where |
|---|---|---|
| Body size | 1,000,000 bytes (`content-length` header, then buffered text length in **characters**) | `otlp.ts:9`, `route.ts:15-18` |
| Data points per request | 5,000 | `otlp.ts:10` |
| Service and environment pairs per project | 10 | `otlp.ts:11`, enforced in `persist` |
| Distinct routes per service and environment over 7 days | 200; extras are stored under `/_other` | `otlp.ts:12`, `persist` |

### 3.3 Aggregation

Each accepted data point becomes a row keyed by `(project, 60-second bucket start, service, environment, method, route, status)` and merged with `INSERT ... ON CONFLICT DO UPDATE` that adds `request_count`, `duration_sum_ms` and the histogram array element-wise (`pyxis_add_arrays`, `otlp.ts:147-155`). Batches from several exporters therefore merge.

Request count equals the histogram count, so nothing is counted twice **within** a request. A retried request **is** counted twice: there is no idempotency key.

### 3.4 Histogram

Fixed upper bounds in milliseconds: **5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, +Inf** (12 buckets, non-cumulative, `histogram.ts:2`).

Re-bucketing: each source bucket is assigned to the fixed bucket that contains its **upper** bound; the source's overflow bucket goes to `+Inf` (`histogram.ts:15-23`). Latency is therefore never under-reported, but it can be over-reported by up to the width of the source bucket.

### 3.5 Metric definitions

| Metric | Definition | Source |
|---|---|---|
| Requests | Sum of `request_count` | `queries.ts:19-21` |
| Status classes | Requests grouped by `floor(status / 100)`: `2xx`, `3xx`, `4xx`, `5xx`, `other` | `queries.ts:23-24` |
| Server error rate | 5xx requests divided by all requests; 0 when there are no requests | `queries.ts:30` |
| Success rate | (2xx + 3xx) divided by all requests | `queries.ts:31` |
| Average latency | Sum of `duration_sum_ms` divided by requests | `queries.ts:32` |
| p50, p95, p99 | Quantile of the **merged** histogram with linear interpolation inside the bucket; the `+Inf` bucket reports its lower bound, so any percentile above 10 s shows as 10,000 ms | `histogram.ts:30-46` |
| Time series step | Minute up to 6 hours, hour up to 3 days, day above | `queries.ts:46` |

Percentiles are **never averaged** across histograms: counts are merged first (`queries.ts:22`).

### 3.6 Route normalization

Applied to every route and path (`normalize.ts`). Segments are replaced in this order: UUID to `{uuid}`; Stellar account `G...` to `{stellar_account}`; contract `C...` to `{contract_id}`; muxed account `M...` to `{muxed_account}`; all digits to `{id}`; hexadecimal of 32 or more characters (optionally `0x`) to `{hash}`. A path with more than 12 segments, more than 200 characters, an undecodable escape or a control character becomes `/_unmatched`. Short hashes, slugs and usernames are **not** templated and rely on the 200-route cap.

### 3.7 Not enforced today

- No rate limit, so cardinality protection is per batch and per project only.
- No service or environment filter in the queries: staging and production of one project are summed.
- No retention: nothing deletes old rows (section 6).
- No idempotency for retried batches.

## 4. Wallet funnel

### 4.1 Event schema

| Field | Allowed values | Stored |
|---|---|---|
| `event` | `wallet_connect_started`, `wallet_connected`, `wallet_disconnect`, `transaction_sign_started`, `transaction_sign_completed`, `transaction_sign_failed`, `transaction_submit_started`, `transaction_submit_completed`, `transaction_submit_failed` | yes |
| `wallet_provider` | `freighter`, `xbull`, `albedo`, `lobstr`, `rabet`, `hana`, `ledger`, `hot_wallet`, `other`; any other value becomes `other` | yes, as `provider_category` |
| `network` | `testnet`, `public`, `other`; any other value becomes `other` | yes |
| `failure_category` | `^[a-z_]{1,32}$` | **no** (validated, then dropped) |
| `flow`, `sdk_version`, `ts` | accepted, ignored | no |
| anything else | the event is rejected as `prohibited_property` | no |

Rows are `(project, 60-second bucket, event, provider, network, count)` (`wallet-events.ts:38-47`). The timestamp is the server's. Maximum 50 events and 20,000 characters per request.

### 4.2 What the numbers mean

The funnel is **reported by the browser**. It is not a ledger fact. The API labels it `reported_by: "frontend"` and `verified_on_ledger: false`. Any holder of a browser ingest key can inflate it.

### 4.3 Privacy properties and their limits

The SDK builds each event from a fixed shape and the server rejects extra properties, so an address, signature or XDR placed in a property **name** cannot be stored. Because `failure_category` is a regular expression and not a list, a lowercase string with underscores is accepted by both the SDK and the server; it is discarded before storage, so it cannot leak through the database, but it does travel over the network.

## 5. Web analytics

Collected and stored by Umami. Pyxis requests `stats` and `metrics` for the website (page views, visitors, visits, bounces, total time, top 10 referrers, countries, browsers and devices) and derives `bounce_rate = bounces / visits` and `avg_session_seconds = totaltime / visits` (`src/server/umami.ts:31-46`). Definitions of visitor, visit and bounce are Umami's. **Not verified against a real Umami release.**

## 6. Retention and deletion

| Data | Retention today |
|---|---|
| `endpoint_metric_buckets`, `wallet_event_buckets` | **Kept indefinitely**; no job or TTL exists |
| `ingestion_audit`, `operator_audit_events` | **Kept indefinitely** |
| `auth_challenges`, `sessions` | Rows are **never purged** after expiry; expiry is checked at read time |
| Deletion on request | Cascade when a project row is deleted; **no endpoint deletes a project or a user** |

The RFP requires aggregated views to be kept for at least 24 months. Indefinite retention satisfies the minimum by accident, not by design, and there is no policy, no downsampling and no storage forecast.

## 7. Data inventory

| Item | Collected | Stored | Discarded |
|---|---|---|---|
| Stellar account of a dashboard user | at sign-in | `users.stellar_account` | n/a |
| Session token | at sign-in | SHA-256 only (`sessions.token_hash`) | the token itself |
| Ingest key secret | at creation | SHA-256 only | the secret |
| Request counts and latency per route | via OTLP | 60-second aggregates | request bodies, IPs, user agents, query strings, all other attributes |
| Wallet events | via SDK | counts per event, provider category, network | addresses, signatures, XDR, free text, `failure_category`, client timestamps |
| Website visitors | via Umami | **in Umami** (not verified) | n/a |
