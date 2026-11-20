# RFP compliance matrix

**RFP:** "Web and API Analytics for Stellar Ecosystem Projects" on <https://stellar.gitbook.io/scf-handbook/scf-awards/build-award/rfp-track>. Requirement text below is an **accurate summary** of the RFP page read on 2026-11-20, not a verbatim quote; compare it with the live RFP.
**Status:** each row says what exists today and which funded deliverable closes the rest. Statuses follow one rule: a row is IMPLEMENTED only when a test or an observation backs it, never because a document says so.
**Related:** [technical/technical-specification.md](technical/technical-specification.md), [planning/roadmap-and-milestones.md](planning/roadmap-and-milestones.md) (deliverable codes T1-x, T2-x, T3-x), [planning/acceptance-test-plan.md](planning/acceptance-test-plan.md), [evidence/README.md](evidence/README.md).

**Status labels:** IMPLEMENTED (code exists and its behaviour was verified by a test or observation) · IMPLEMENTED, NIV (implemented, **not independently verified**) · PARTIAL · PLANNED · MISSING · BLOCKED (needs a decision or a third party).


## 1. General (RFP section 3.1)

| ID | RFP requirement | Pyxis implementation | Status | Evidence | Proposed deliverable | Acceptance test |
|---|---|---|---|---|---|---|
| G1 | Multi-tenant platform; each tenant sees only its own data | Row-level security on 8 tables, forced; non-owner runtime role; tenant set per transaction | IMPLEMENTED | `001_init.sql:143-164`; `tests/db.test.ts` (8 isolation tests, all pass) | T2-1, T1-4 | Cross-tenant negative tests for every route run in CI |
| G2 | Designated SCF operators get a global view | Operator overview of API aggregates, audited | IMPLEMENTED | `src/app/api/v1/operator/overview/route.ts` | T2-4, T2-5 | Operator reads of every tenant view write an audit row |
| G3 | Self-service enrollment for any Stellar-built project | Any signed-in wallet can create a project and becomes its owner | IMPLEMENTED | `src/app/api/v1/projects/route.ts:14-22` | T1-2, T2-4 | A wallet cannot exceed a documented project quota; creation is rate limited |
| G4 | Operators can remove non-ecosystem projects | Operators set `suspended` or `archived` (audited); suspended keys stop working | PARTIAL | `operator/projects/[id]/status/route.ts`; `keys.ts:39` | T2-4 | Operator removal deletes tenant data and is audited |
| G5 | Able to move later to approval-required enrollment | Project status enum has `pending`, but creation always yields `active` | PARTIAL | `001_init.sql:35`; `pyxis_create_project` | T2-4 | A configuration switch makes new projects `pending` until an operator approves |
| G6 | One open-source monorepo with all code **and infrastructure-as-code**; OSI licence | Apache-2.0; npm workspaces (`sdk/*`, `apps/*`); no IaC | PARTIAL | `LICENSE`; root `package.json` workspaces | T1-6 | A clean checkout rebuilds a working environment from the monorepo alone |
| G7 | Zero fees to tenants, SCF or anyone | No billing or metering code | IMPLEMENTED | search of `src/`, `db/` finds none | none | Statement in README and onboarding guide |
| G8 | SCF can generate and revoke API keys for downstream machine access to metrics | `query` scope can be created; **no route consumes it**; no operator key UI | MISSING | `keys.ts:5`; only `/v1/metrics` and `/v1/wallet-events` call `authenticateKey` | T1-5 | A `query` key reads documented aggregates; revocation takes effect immediately |
| G9 | Proposers unknown to SCF are not eligible; maintainer history is weighed | Nothing in the repository can show this | BLOCKED | RFP text | none | Team supplies verifiable history |

## 2. Web analytics (RFP section 3.2)

