# Roadmap and milestones

**Status:** proposed three-tranche delivery plan derived from the gaps in [../04-rfp-gap-analysis.md](../04-rfp-gap-analysis.md). Nothing here is built unless the matrix says so. **Dates are not invented:** milestones use relative weeks from award acceptance, with placeholders for the team.
**Effort figures** are the auditor's engineering estimates (person-weeks, "pw") from the size of the existing code and the work required. They are **estimates for the team to confirm**, not quotes.
**Evidence basis:** [03-rfp-requirements-matrix.md](../03-rfp-requirements-matrix.md), [FINAL-AUDIT-REPORT.md](../FINAL-AUDIT-REPORT.md) findings register.
**Related:** [acceptance-test-plan.md](acceptance-test-plan.md), [budget-assumptions.md](budget-assumptions.md), [../form-answers.md](../form-answers.md).

## 1. Principles

1. **RFP first.** Web analytics, API analytics, multi-tenancy, privacy, operations and handover come before any Stellar-specific extension.
2. **Outcomes, not activities.** Every deliverable ends in something a reviewer can run, read or measure. No tranche is "planning" or "research": the architecture already exists and is documented.
3. **Tranche 1 is development.** The architecture is complete (see [../technical/technical-specification.md](../technical/technical-specification.md)); Tranche 1 changes code.
4. **Tranche 2 carries the threat model and monitoring plan** the SCF form requires.
5. **Tranche 3 is production launch** of the hosted service with measured service levels and the adoption proof.
6. **Soroban is an optional extension, not a deliverable.** The RFP does not require it.

## 2. Timeline (relative weeks; project must stay within 6 months, award covers about 4)

| Tranche | Weeks from acceptance | Placeholder date | Focus |
|---|---|---|---|
| Tranche 0 | 0 | `[TEAM: date]` | Paid on award acceptance; no deliverable |
| Tranche 1 | 1 to 7 | `[TEAM: date]` | A verified, hardened core: real Umami, protocol support, retention, tests, containers |
| Tranche 2 | 8 to 15 | `[TEAM: date]` | Privacy, operability, enrollment controls, operator dashboards, load evidence, threat model and monitoring plan |
| Tranche 3 | 16 to 22 | `[TEAM: date]` | Production launch, service levels, adoption, handover |

Each tranche must be submitted within 90 days of the previous payment. **Capacity is a team input:** the effort below totals about 50 pw of core work, which needs roughly 2.5 full-time engineers over 20 weeks. If the team is smaller, the scope must be cut at the line marked "cut line" in section 6.

## 3. Tranche 1 · Verified and hardened core (about 20 pw)

**Objective:** make the web path real, make ingestion safe and standard, and make the system reproducible.

| ID | Deliverable (outcome) | RFP rows | Findings closed | Effort |
|---|---|---|---|---|
| T1-1 | **Real, pinned Umami integration.** Umami deployed from an image digest; the client and the tracker pinned and integrity-checked; integration tests against the real Umami run in CI; synthetic traffic proves every required web metric | W1, W3, W4, W6, W14, A7, E2 | AN-09 | 3 pw |
| T1-2 | **Ingestion hardening and protocol support.** OTLP/HTTP protobuf and gzip accepted; rate limiting per IP and per key; a browser-only key scope; streaming body cap; unit handling fixed; strict UUID checks; `wallet-events` audit parity; idempotency option | A1, A3, G3 | SEC-01, 04, 08, 09, 11, 12; AN-02, 03, 07, 11 | 5 pw |
| T1-3 | **Rollups and retention.** SQL-side aggregation for dashboards; hourly and daily rollups; a scheduled retention job honouring a published 24-month policy; purge of expired sessions and challenges | A5, A6 | AN-01, 05, 06; SEC-10 | 3 pw |
| T1-4 | **Test and CI hardening.** Sign-in, session, authorization and every route covered by tests; cross-tenant negative tests at HTTP level in CI; the smoke script run in CI; lint, coverage and dependency and secret scanning in CI | D7, W5, H3 | SEC-18 (triage); OPS-04 | 3 pw |
| T1-5 | **Read API and operator-issued keys.** The `query` scope consumed by a documented read API; operators issue and revoke read keys | G8 | none | 2.5 pw |
| T1-6 | **Containers and infrastructure-as-code baseline.** Pinned Dockerfile; compose file that runs the whole stack from a clean clone; `.env.example`; automatic migration on deploy; IaC for one target environment | G6, D3, D4 | OPS-03, 05 | 3.5 pw |

