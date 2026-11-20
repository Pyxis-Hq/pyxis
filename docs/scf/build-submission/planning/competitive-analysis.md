# Competitive and differentiation analysis

**Status:** draft for the SCF Build submission. **Evidence basis:** Pyxis repository at commit `a7df1da` (see the evidence register); competitor facts below come from general public knowledge and must be re-checked against each project's current documentation before they are quoted in the submission. They are marked **(verify)**.
**Related:** [03-rfp-requirements-matrix.md](../03-rfp-requirements-matrix.md), [04-rfp-gap-analysis.md](../04-rfp-gap-analysis.md), [technical-specification.md](../technical/technical-specification.md).

## 1. What this document is for

The RFP asks proposers to justify their choice of web-analytics engine (Umami or GoatCounter) and rewards a realistic view of the field. This document compares Pyxis with the tools a Stellar project would otherwise use, says where Pyxis is genuinely different, and lists what Pyxis does **not** do. It does not claim Pyxis is better because it is Stellar-focused.

## 2. What Pyxis is today (verified)

| Capability | Status | Evidence |
|---|---|---|
| Multi-tenant projects with per-project isolation in PostgreSQL | IMPLEMENTED, tested on a real PostgreSQL | `db/migrations/001_init.sql:143-164`, `tests/db.test.ts` |
| API metrics via OTLP/HTTP **JSON**, delta histograms only, stored as aggregates | IMPLEMENTED | `src/app/v1/metrics/route.ts`, `src/server/ingest/otlp.ts` |
| p50/p95/p99 from merged histograms (never averaged) | IMPLEMENTED | `src/server/queries.ts:16-35` |
| Web analytics through Umami (domain verification, website creation, report) | IMPLEMENTED, NOT INDEPENDENTLY VERIFIED: tested against a fake server only | `src/server/umami.ts:1-2`, `tests/web.test.ts` |
| Wallet funnel counts through `@pyxis-hq/wallets-kit` | IMPLEMENTED; frontend-reported only | `sdk/wallets-kit/src/index.ts`, `src/app/v1/wallet-events/route.ts` |
| Operator (SCF) cross-project aggregate view with audit log | IMPLEMENTED | `src/app/api/v1/operator/overview/route.ts`, `operator_audit_events` table |
| Soroban or on-chain verification | **MISSING** | no Soroban, RPC or Horizon code in the repository |
| Rate limiting, retention jobs, bot filtering, erasure workflow | **MISSING** | see the gap analysis |

## 3. Comparison

| Tool | What it is | Licence **(verify)** | Where it fits | Where Pyxis differs | Where Pyxis is weaker |
|---|---|---|---|---|---|
| **Umami** | Privacy-focused web analytics | MIT | The web-analytics engine Pyxis wraps | Pyxis adds tenants, wallet sign-in, API analytics and an operator view around it | Pyxis adds no new web-analytics capability; it depends on Umami's accuracy and release cadence |
| **GoatCounter** | Lightweight web analytics | EUPL-1.2 | The RFP's alternative engine | Same as above | Not used by Pyxis; a switch would need a new client |
| **Plausible** | Privacy-focused web analytics | AGPL-3.0 for the community edition | Hosted or self-hosted site analytics | Pyxis is built for shared multi-project hosting by a community operator | Plausible is mature, with funnels, goals and a large user base |
| **PostHog** | Product analytics suite | MIT core with separately licensed enterprise code | Product analytics, session replay, feature flags | Pyxis collects counts only and stores no individual events | PostHog covers far more and can be self-hosted at scale |
| **Grafana + Prometheus** | Metrics collection and dashboards | AGPL-3.0 (Grafana), Apache-2.0 (Prometheus) | Operator-grade API monitoring | Pyxis needs one exporter setting and gives a ready dashboard per project | Grafana and Prometheus are far more flexible, scalable and battle-tested |
| **Datadog** | Commercial observability SaaS | Proprietary | Full-stack APM | Pyxis is open source, charges nothing and is designed as a **second** destination | Datadog does traces, logs, alerting and infrastructure monitoring |
| **OpenTelemetry-native backends** (for example Jaeger, SigNoz, Tempo) | Trace and metric stores | Various **(verify)** | Teams that already export OTLP | Pyxis deliberately discards traces and logs and keeps only aggregates | These keep traces and logs; Pyxis cannot answer "why was this request slow" |
| **Web3 analytics tools** (for example wallet-focused dashboards) | Product analytics for dApps | Various **(verify)** | On-chain and wallet-behaviour analysis | Pyxis counts frontend wallet events without addresses | Pyxis has **no on-chain analytics**; it cannot report on contract activity or transactions |

## 4. What is genuinely different about Pyxis

1. **One shared, multi-project service for an ecosystem.** Most tools above are one tenant per deployment. Pyxis is built so a community operator hosts many Stellar projects and can see aggregates across them, with a per-project boundary enforced in the database (`FORCE ROW LEVEL SECURITY`, non-owner runtime role). **Verified for isolation; not verified at scale.**
2. **Three surfaces, one place, one privacy rule.** Web, API and wallet-funnel analytics share the same "store counts, never individuals" rule and the same project model.
3. **A wallet funnel that cannot hold an address.** The server rejects any property outside an allowlist (`src/server/wallet-events.ts:11-36`), and the SDK sends no addresses, signatures or XDR.
4. **Dual-export design.** Projects keep their existing APM and add Pyxis as a second OTLP destination.
5. **Handover-oriented.** An Apache-2.0 monorepo, an operator guide and a documented DB role split exist today. **Infrastructure-as-code and a verified container image do not.**

## 5. What is not a differentiator (do not claim)

- "Stellar-focused" by itself. Today the Stellar-specific parts are wallet sign-in and the wallet-funnel event names. There is **no Soroban or ledger integration**.
- Performance. No load test or benchmark exists. The one-million-requests-per-day figure is a design target in the RFP, not a measured result.
- Availability. No availability measurement exists, and a single Railway service cannot honestly support the RFP's 99.99% ingestion target.
- Compliance. No legal review or certification exists.

## 6. Honest positioning statement (draft)

> Pyxis is not a replacement for Grafana, Datadog or PostHog. It is a shared, privacy-first analytics service that a Stellar community operator can run for many projects at once, built on Umami for web analytics and OpenTelemetry metrics for APIs. Today it has a working multi-tenant core, a published wallet SDK and a live deployment; it does not yet have on-chain analytics, rate limiting, retention jobs or a load-tested ingestion path, and the build award would fund those.

## 7. Umami or GoatCounter (draft rationale, team to confirm)

The repository uses Umami (`src/server/umami.ts`, `docker-compose.yml`). A defensible rationale, **to be confirmed by the team before submission**:

| Criterion | Umami | GoatCounter |
|---|---|---|
| Licence | MIT, permissive | EUPL-1.2 (copyleft) |
| Multi-website under one install | Yes, with a REST API and per-website IDs used by Pyxis | Supported, with a different model |
| Storage | PostgreSQL (shared operational skill with Pyxis) | SQLite or PostgreSQL |
| Tracker | Small script, `data-domains` filter, custom events | Very small script |
| Risk in this codebase | The client is **not yet tested against a real Umami release**; the docker-compose file uses a mutable `latest` tag | No integration exists |

The decision is only defensible once the Umami integration is run against a pinned real release (see the gap analysis, item W-1).