| ID | RFP requirement | Pyxis implementation | Status | Evidence | Proposed deliverable | Acceptance test |
|---|---|---|---|---|---|---|
| W1 | Collection only from frontend code | Umami tracker on the tenant's site; Pyxis collects nothing server-side for web | IMPLEMENTED | `umami.ts`; a real Umami 2.20.2 recorded page views in controlled sessions on 2026-11-20 ([evidence](evidence/umami/analytics-verification.md)). Not yet in CI | T1-1 | Real Umami records a page view from a test site |
| W2 | Bot and fraud mitigation strategy | No Pyxis code; Umami's behaviour unverified | MISSING | none | T2-3 | Documented strategy plus a test showing known bot traffic is excluded |
| W3 | Low-friction integration for static HTML, SPAs and SSR | Snippet generated per site; guide published | PARTIAL | `umami.ts:49-51`; docs `guides/web-analytics.mdx` | T1-1 | Sample static, SPA and SSR apps all report page views |
| W4 | Tracking script pinned to a specific version; no dynamic remote updates | Snippet points at `/script.js` of whichever Umami runs; compose uses the mutable tag `postgresql-latest` | MISSING | `umami.ts:48`; `docker-compose.yml` | T1-1 | Deployed image is a digest; script has a version or hash; upgrade is a reviewed change |
| W5 | Strategy against supply-chain attacks | Dependabot alerts and updates; secret scanning; lockfile | PARTIAL | `.github/dependabot.yml`; `SECURITY.md` | T1-4, T1-6 | CI runs audit and secret scan; published artifacts carry provenance |
| W6 | Required metrics: page views, unique visitors, referrers, session duration, bounce rate, country, device and browser | Report returns these metrics from Umami; verified against Umami's own API for all except referrers | PARTIAL | `umami.ts`; two controlled sessions matched Umami's API on page views, visitors, bounce rate, session time, country, browser and device; referrers not exercised ([evidence](evidence/api-and-web-capture/tested-workflows.md)) | T1-1 | Metrics match a known synthetic traffic script within a stated tolerance |
| W7 | Nice to have: custom events | Not surfaced | MISSING | none | T3-4 (stretch) | n/a |
| W8 | Nice to have: automatic capture of Stellar Wallets Kit events | SDK exists; capture is manual `track()` | PARTIAL | `sdk/wallets-kit/src/index.ts`; docs `reference/sdk.mdx` | T3-4 (stretch) | Adapter reports connect and sign events with no manual calls |
| W9 | Script and endpoint names that popular ad blockers do not block | Default Umami names | MISSING | none | T2-3 | Script loads with a standard blocklist enabled |
| W10 | GDPR compliance **without** client-side opt-in; state where opt-in is required | No analysis | MISSING | none | T2-3 | Published statement reviewed by qualified counsel |
| W11 | Declare data-residency choices | Railway region observed as `us-west2`; no statement | MISSING | deployment manifest | T2-3 | Published residency statement matches the deployment |
| W12 | Minimize erasure exposure; tenant-triggered erasure workflow if personal data is stored | None; Pyxis stores no visitor data, **Umami does** | MISSING | none | T2-3 | A tenant erases its web data and verification shows it gone |
| W13 | Document the full privacy and compliance strategy | `SECURITY.md`, this package | PARTIAL | `SECURITY.md`; [privacy-and-data-protection.md](security/privacy-and-data-protection.md) | T2-3 | Counsel-reviewed document |
| W14 | Tenant dashboard: private web metrics for selectable ranges | UI and API exist; range limit 90 days | IMPLEMENTED | `sites/[siteId]/web/route.ts`; dashboard matched Umami's API in two sessions ([evidence](evidence/api-and-web-capture/tested-workflows.md)) | T1-1 | As W6 |
| W15 | Global operator dashboard for web metrics with filter, sort and comparison | None; operator view is API metrics only | MISSING | `operator/overview/route.ts` | T2-5 | Operator compares web metrics across projects, audited |

## 3. API analytics (RFP section 3.3)