**Completion criteria and verification (Tranche 1).**
- A pinned Umami runs, the integration suite passes against it in CI, and synthetic page views appear in the dashboard within a stated tolerance.
- A stock OpenTelemetry SDK and Collector with default settings export successfully; limits and rate limits are enforced by tests.
- The retention job removes aged rows in a test database; dashboard queries no longer read raw rows into the application.
- CI runs the new tests, lint, coverage and scans; a clean clone brings up the full stack with one command.
- **Evidence:** merged pull requests, CI run links, test reports, the pinned image digest, the integration test log, a recorded walkthrough.
- **Dependencies:** none external. **Risks:** Umami API differences (mitigation: the test suite against a real instance is the first task); protobuf support increases the dependency surface (mitigation: use the already-declared `@opentelemetry/otlp-transformer` and review it).
- **Definition of done:** every T1 row above has its acceptance test green in CI on the tagged release.

## 4. Tranche 2 · Privacy, operability and evidence at scale (about 19 pw)

**Objective:** satisfy the privacy and operational requirements and prove ingestion at the target volume. **This tranche includes the threat model and monitoring plan required by the form.**

| ID | Deliverable (outcome) | RFP rows | Findings closed | Effort |
|---|---|---|---|---|
| T2-1 | **Threat model and launch-gate security fixes.** The STRIDE threat model finalised and reviewed; origin checks for mutating routes; SSRF guard pinned to the validated address with a range library; operator audit completeness; fail-fast configuration; security headers | D8, E4, G1, A7 | SEC-02, 03, 05, 06, 07, 13, 14, 15, 16, 17 | 2.5 pw |
| T2-2 | **Monitoring plan, monitoring and operations baseline.** The monitoring plan published; probes, metrics, alerts and structured logs live; a database-aware health endpoint; scheduled backups and a **demonstrated restore**; incident-response and rotation runbooks, each exercised once | D5, D9, H1, H2 | OPS-01, 02 | 4 pw |
| T2-3 | **Privacy and compliance.** Bot mitigation configured and tested; tenant-triggered erasure that reaches Umami; retention statement; counsel-reviewed GDPR, residency and erasure statements; ad-blocker-neutral script and endpoint names | W2, W9-W13, D11 | none | 4 pw plus external legal cost |
| T2-4 | **Enrollment and removal controls.** Project and wallet quotas; an approval-required mode; operator removal that deletes tenant data; audit for project-level admin actions | G3-G5 | SEC-13, 19 | 2.5 pw |
| T2-5 | **Operator dashboards.** Cross-project web metrics with filters and comparison; service and environment filters in tenant queries | W15, A9 | AN-06, 10 | 3 pw |
| T2-6 | **Published load test.** A synthetic OTLP generator and a method to sustain the design target of about 1,000,000 requests per day; results with hardware, latency, error rate and database growth; tuning that follows | A5 | AN-05, 08 | 3 pw |

