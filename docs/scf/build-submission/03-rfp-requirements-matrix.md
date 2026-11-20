# 03 · RFP requirements matrix

**RFP:** "Web and API Analytics for Stellar Ecosystem Projects", listed under *Current Open RFPs* on <https://stellar.gitbook.io/scf-handbook/scf-awards/build-award/rfp-track> when fetched on 2026-11-20. The same page lists a second open RFP, "XDR/CAP-Coverage Audit Tool and Indexer-Hardening Guide". The page gives **no opening date, quarter or round** for either RFP.
**Status:** re-verified against code at commit `a7df1da`. Requirement text below is an **accurate summary** of the RFP page, not a verbatim quote. The team must compare it with the live RFP and the invitation email before submission, because the RFP, the form and the round can change.
**Evidence basis:** [01-repository-inventory.md](01-repository-inventory.md), [02-test-and-verification-report.md](02-test-and-verification-report.md), the three subsystem audits. IDs match the older [docs/rfp-acceptance-matrix.md](../../rfp-acceptance-matrix.md) so the two can be compared.
**Related:** [04-rfp-gap-analysis.md](04-rfp-gap-analysis.md), [planning/roadmap-and-milestones.md](planning/roadmap-and-milestones.md).

**Status labels:** IMPLEMENTED (code exists and its behaviour was verified by a test or observation) · IMPLEMENTED, NIV (implemented, **not independently verified**) · PARTIAL · PLANNED · MISSING · BLOCKED (needs a human or external decision).

**Why some statuses are lower than in the older matrix.** This audit applies the rule "do not upgrade a status because a document says it": a row is IMPLEMENTED only when a test or an observation backs it. The differences are listed in [FINAL-AUDIT-REPORT.md](FINAL-AUDIT-REPORT.md) section 7.

**Deliverable codes** used in the "Proposed deliverable" column are defined in [planning/roadmap-and-milestones.md](planning/roadmap-and-milestones.md) (T1-x, T2-x, T3-x).

## 1. General (RFP section 3.1)

| ID | RFP requirement | Pyxis implementation | Status | Evidence | Gap | Proposed deliverable | Acceptance test | Risk if not delivered |
|---|---|---|---|---|---|---|---|---|
| G1 | Multi-tenant platform; each tenant sees only its own data | Row-level security on 8 tables, forced; non-owner runtime role; tenant set per transaction | IMPLEMENTED | `001_init.sql:143-164`; `tests/db.test.ts` (8 isolation tests, all pass) | Not exercised at HTTP level in CI; not load-tested; `users`, `sessions`, `auth_challenges` have no RLS by design | T2-1, T1-4 | Cross-tenant negative tests for every route run in CI | Critical |
| G2 | Designated SCF operators get a global view | Operator overview of API aggregates, audited | IMPLEMENTED | `src/app/api/v1/operator/overview/route.ts` | Web metrics absent (W15); operator reads of `/wallet` are **not** audited | T2-4, T2-5 | Operator reads of every tenant view write an audit row | Medium |
| G3 | Self-service enrollment for any Stellar-built project | Any signed-in wallet can create a project and becomes its owner | IMPLEMENTED | `src/app/api/v1/projects/route.ts:14-22` | No rate limit, quota or abuse control; unlimited projects per wallet | T1-2, T2-4 | A wallet cannot exceed a documented project quota; creation is rate limited | Medium |
| G4 | Operators can remove non-ecosystem projects | Operators set `suspended` or `archived` (audited); suspended keys stop working | PARTIAL | `operator/projects/[id]/status/route.ts`; `keys.ts:39` | No deletion or data purge | T2-4 | Operator removal deletes tenant data and is audited | Medium |
| G5 | Able to move later to approval-required enrollment | Project status enum has `pending`, but creation always yields `active` | PARTIAL | `001_init.sql:35`; `pyxis_create_project` | No approval flow or switch | T2-4 | A configuration switch makes new projects `pending` until an operator approves | Low |
| G6 | One open-source monorepo with all code **and infrastructure-as-code**; OSI licence | Apache-2.0; npm workspaces (`sdk/*`, `apps/*`); no IaC | PARTIAL | `LICENSE`; root `package.json` workspaces | IaC missing (see D3) | T1-6 | A clean checkout rebuilds a working environment from the monorepo alone | High |
| G7 | Zero fees to tenants, SCF or anyone | No billing or metering code | IMPLEMENTED | search of `src/`, `db/` finds none | None; state it in docs | none | Statement in README and onboarding guide | Low |
| G8 | SCF can generate and revoke API keys for downstream machine access to metrics | `query` scope can be created; **no route consumes it**; no operator key UI | MISSING | `keys.ts:5`; only `/v1/metrics` and `/v1/wallet-events` call `authenticateKey` | Read API and operator-issued read keys | T1-5 | A `query` key reads documented aggregates; revocation takes effect immediately | High |
| G9 | Proposers unknown to SCF are not eligible; maintainer history is weighed | Nothing in the repository can show this | BLOCKED | RFP text | Team's SCF/SDF history and open-source record (human evidence) | none | Team supplies verifiable history | **Critical** |