| ID | RFP requirement | Pyxis implementation | Status | Evidence | Proposed deliverable | Acceptance test |
|---|---|---|---|---|---|---|
| A1 | Tenants dual-export standard OpenTelemetry to their APM and the collector | OTLP/HTTP **JSON**, delta histograms only | PARTIAL | `v1/metrics/route.ts`; a stock OpenTelemetry Node SDK with the documented settings (OTLP/HTTP JSON, delta) was accepted and all 270 requests were counted ([evidence](evidence/api-and-web-capture/tested-workflows.md)). Protobuf, gRPC and gzip are not supported yet | T1-2 | Stock OTel SDKs and Collector export with default settings and are accepted |
| A2 | Collector discards traces, spans and deep logs; stores only metrics (counters, histograms) in PostgreSQL | `/v1/traces`, `/v1/logs` return 404; only histogram aggregates stored | IMPLEMENTED | `v1/traces`, `v1/logs`; `otlp.ts`; `tests/unit.test.ts` (OTLP parsing); `scripts/e2e-smoke.mts` (manual) | none | Existing unit and e2e checks |
| A3 | Required attributes: tenant and service identity, normalized route, status, latency | Tenant from key; service, environment, method, route, status, histogram | IMPLEMENTED | `otlp.ts:52-113`; `tests/unit.test.ts` | T1-2 | Unit handling test |
| A4 | Default hard-coded path normalization | UUID, `G`/`C`/`M` accounts, integers, hex hashes | IMPLEMENTED | `normalize.ts`; `tests/unit.test.ts:10-27` | T1-2 | Extended fixture set |
| A5 | Design target about 1,000,000 requests per day across all tenants | Pre-aggregation to 60-second buckets; cardinality caps | PARTIAL | `otlp.ts:8-16` | T1-3, T2-6 | Published load test at or above the target with method, hardware and results |
| A6 | Aggregated views retained at least 24 months | Nothing deletes data | PARTIAL | no retention job exists (search) | T1-3 | Rollup and retention job tested; 24-month policy documented |
| A7 | Same isolation rules as the web path | API path isolated by RLS; web path isolated by an application lookup under one shared Umami login; web path exercised against a real Umami, with no automated cross-tenant test yet | PARTIAL | `001_init.sql`; `sites/[siteId]/web/route.ts` | T2-1 | Test that one tenant cannot read another tenant's Umami site |
| A8 | Tenant dashboard: volume, status distribution, latency percentiles (p50, p95, p99), time ranges | Implemented | IMPLEMENTED | `queries.ts:16-77`; `tests/unit.test.ts:31-38` | T1-4 | Percentile accuracy test against a known distribution |
| A9 | Global dashboard: cross-project API comparison | Implemented | IMPLEMENTED | `operator/overview/route.ts` | T2-5 | Comparison within a latency budget at N projects |

## 4. Hosting, support and handover (RFP section 3.4)

| ID | RFP requirement | Pyxis implementation | Status | Evidence | Proposed deliverable | Acceptance test |
|---|---|---|---|---|---|---|
| H1 | Ingestion availability 99.99% | One replica per service, no standby, no monitoring | MISSING | deployment manifest: 1 replica | T2-2, T3-1 | Measured availability over a stated window; an honest SLO is proposed |
| H2 | Dashboard availability 99.90% | As H1 | MISSING | as H1 | T2-2, T3-1 | As H1 |
| H3 | Critical and high vulnerabilities patched within 24 hours | No process; 10 high findings remain in the wallet-kit tree with no upstream fix | MISSING | `SECURITY.md` known-weakness rows | T1-4, T3-1 | Documented process and a drill |
| H4 | Tickets answered within 5 business days, resolved within 10 | Issue forms exist; no support policy | MISSING | `.github/ISSUE_TEMPLATE` | T3-1 | Published policy and a response log |
| H5 | No mandatory on-call; public issue tracker is enough | Public repository with issues | IMPLEMENTED | GitHub repository | none | n/a |
| H6 | Host and support for 12 months after the final tranche is approved | No commitment, no cost model | BLOCKED | none | none | Written commitment |
| H7 | Handover between months 6 and 12: repository ownership, data migration, domain transfer or redirect | A handover plan exists; nothing is built | PLANNED | `docs/handover-build-plan.md` | T3-3 | A community operator runs the system from the monorepo |

## 5. Expected deliverables (RFP section 5)