**Completion criteria and verification (Tranche 2).**
- The threat model and monitoring plan are published and reviewed; an induced fault raises an alert that reaches a human.
- A backup is restored into a second instance and the test suite and smoke script pass against it.
- A tenant's erasure request removes its data in Pyxis and Umami, proven by a test; counsel-reviewed statements are published.
- The load test report states method, environment, volume and results; if the target is not met the report says so.
- **Evidence:** the documents, alert screenshots with timestamps, restore log, erasure test log, the load report with raw data, CI runs.
- **Dependencies:** T1 complete; legal counsel engaged; a monitoring service chosen. **Risks:** legal review lead time (start early); load results below target (mitigation: the report is the deliverable, tuning is bounded).
- **Definition of done:** each T2 acceptance test passes in a staging environment built from the monorepo.

## 5. Tranche 3 · Production launch and handover (about 11 pw, plus 3 pw stretch)

**Objective:** run the hosted service with measured service levels, show real adoption, and prove handover.

| ID | Deliverable (outcome) | RFP rows | Effort |
|---|---|---|---|
| T3-1 | **Production launch with measured service levels.** Production deployment from the monorepo; availability measured and published against a stated SLO; public status page; a documented vulnerability patch process with a drill; a published support policy with a response log | H1-H4, E5 | 3 pw |
| T3-2 | **Adoption proof.** At least three SCF-awarded projects instrumented for web analytics and one for API traffic, with their consent; the global operator view live; a recorded tenant-perspective walkthrough | D10, D6 | 3 pw |
| T3-3 | **Handover package and dry run.** Runbooks complete; infrastructure rebuilt from a clean checkout by someone outside the team; a data migration rehearsal; ownership-transfer checklist | H7, D4, D5, G6 | 3 pw |
| T3-4 | **SDK and release engineering (stretch).** Stellar Wallets Kit adapter; npm publishing with provenance from CI; changelog and tags | W8 | 3 pw |
| T3-5 | **Final report and remediation.** Findings from reviews fixed or accepted with reasons; request for the Audit Bank review; reproducible-evidence report | E1, E8 | 2 pw |

**Cut line:** T3-4 is stretch. If capacity is short, also defer T2-5 (operator web filters) and the tenant-facing parts of T1-5, but **not** T1-1, T1-2, T1-3, T2-2, T2-3 or T3-2, which map to RFP requirements that decide evaluation.

**Completion criteria and verification (Tranche 3).**
- The service runs in production for a stated window with measured availability, published figures and a status page.
- Four named projects (three web, one API) show live data in the dashboards.
- An operator outside the team rebuilds and operates the system from the monorepo.
- **Evidence:** availability data and probe configuration, named-project dashboards with consent letters, the handover dry-run log, tagged release.
- **Dependencies:** pilots willing to participate; a community operator or reviewer for the dry run. **Risks:** **adoption depends on third parties** and cannot be guaranteed; the availability target may not be reachable on the chosen infrastructure (the SLO statement must be honest).
- **Definition of done:** every T3 row has its acceptance test recorded; the matrix shows no MISSING row except those explicitly deferred with reasons.

## 6. Optional extension (not funded unless the team and SCF agree)

| ID | Extension | Why it is separate |
|---|---|---|
| E-1 | Soroban RPC and Horizon read-back to label wallet-funnel counts as ledger-verified or not, without storing addresses | Not required by the RFP; needs a privacy design |
| E-2 | Public-network ecosystem observatory | Different data source and trust model |
| E-3 | Contract event indexing | As above |

These must **not** be presented as part of the funded scope or as existing.

## 7. Tranche summary

| Tranche | Core effort | Share of core effort |
|---|---|---|
| Tranche 1 | about 20 pw | about 40% |
| Tranche 2 | about 19 pw | about 38% |
| Tranche 3 | about 11 pw (plus 3 pw stretch) | about 22% |
| **Core total** | **about 50 pw** | 100% |

SCF pays 10, 20, 30 and 40 percent of the budget at Tranche 0, 1, 2 and 3 **(verify on the live form)**. This engineering split is **front-loaded** relative to that payment profile; the team must be able to fund Tranches 1 and 2 before the larger Tranche 3 payment arrives.