## 2. Web analytics (RFP section 3.2)

| ID | RFP requirement | Pyxis implementation | Status | Evidence | Gap | Proposed deliverable | Acceptance test | Risk |
|---|---|---|---|---|---|---|---|---|
| W1 | Collection only from frontend code | Umami tracker on the tenant's site; Pyxis collects nothing server-side for web | IMPLEMENTED, NIV | `umami.ts:48-51` | No Umami deployed or tested | T1-1 | Real Umami records a page view from a test site | Medium |
| W2 | Bot and fraud mitigation strategy | No Pyxis code; Umami's behaviour unverified | MISSING | none | Strategy, configuration and evidence | T2-3 | Documented strategy plus a test showing known bot traffic is excluded | High |
| W3 | Low-friction integration for static HTML, SPAs and SSR | Snippet generated per site; guide published | PARTIAL | `umami.ts:49-51`; docs `guides/web-analytics.mdx` | SPA and SSR not tested | T1-1 | Sample static, SPA and SSR apps all report page views | Medium |
| W4 | Tracking script pinned to a specific version; no dynamic remote updates | Snippet points at `/script.js` of whichever Umami runs; compose uses the mutable tag `postgresql-latest` | MISSING | `umami.ts:48`; `docker-compose.yml` | Pin image digest and script; integrity hash; the code comment "version-pinned" is inaccurate | T1-1 | Deployed image is a digest; script has a version or hash; upgrade is a reviewed change | High |
| W5 | Strategy against supply-chain attacks | Dependabot alerts and updates; secret scanning; lockfile | PARTIAL | `.github/dependabot.yml`; `SECURITY.md` | No SBOM, no pinned digests, no CI scanning, no package provenance | T1-4, T1-6 | CI runs audit and secret scan; published artifacts carry provenance | Medium |
| W6 | Required metrics: page views, unique visitors, referrers, session duration, bounce rate, country, device and browser | Report returns exactly these from Umami | IMPLEMENTED, NIV | `umami.ts:31-46` | Tested against a fake only; Umami's definitions and API shape unverified | T1-1 | Metrics match a known synthetic traffic script within a stated tolerance | High |
| W7 | Nice to have: custom events | Not surfaced | MISSING | none | Optional | T3-4 (stretch) | n/a | Low |
| W8 | Nice to have: automatic capture of Stellar Wallets Kit events | SDK exists; capture is manual `track()` | PARTIAL | `sdk/wallets-kit/src/index.ts`; docs `reference/sdk.mdx` | Adapter not built | T3-4 (stretch) | Adapter reports connect and sign events with no manual calls | Low |
| W9 | Script and endpoint names that popular ad blockers do not block | Default Umami names | MISSING | none | Rename or proxy; evidence against blocklists | T2-3 | Script loads with a standard blocklist enabled | Low |
| W10 | GDPR compliance **without** client-side opt-in; state where opt-in is required | No analysis | MISSING | none | Legal review and statement | T2-3 | Published statement reviewed by qualified counsel | High |
| W11 | Declare data-residency choices | Railway region observed as `us-west2`; no statement | MISSING | deployment manifest | Decide and publish | T2-3 | Published residency statement matches the deployment | Medium |
| W12 | Minimize erasure exposure; tenant-triggered erasure workflow if personal data is stored | None; Pyxis stores no visitor data, **Umami does** | MISSING | none | Erasure workflow for tenant data in Pyxis and Umami | T2-3 | A tenant erases its web data and verification shows it gone | High |
| W13 | Document the full privacy and compliance strategy | `SECURITY.md`, this package | PARTIAL | `SECURITY.md`; [privacy-and-data-protection.md](security/privacy-and-data-protection.md) | No legal review | T2-3 | Counsel-reviewed document | Medium |
| W14 | Tenant dashboard: private web metrics for selectable ranges | UI and API exist; range limit 90 days | IMPLEMENTED, NIV | `sites/[siteId]/web/route.ts`; `src/app/projects/[id]/sites` | Depends on W6 verification | T1-1 | As W6 | Medium |
| W15 | Global operator dashboard for web metrics with filter, sort and comparison | None; operator view is API metrics only | MISSING | `operator/overview/route.ts` | Build | T2-5 | Operator compares web metrics across projects, audited | Medium |

## 3. API analytics (RFP section 3.3)