| ID | RFP requirement | Pyxis implementation | Status | Evidence | Proposed deliverable | Acceptance test |
|---|---|---|---|---|---|---|
| D1 | Fully functional multi-tenant web and API analytics platform | Core works; the web and API paths were exercised in controlled internal sessions ([evidence](evidence/README.md)) | PARTIAL | this matrix | T1-x, T2-x | All W and A rows pass |
| D2 | Monorepo: all application code | On `main`, public | IMPLEMENTED | <https://github.com/Pyxis-Hq/pyxis> | none | n/a |
| D3 | Monorepo: full infrastructure-as-code | `railway.json`; unverified compose; no Dockerfile | MISSING | repository | T1-6 | Clean-checkout rebuild |
| D4 | Monorepo: deployment documentation | "Run Pyxis in production" guide; Railway steps run | IMPLEMENTED, NIV | `apps/docs/content/docs/guides/run-in-production.mdx` | T1-6, T3-3 | An outside operator deploys from the guide |
| D5 | Monorepo: operator runbooks | Fragments only | MISSING | `SECURITY.md`, handover plan | T2-2, T3-3 | Each runbook exercised once |
| D6 | Monorepo: tenant onboarding guide | Quickstart and three guides published | IMPLEMENTED, NIV | docs site | T3-2 | A pilot team onboards unaided |
| D7 | Monorepo: automated test suite | 80 tests in 5 files; CI runs typecheck, tests, builds | IMPLEMENTED | `tests/**`; CI run on `main` (<https://github.com/Pyxis-Hq/pyxis/actions>) | T1-4 | CI includes auth, route and cross-tenant tests, lint and coverage |
| D8 | Monorepo: security and privacy/compliance documentation | `SECURITY.md`, this package | PARTIAL | [security/](security/) | T2-1, T2-3 | Reviewed documents |
| D9 | Monorepo: monitoring and alerting baseline | None; console logs only | MISSING | repository | T2-2 | An induced failure raises an alert |
| D10 | Live proof of adoption: 3 SCF-awarded projects on web analytics, 1 on API traffic, a live global view, a tenant video | None | BLOCKED | none | T3-2 | Four named projects with live data |
| D11 | Statements on data residency, GDPR without opt-in, and erasure | None | MISSING | none | T2-3 | Published statements |

## 6. Evaluation criteria (RFP section 6)

| ID | Criterion | Pyxis position | Status | Evidence |
|---|---|---|---|---|
| E1 | Technical soundness | Sound core, honest gaps | PARTIAL | this package |
| E2 | Umami vs GoatCounter rationale | Umami chosen; draft rationale | PARTIAL | The rationale is not yet published as a standalone document; the tool choice is described in [technical/technical-specification.md](technical/technical-specification.md) |
| E3 | Prior experience, open-source maintainer history, SCF and SDF history | Not shown by the repository | BLOCKED | none |
| E4 | Privacy and security posture | Strong design, no rate limiting, no scanning | PARTIAL | [security/threat-model.md](security/threat-model.md) |
| E5 | SLA realism | None proposed | MISSING | none |
| E6 | Handover plan | Plan exists | PARTIAL | `docs/handover-build-plan.md` |
| E7 | Onboarding plan | Guides exist | PARTIAL | docs site |
| E8 | Repository quality | Clean history, Apache-2.0, CI | PARTIAL | repository |

## 7. Counts

59 rows. IMPLEMENTED: 14 · IMPLEMENTED, NIV: 2 · PARTIAL: 20 · PLANNED: 1 · MISSING: 18 · BLOCKED: 4.

**IMPLEMENTED** (14): G1, G2, G3, G7, W1, W14, A2, A3, A4, A8, A9, H5, D2, D7.

**IMPLEMENTED, NIV** (2): D4, D6.

**PARTIAL** (20): G4, G5, G6, W3, W5, W6, W8, W13, A1, A5, A6, A7, D1, D8, E1, E2, E4, E6, E7, E8.

**PLANNED** (1): H7.

**MISSING** (18): G8, W2, W4, W7, W9, W10, W11, W12, W15, H1, H2, H3, H4, D3, D5, D9, D11, E5.

**BLOCKED** (4): G9, H6, D10, E3.

The matrix is a snapshot. The evidence folder holds the runs behind each claim and the limits of each run.
