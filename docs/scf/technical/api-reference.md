# API reference

**Status:** reference for the endpoints that exist at commit `a7df1da`. Nothing here is planned work unless labelled.
**Evidence basis:** the route handlers under `src/app/api/v1/**` and `src/app/v1/**`, the helpers in `src/server/**`, and `tests/`.
**Related:** [technical-specification.md](technical-specification.md), [telemetry-specification.md](telemetry-specification.md), the public guide <https://docs.usepyxis.xyz/docs/reference/ingest-api>.

There are two APIs. The **session API** (`/api/v1/**`) serves the web app and uses the `pyxis_session` cookie. The **ingest API** (`/v1/**`) takes data from exporters and browsers and uses an ingest key. There is no public read API for API keys with the `query` scope: the scope can be minted but **no route consumes it** (`src/server/keys.ts:5`, search of `authenticateKey(` callers).

## 1. Conventions

| Item | Behaviour |
|---|---|
| Content type | JSON. The session API does not check the request `content-type`; the OTLP route requires `application/json` (`src/app/v1/metrics/route.ts:12-14`) |
| Error shape | `{ "code": "<machine_code>", "message": "<text>" }` (`src/server/api.ts:3`) |
| IDs | Project, site and user IDs are UUIDs; handlers reject other shapes before querying |
| Dates | `from` and `to` query parameters, ISO 8601. The maximum range is 90 days (`src/server/queries.ts:5-12`) |
| Not found vs forbidden | A project the caller cannot see returns `404 not_found` for members. Operator-only routes return `403 forbidden` |
| Rate limits | **None** on any route |
| Versioning | Path prefix `/api/v1` and `/v1`; no deprecation policy exists yet |

## 2. Session API

Authentication: cookie `pyxis_session` (HttpOnly, SameSite=Lax, `secure` when `NODE_ENV=production`, 7 days). Roles rank viewer < analyst < developer < admin < owner (`src/server/auth/session.ts:65-76`).

| Method and path | Minimum role | Body or query | Success | Errors |
|---|---|---|---|---|
| `POST /api/v1/auth/challenge` | public | `{ account }` (Stellar `G...` key) | `200 { nonce, message }` | `400 invalid_request`, `400 invalid_account`, `503 service_unavailable` |
| `POST /api/v1/auth/verify` | public | `{ account, nonce, signature }` (signature base64) | `200 { ok: true }` and the session cookie | `400 invalid_request`, `401 auth_failed` |
| `POST /api/v1/auth/logout` | any | none | `200 { ok: true }`, session row deleted | none |
| `GET /api/v1/me` | public | none | `200 { user: { id, account, isOperator } \| null }` | none |
| `GET /api/v1/projects` | signed in | none | `200 { projects: [{ id, name, status, role }] }` | `401 unauthenticated` |
| `POST /api/v1/projects` | signed in | `{ name (2-100), description? (≤500) }` | `201 { id }`; caller becomes owner | `400 invalid_request` |
| `GET /api/v1/projects/:id` | viewer | none | `200 { id, name, description, status, created_at, role }` | `404 not_found` |
| `PATCH /api/v1/projects/:id` | admin | `{ name, description? }` | `200 { ok: true }` | `400`, `404` |
| `GET /api/v1/projects/:id/members` | viewer | none | `200 { members: [{ userId, account, role, createdAt, you }] }` | `404` |
| `POST /api/v1/projects/:id/members` | admin | `{ account, role: admin\|developer\|analyst\|viewer }` | `201 { ok: true }` | `400 invalid_account`, `404` |
| `DELETE /api/v1/projects/:id/members/:userId` | admin | none | `200 { ok: true }`; owners cannot be removed | `400 cannot_remove`, `404` |
| `GET /api/v1/projects/:id/keys` | developer | none | `200 { keys: [{ id, key_id, name, scopes, created_at, last_used_at, revoked_at }] }` (no secrets) | `404` |
| `POST /api/v1/projects/:id/keys` | developer | `{ name (1-60), scopes: ["ingest","query"] }` | `201 { keyId, token, note }`; the token is shown once | `400`, `404` |
| `DELETE /api/v1/projects/:id/keys/:keyId` | developer | none | `200 { ok: true }`, `revoked_at` set | `404` |
| `GET /api/v1/projects/:id/sites` | viewer | none | `200 { sites: [{ id, domain, status, tracker_ready, challenge }] }` | `404` |
| `POST /api/v1/projects/:id/sites` | admin | `{ domain }` | `201 { id, domain }` | `400 invalid_domain`, `409 duplicate_domain`, `404` |
| `POST /api/v1/projects/:id/sites/:siteId/verify` | admin | none | `200 { verified, method?, tracker_ready?, detail }` | `404` |
| `GET /api/v1/projects/:id/sites/:siteId/web` | viewer | `from`, `to` | `200 { domain, snippet, pageviews, visitors, visits, bounce_rate, avg_session_seconds, referrers, countries, browsers, devices }` | `400 invalid_range`, `404 not_ready`, `502 engine_unavailable` |
| `GET /api/v1/projects/:id/analytics` | viewer, or operator read | `from`, `to` | `200 { range, summary, series, endpoints }` | `400 invalid_range`, `404` |
| `GET /api/v1/projects/:id/wallet` | viewer, or operator read | `from`, `to` | `200 { reported_by: "frontend", verified_on_ledger: false, funnel: [{ event, count }] }` | `400`, `404` |
| `GET /api/v1/operator/overview` | operator | `from`, `to` (default 7 days) | `200 { range, total, projects: [{ id, name, status, ...summary }] }` | `403 forbidden` |
| `PATCH /api/v1/operator/projects/:id/status` | operator | `{ status: active\|suspended\|archived }` | `200 { ok: true }` | `400`, `403`, `404` |