| ID | RFP requirement | Pyxis implementation | Status | Evidence | Gap | Proposed deliverable | Acceptance test | Risk |
|---|---|---|---|---|---|---|---|---|
| A1 | Tenants dual-export standard OpenTelemetry to their APM and the collector | OTLP/HTTP **JSON**, delta histograms only | PARTIAL | `v1/metrics/route.ts:12-14` | OTLP protobuf and gRPC unsupported; many SDKs default to protobuf; gzip bodies probably unsupported | T1-2 | Stock OTel SDKs and Collector export with default settings and are accepted | High |
| A2 | Collector discards traces, spans and deep logs; stores only metrics (counters, histograms) in PostgreSQL | `/v1/traces`, `/v1/logs` return 404; only histogram aggregates stored | IMPLEMENTED | `v1/traces`, `v1/logs`; `otlp.ts`; `tests/unit.test.ts` (OTLP parsing); `scripts/e2e-smoke.mts` (manual) | None | none | Existing unit and e2e checks | Low |
| A3 | Required attributes: tenant and service identity, normalized route, status, latency | Tenant from key; service, environment, method, route, status, histogram | IMPLEMENTED | `otlp.ts:52-113`; `tests/unit.test.ts` | Empty unit treated as ms (AN-03) | T1-2 | Unit handling test | Medium |
| A4 | Default hard-coded path normalization | UUID, `G`/`C`/`M` accounts, integers, hex hashes | IMPLEMENTED | `normalize.ts`; `tests/unit.test.ts:10-27` | `M` addresses, `0x` prefix and short hashes untested or untemplated | T1-2 | Extended fixture set | Low |
| A5 | Design target about 1,000,000 requests per day across all tenants | Pre-aggregation to 60-second buckets; cardinality caps | PARTIAL | `otlp.ts:8-16` | **No load test or benchmark**; dashboard queries read raw rows into Node | T1-3, T2-6 | Published load test at or above the target with method, hardware and results | High |
| A6 | Aggregated views retained at least 24 months | Nothing deletes data | PARTIAL | no retention job exists (search) | No policy, rollup or storage forecast | T1-3 | Rollup and retention job tested; 24-month policy documented | High |
| A7 | Same isolation rules as the web path | API path isolated by RLS; web path isolated by an application lookup under one shared Umami login | PARTIAL | `001_init.sql`; `sites/[siteId]/web/route.ts` | Web path unverified | T2-1 | Test that one tenant cannot read another tenant's Umami site | High |
| A8 | Tenant dashboard: volume, status distribution, latency percentiles (p50, p95, p99), time ranges | Implemented | IMPLEMENTED | `queries.ts:16-77`; `tests/unit.test.ts:31-38` | Percentile test uses loose bounds | T1-4 | Percentile accuracy test against a known distribution | Medium |
| A9 | Global dashboard: cross-project API comparison | Implemented | IMPLEMENTED | `operator/overview/route.ts` | Sequential per-project queries | T2-5 | Comparison within a latency budget at N projects | Low |

## 4. Hosting, support and handover (RFP section 3.4)

| ID | RFP requirement | Pyxis implementation | Status | Evidence | Gap | Proposed deliverable | Acceptance test | Risk |
|---|---|---|---|---|---|---|---|---|
| H1 | Ingestion availability 99.99% | One replica per service, no standby, no monitoring | MISSING | deployment manifest: 1 replica | Architecture and measurement; **99.99% is about 52 minutes of downtime a year** | T2-2, T3-1 | Measured availability over a stated window; an honest SLO is proposed | **Critical** |
| H2 | Dashboard availability 99.90% | As H1 | MISSING | as H1 | As H1 | T2-2, T3-1 | As H1 | High |
| H3 | Critical and high vulnerabilities patched within 24 hours | No process; 10 high findings remain in the wallet-kit tree with no upstream fix | MISSING | `SECURITY.md` known-weakness rows | Triage and patch process, scanning in CI | T1-4, T3-1 | Documented process and a drill | High |
| H4 | Tickets answered within 5 business days, resolved within 10 | Issue forms exist; no support policy | MISSING | `.github/ISSUE_TEMPLATE` | Policy and tracking | T3-1 | Published policy and a response log | Medium |
| H5 | No mandatory on-call; public issue tracker is enough | Public repository with issues | IMPLEMENTED | GitHub repository | None | none | n/a | Low |
| H6 | Host and support for 12 months after the final tranche is approved | No commitment, no cost model | BLOCKED | none | Team commitment and funding | none | Written commitment | High |
| H7 | Handover between months 6 and 12: repository ownership, data migration, domain transfer or redirect | A handover plan exists; nothing is built | PLANNED | `docs/handover-build-plan.md` | Migration tooling, transfer steps, dry run | T3-3 | A community operator runs the system from the monorepo | High |

