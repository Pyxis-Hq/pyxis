# Privacy and data protection

**Status:** describes what Pyxis collects, stores, processes and discards **today**, and the gaps against the RFP's privacy requirements. **This document makes no legal-compliance claim.** No lawyer has reviewed it, and the RFP requirements on GDPR, data residency and erasure are not implemented.
**Evidence basis:** `db/migrations/001_init.sql`, `src/server/ingest/*`, `src/server/wallet-events.ts`, `src/server/auth/session.ts`, `sdk/wallets-kit/src/index.ts`, and the code-level audits.
**Related:** [../technical/telemetry-specification.md](../technical/telemetry-specification.md), [threat-model.md](threat-model.md).

## 1. Design position

Pyxis aims to measure how services are used **without profiling the people using them**. The rule is applied at the ingest boundary: counters and fixed-bucket histograms are stored; request bodies, IP addresses, user agents, query strings and free text are not.

## 2. What is collected, stored, processed and discarded

| Surface | Collected on the wire | Stored by Pyxis | Processed transiently | Discarded at the boundary |
|---|---|---|---|---|
| API metrics | OTLP metric data points with resource and data-point attributes | 60-second aggregates: service, environment, method, normalized route, status, request count, latency sum and histogram | The raw OTLP JSON | Every attribute not on the allowlist; paths with identifiers are templated; traces and logs are rejected (`404`) |
| Wallet funnel | Event name, provider category, network, failure category, SDK version, timestamp | Counts per minute by event, provider category, network | The batch | Failure category, SDK version, client timestamp; **any event with another property is rejected** |
| Web analytics | Umami tracker events from the visitor's browser | **Nothing in the Pyxis database** | n/a | n/a; **Umami stores visitor data; its handling is not verified** |
| Dashboard users | Stellar public key; signed challenge | `users.stellar_account`; SHA-256 of the session token | The signature | The token and signature |
| Ingest keys | Secret at creation | SHA-256 of the secret; name; scopes | n/a | The secret |

## 3. Personal data in scope

| Item | Personal data? | Notes |
|---|---|---|
| Stellar public key of a dashboard user and of invited members | A pseudonymous identifier; likely personal data if linkable to a person. **Legal view not obtained** | Stored indefinitely; no deletion endpoint |
| Wallet addresses of end users of a tenant's dApp | **Not collected**: the SDK sends none and the server rejects any address-like property | Tested for property names (`tests/wallet.test.ts`) |
| IP addresses and user agents of API clients | **Not stored by Pyxis** | Hosting-platform access logs may hold IPs; **Railway's log retention was not inspected** |
| Website visitor data | **Held by Umami**: depends on Umami's configuration, which has not been run for Pyxis | Open question: what Umami stores, for how long, and how a tenant erases it |

## 4. Controls that exist

| Control | Status | Evidence |
|---|---|---|
| Strict event allowlist with server-side stamping of time | IMPLEMENTED | `wallet-events.ts:11-36` |
| Route templating of Stellar accounts, contracts, UUIDs, numeric IDs and long hashes | IMPLEMENTED | `normalize.ts`; `tests/unit.test.ts` |
| Traces, logs and request bodies are never stored | IMPLEMENTED | `v1/traces`, `v1/logs`; `otlp.ts` |
| SDK honours Do Not Track and Global Privacy Control; consent switch | IMPLEMENTED | `sdk/wallets-kit/src/index.ts`; `tests/sdk.test.ts` |
| SDK uses no cookies or browser storage | IMPLEMENTED | source search |
| Secrets stored only as hashes | IMPLEMENTED | `keys.ts`, `session.ts` |
| Tenant isolation in the database | IMPLEMENTED | `tests/db.test.ts` |
| Operator access to tenant data is aggregate-only and audited | IMPLEMENTED, with one gap | wallet funnel read is not audited |

## 5. Gaps against the RFP

| RFP requirement | Status | What is missing |
|---|---|---|
| GDPR compliance **without** client-side opt-in; state where opt-in is still required (W10, D11) | MISSING | Legal analysis by jurisdiction; a published statement; confirmation of Umami settings that avoid personal data |
| Data-residency declaration (W11) | MISSING | A decision. The live app is deployed in Railway region `us-west2` (observed in the deployment manifest); no statement exists |
| Minimize erasure exposure and provide a tenant-triggered erasure workflow (W12) | MISSING | No endpoint deletes a project, a member or visitor data; no purge reaches Umami |
| Bot and fraud mitigation (W2) | MISSING | Strategy and configuration |
| Retention (A6) | PARTIAL | Aggregates are kept forever; no policy, no rollup, no purge of sessions or challenges |
| Disclosure of what Umami stores | MISSING | Review of the chosen Umami release and settings |

## 6. Retention today

| Data | Retention |
|---|---|
| API and wallet aggregates | Indefinite |
| Audit tables | Indefinite |
| Sessions and challenges | Rows are not deleted after expiry |
| Users and members | Until the project is removed by cascade; no endpoint exists |

## 7. User protections available to tenants today

A tenant can: revoke any ingest key immediately; remove non-owner members; see exactly which events and fields the SDK sends (source is open); disable the SDK with one call; read the operator audit trail **in the database only** (no user-facing view). A tenant **cannot** export or erase its data.

## 8. Plan to close the gaps (Tranche 2, deliverable T2-3)

1. Decide the legal position by jurisdiction with qualified counsel and publish the statements (privacy, residency, GDPR without opt-in).
2. Run a pinned Umami release and document what it stores; configure it to avoid personal data where possible.
3. Build the tenant-triggered erasure workflow: delete the project's aggregates, members and keys in Pyxis, and delete the corresponding website data in Umami; log the request; verify deletion with a test.
4. Add the retention job and purge of expired sessions and challenges.
5. Define and test bot mitigation for the web path.

**Acceptance:** counsel-reviewed statements are published; an erasure request removes the tenant's data in Pyxis and Umami and a test proves it; the retention job removes aged rows in a test database.

## 9. Statements that must not be made yet

"GDPR compliant"; "no personal data is processed"; "data stays in region X"; "visitor data cannot be re-identified"; "erasure is supported".