### Response shapes

`summary` (from `src/server/queries.ts:16-35`): `requests`, `status_classes` (`2xx`, `3xx`, `4xx`, `5xx`, `other`), `server_error_rate` (5xx divided by all), `success_rate` ((2xx + 3xx) divided by all), `avg_ms`, `p50_ms`, `p95_ms`, `p99_ms` (rounded to 0.1 ms; `null` when there is no data).
`series`: `[{ t, requests, errors }]` with a step of minute, hour or day chosen from the range length.
`endpoints`: up to 500 rows of `{ service, environment, method, route, ...summary, spark, spark_err }` sorted by request count.

### Audit behaviour

Operator reads of `/analytics` insert an `operator_audit_events` row (`view_project`); `/operator/overview` inserts `view_overview`; the status change inserts `set_project_status`. **Operator reads of `/wallet` are not audited** (`src/app/api/v1/projects/[id]/wallet/route.ts`, no audit insert). This contradicts the statement in the README that every operator access is logged.

### Authentication errors

`/auth/verify` returns one generic `401 auth_failed` for an unknown nonce, an expired nonce, a reused nonce and a wrong signature.

## 3. Ingest API

Authentication: `Authorization: Bearer pyx_live_<16 hex>.<43 base64url>`, scope `ingest`. The key is resolved and checked **before the body is read** (`src/app/v1/metrics/route.ts:9`).

| Failure | Status | Code |
|---|---|---|
| Header missing or malformed | 401 | `auth_malformed` |
| Key id unknown | 401 | `auth_unknown` |
| Secret wrong | 401 | `auth_bad_secret` |
| Revoked, expired | 401 | `auth_revoked`, `auth_expired` |
| Project not active | 401 | `auth_project_inactive` |
| Key lacks the scope | 403 | `auth_scope` |

The message is always `"Invalid credential"`, but the **`code` distinguishes the cases**. A caller can therefore tell a real key id (`auth_bad_secret`, `auth_revoked`) from an unknown one. Key ids are 64 bits, so this is a low-severity oracle; it contradicts the documents that say "generic errors".

### `POST /v1/metrics`

OTLP/HTTP **JSON** `ExportMetricsServiceRequest`. Protobuf and gRPC are **not supported** (`415 unsupported_content_type`). Details, limits and drop reasons are in [telemetry-specification.md](telemetry-specification.md).

The example below was written from the parser's rules (`src/server/ingest/otlp.ts`) and was **not executed** for this document. The end-to-end script that is executed against a running instance is `scripts/e2e-smoke.mts`.

```bash
curl -s -X POST https://HOST/v1/metrics \
  -H "authorization: Bearer $PYXIS_KEY" -H "content-type: application/json" \
  -d '{"resourceMetrics":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"api"}}]},
       "scopeMetrics":[{"metrics":[{"name":"http.server.request.duration","unit":"s",
       "histogram":{"aggregationTemporality":1,"dataPoints":[{"timeUnixNano":"'$(date +%s)'000000000",
       "count":"3","sum":0.12,"bucketCounts":["1","2","0"],"explicitBounds":[0.05,0.1],
       "attributes":[{"key":"http.response.status_code","value":{"intValue":200}},
                     {"key":"http.request.method","value":{"stringValue":"GET"}},
                     {"key":"http.route","value":{"stringValue":"/v1/items/:id"}}]}]}}]}]}]}'
```

| Response | Meaning |
|---|---|
| `200 {}` | All data points accepted |
| `200 { partialSuccess: { rejectedDataPoints, errorMessage } }` | Some dropped; `errorMessage` lists reason codes. `route_cardinality_capped` is reported here although the data is kept under `/_other` |
| `400 invalid_json`, `413 payload_too_large`, `413 too_many_data_points`, `415 unsupported_content_type` | Rejected before storage |

There is **no idempotency**: a retried batch is counted twice.

### `POST /v1/wallet-events`, `OPTIONS /v1/wallet-events`

CORS allows any origin with the `authorization` and `content-type` headers. Body: `{ "events": [ ... ] }`, at most 50 events and 20,000 characters.

| Property | Rule |
|---|---|
| `event` | One of the nine allowlisted names |
| `wallet_provider` | One of nine values; anything else becomes `other` |
| `network` | `testnet`, `public`, `other`; anything else becomes `other` |
| `failure_category` | Matches `^[a-z_]{1,32}$` (not an enum) |
| `flow`, `sdk_version`, `ts` | Accepted and ignored; the server stamps its own time |
| Any other property | The event is rejected with `prohibited_property` |

Response: `200 { accepted, rejected: [{ index, reason }] }` even when every event is rejected; `400 events_array_required` or `400 batch_too_large` for a malformed batch. The route does **not** update `last_used_at` and writes no `ingestion_audit` row.

### `POST /v1/traces`, `POST /v1/logs`

Always `404 { code: "signal_not_supported" }`. Nothing is stored.

## 4. What this API does not provide

- No read API for ecosystem consumers using an API key (the `query` scope is unused).
- No export endpoint, no webhook, no data-erasure endpoint, no project deletion.
- No pagination: lists are returned whole, and `endpoints` is capped at 500 rows.
- No service or environment filter on the analytics queries; staging and production data of one project are summed.
