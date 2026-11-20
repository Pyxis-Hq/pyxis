# 04 · RFP gap analysis

**Status:** ranks the gaps between Pyxis at commit `a7df1da` and the RFP "Web and API Analytics for Stellar Ecosystem Projects". Every statement is backed by a row in [03-rfp-requirements-matrix.md](03-rfp-requirements-matrix.md). Finding IDs (SEC, AN, SDK, OPS, DOC) are defined in [FINAL-AUDIT-REPORT.md](FINAL-AUDIT-REPORT.md) section 6.
**Related:** [planning/roadmap-and-milestones.md](planning/roadmap-and-milestones.md), [planning/acceptance-test-plan.md](planning/acceptance-test-plan.md).

## 1. Where Pyxis stands

Of 59 matrix rows: 12 IMPLEMENTED, 5 IMPLEMENTED but not independently verified, 19 PARTIAL, 1 PLANNED, 18 MISSING, 4 BLOCKED on a human decision or evidence. The **API analytics core and tenant isolation are real and tested**. The **web analytics path, the operational commitments and the adoption proof are not**.

| Area | Reading |
|---|---|
| API analytics (A1-A9) | Strongest area: 5 of 9 rows IMPLEMENTED; the rest need protobuf, retention and scale evidence |
| Multi-tenancy (G1-G3) | Real and tested on a real PostgreSQL; rate limiting and quotas absent |
| Web analytics (W1-W15) | Weakest technical area: **no Umami has ever been run against the code**, the tracker is not pinned, and bot, GDPR and erasure requirements have no implementation |
| Hosting and support (H1-H7) | **No commitment is supportable today**: one replica, no monitoring, no backups evidenced |
| Deliverables (D1-D11) | Documentation is ahead of infrastructure: no IaC, no runbooks, no monitoring baseline, no adoption |

## 2. Blockers, ranked

### B-1 · Eligibility and track record (G9, E3) — BLOCKED, **critical**
The RFP states that proposers unknown to SCF are not eligible and weighs open-source maintainer history and years of work with SCF or SDF. Nothing in the repository can show this: the git history has 26 commits by one author, all created in November 2026. **This cannot be fixed with code.** The team must supply verifiable SCF and SDF history, maintainer record and references. If it cannot, the submission is at risk of disqualification regardless of technical quality.

### B-2 · Adoption proof (D10) — BLOCKED, **critical**
Required: three SCF-awarded projects instrumented for web analytics and one for API traffic, a live global view and a tenant video. None exists. This needs named projects, their consent and instrumentation, and it depends on B-3 so the web path actually works.

### B-3 · Web analytics has never been run end to end (W1-W6, W14, A7; AN-09) — **high**
- The Umami client is "exercised in tests against a fake server only" (`src/server/umami.ts:2`).
- No Umami instance exists in the live or the test environment.
- The "version-pinned tracker" comment is wrong: the snippet loads `script.js` from whatever Umami runs, and `docker-compose.yml` uses the mutable tag `postgresql-latest`. The RFP requires a version-pinned script with no dynamic remote updates.
- Umami's API shape and metric names are assumed from documentation, unverified.
**Needed:** deploy a pinned Umami release, run the integration against it in CI, pin script and image by digest, and prove the required metrics against synthetic traffic (T1-1).

### B-4 · Availability commitments cannot be met by this architecture (H1, H2, E5; OPS-01) — **critical for the proposal**
99.99% ingestion availability allows about **52.6 minutes of downtime per year** (365 days × 24 h × 60 min × 0.0001); 99.90% for the dashboard allows about **8.8 hours**. Today there is one replica of the app, one PostgreSQL instance, no standby, no health check that touches the database, no monitoring and no alerting. A single Railway region and a single database cannot honestly promise 99.99%.
**Options the team must choose between:** (a) design for it: stateless replicas behind a load balancer, a managed PostgreSQL with failover, an ingest buffer so exporters retry through an outage; (b) propose a lower, measurable SLO for the first phase with a plan to reach the RFP figure, stated openly. The RFP evaluates "SLA realism", so an honest option (b) may score better than an unevidenced option (a).

### B-5 · Ingestion is not hardened or proven at scale (A1, A5, A6; SEC-01, SEC-09, AN-01, AN-02, AN-05, AN-07, AN-11) — **high**
- No rate limiting anywhere; each unauthenticated request with a well-formed key costs a database round trip.
- OTLP protobuf and gRPC are unsupported and gzip bodies are probably rejected, while many OpenTelemetry SDKs default to protobuf. A tenant following standard defaults would fail.
- No retention, rollup or purge job; dashboards read raw rows into Node for up to 90 days.
- No idempotency: a retried batch is counted twice.
- No load test. The one-million-requests-per-day figure is a design target and **must not** be presented as demonstrated.
**Needed:** T1-2 (hardening and protocol support), T1-3 (rollup and retention), T2-6 (load test with published method).

### B-6 · Privacy and compliance obligations have no implementation (W2, W9-W13, D11) — **high**
Bot mitigation, GDPR without opt-in, data residency, erasure workflow and the privacy statements are all missing. Pyxis itself stores no visitor data, but **Umami does**, so the erasure workflow must reach Umami. These need legal review; this audit makes **no compliance claim**.

### B-7 · Infrastructure and handover are not reproducible (G6, D3-D5, D9, H7; OPS-03, OPS-05) — **high**
No Dockerfile, no infrastructure-as-code, no `.env.example`, no runbooks, no monitoring baseline; the Docker compose file is unverified; migrations do not run automatically on CLI deploys. An outside operator cannot yet rebuild the system from the monorepo, which is the RFP's definition of handover.

### B-8 · Operator read API and keys (G8) — **high**
SCF must be able to generate and revoke API keys for machine access to metrics. The `query` scope exists but no route consumes it.

### B-9 · Security posture needs the launch-gate fixes (SEC-01 to SEC-05, SEC-18; H3) — **medium to high**
No Critical or High application vulnerability was found and no cross-tenant path was found. The launch-gate items are rate limiting (SEC-01), the unaudited operator wallet read (SEC-03, a small fix that contradicts a documented claim), a separate browser key scope (SEC-04), and the 22 dependency advisories (10 high) in the wallet-kit tree, which sit uneasily with a 24-hour patch commitment for critical and high issues.

### B-10 · Test coverage of the highest-risk code (D7; DOC-06) — **medium**
No automated test covers sign-in, session, authorization or any HTTP route; the only coverage is a manual script. No lint, no coverage report, no dependency or SAST scan in CI.

## 3. What is not a blocker

- **Soroban.** The RFP does not require any Soroban feature. The absence of contracts, RPC read-back and event indexing is a scope question, not a compliance gap. It must not distract from B-3 to B-8.
- **The wallet SDK.** It is a nice-to-have (W8). It works, is published, and has real but small gaps (SDK-01 to SDK-06).
- **Licence, repository, public issue tracker, zero fees.** Satisfied.

## 4. Most consequential single actions

1. Resolve B-1 and B-2 with the team: they decide whether the application is viable at all.
2. Run Umami for real (B-3) before writing any claim about web analytics.
3. Decide the availability position (B-4) before the budget is set, because it drives infrastructure cost.
4. Fix SEC-03 and add rate limiting (SEC-01): small, visible and expected by reviewers.

## 5. Risk of over-claiming

The following statements **must not** appear in the submission unless new evidence is produced: "supports OpenTelemetry" without "JSON only"; "version-pinned tracker"; "GDPR compliant"; "handles one million requests per day"; "99.99% availability"; "verified on-chain"; "tested with a real wallet"; "independently audited"; "live Umami web analytics".