## 5. Expected deliverables (RFP section 5)

| ID | RFP requirement | Pyxis implementation | Status | Evidence | Gap | Proposed deliverable | Acceptance test | Risk |
|---|---|---|---|---|---|---|---|---|
| D1 | Fully functional multi-tenant web and API analytics platform | Core works; web path unverified | PARTIAL | this matrix | See W and A rows | T1-x, T2-x | All W and A rows pass | High |
| D2 | Monorepo: all application code | On `main`, public | IMPLEMENTED | <https://github.com/Pyxis-Hq/pyxis> | none | none | n/a | Low |
| D3 | Monorepo: full infrastructure-as-code | `railway.json`; unverified compose; no Dockerfile | MISSING | repository | Build | T1-6 | Clean-checkout rebuild | High |
| D4 | Monorepo: deployment documentation | "Run Pyxis in production" guide; Railway steps run | IMPLEMENTED, NIV | `apps/docs/content/docs/guides/run-in-production.mdx` | Nobody outside the team has followed it; no Docker path | T1-6, T3-3 | An outside operator deploys from the guide | Medium |
| D5 | Monorepo: operator runbooks | Fragments only | MISSING | `SECURITY.md`, handover plan | Backup/restore, rotation, upgrade, incident | T2-2, T3-3 | Each runbook exercised once | High |
| D6 | Monorepo: tenant onboarding guide | Quickstart and three guides published | IMPLEMENTED, NIV | docs site | No outside validation | T3-2 | A pilot team onboards unaided | Medium |
| D7 | Monorepo: automated test suite | 80 tests in 5 files; CI runs typecheck, tests, builds | IMPLEMENTED | [02-test-and-verification-report.md](02-test-and-verification-report.md) | **No sign-in test in CI, no route tests, no UI tests, no lint, no coverage report** | T1-4 | CI includes auth, route and cross-tenant tests, lint and coverage | Medium |
| D8 | Monorepo: security and privacy/compliance documentation | `SECURITY.md`, this package | PARTIAL | [security/](security/) | No legal review; no independent audit | T2-1, T2-3 | Reviewed documents | Medium |
| D9 | Monorepo: monitoring and alerting baseline | None; console logs only | MISSING | repository | Build | T2-2 | An induced failure raises an alert | High |
| D10 | Live proof of adoption: 3 SCF-awarded projects on web analytics, 1 on API traffic, a live global view, a tenant video | None | BLOCKED | none | Pilots, consent, instrumentation | T3-2 | Four named projects with live data | **Critical** |
| D11 | Statements on data residency, GDPR without opt-in, and erasure | None | MISSING | none | Write and review | T2-3 | Published statements | High |

## 6. Evaluation criteria (RFP section 6)

| ID | Criterion | Pyxis position | Status | Evidence | Gap | Risk |
|---|---|---|---|---|---|---|
| E1 | Technical soundness | Sound core, honest gaps | PARTIAL | this package | Gaps above | Medium |
| E2 | Umami vs GoatCounter rationale | Umami chosen; draft rationale | PARTIAL | [competitive-analysis.md](planning/competitive-analysis.md) section 7 | Team confirmation; real-Umami verification | Medium |
| E3 | Prior experience, open-source maintainer history, SCF and SDF history | Not shown by the repository | BLOCKED | none | Human evidence | **Critical** |
| E4 | Privacy and security posture | Strong design, no rate limiting, no scanning | PARTIAL | [security/threat-model.md](security/threat-model.md) | Findings SEC-01 to SEC-19 | High |
| E5 | SLA realism | None proposed | MISSING | none | Propose SLOs the architecture can meet | High |
| E6 | Handover plan | Plan exists | PARTIAL | `docs/handover-build-plan.md` | Mechanics | Medium |
| E7 | Onboarding plan | Guides exist | PARTIAL | docs site | Pilot plan | Medium |
| E8 | Repository quality | Clean history, Apache-2.0, CI | PARTIAL | repository | Lint, coverage, release process | Low |

## 7. Counts (this audit)

IMPLEMENTED: G1, G2, G3, G7, A2, A3, A4, A8, A9, D2, D7, H5 (12). IMPLEMENTED, NIV: W1, W6, W14, D4, D6 (5). PARTIAL: G4, G5, G6, W3, W5, W8, W13, A1, A5, A6, A7, D1, D8, E1, E2, E4, E6, E7, E8 (19). PLANNED: H7 (1). MISSING: G8, W2, W4, W7, W9, W10, W11, W12, W15, H1, H2, H3, H4, D3, D5, D9, D11, E5 (18). BLOCKED: G9, H6, D10, E3 (4). **Total 59 rows.**
