# Final audit report

**Subject:** Pyxis, <https://github.com/Pyxis-Hq/pyxis>, commit `a7df1dad66b6803ff26150a0c40569ceeb174de8`, audited 2026-11-20.
**Purpose:** a defensible technical position for the SCF Build submission against the RFP "Web and API Analytics for Stellar Ecosystem Projects".
**Method:** three read-only source audits (security and tenancy; analytics and Umami; SDK, Stellar and infrastructure), direct reading of the core code, execution of the typecheck, 80 tests, three builds and `npm audit` in a clean clone, live HTTP checks, GitHub and npm API checks, and a cross-check of the project's own documents against the code. **No application source file was changed. Nothing was committed, pushed, published or submitted.**
**Governing principle:** document what exists, prove what works, disclose what does not, propose a realistic path to the rest.

## 1. Overall implementation maturity

**A solid MVP core with an unproven web path and no operational layer: pre-production.**

| Area | Maturity | One-line reading |
|---|---|---|
| Multi-tenant isolation | Good | Forced RLS, non-owner role, 9 tests on a real PostgreSQL, no cross-tenant path found |
| API analytics ingestion and dashboards | Good core, not hardened | Correct aggregation and percentiles; JSON only, no rate limit, no retention, no load evidence |
| Web analytics | Early | Client and UI exist; **never run against a real Umami**; tracker not pinned |
| Wallet SDK | Good for its scope | Published, tested, privacy-preserving; frontend-reported; no adapter |
| Stellar integration | Minimal | Wallet-signature sign-in and a demo; no on-chain component |
| Security posture | Good design, missing controls | No Critical or High app finding; no rate limiting; 22 dependency advisories |
| Operations | Missing | One replica, no monitoring, alerting or backups, no IaC or container |
| Documentation | Ahead of the code | Strong guides; some statements contradict the code (section 7) |
| Adoption, team record | Absent | No users, pilots or SCF history in evidence |

## 2. What is genuinely working

- Tenant isolation at the database (tests: `tests/db.test.ts`, 9 pass).
- OTLP/HTTP JSON metrics ingestion with delta histograms, route templating (including Stellar accounts), merged-histogram p50, p95 and p99, and drop reasons (`tests/unit.test.ts`, 17 pass).
- Wallet sign-in server side; session and key handling (hashed secrets, constant-time compare, immediate revocation).
- The wallet-event allowlist and the published SDK `@pyxis-hq/wallets-kit@0.1.0-beta.1` (`tests/wallet.test.ts`, `tests/sdk.test.ts`).
- Live deployment at <https://usepyxis.xyz> and <https://docs.usepyxis.xyz>; green CI; typecheck and three builds.

## 3. What is partially implemented

OTLP (JSON only, delta only); retention (kept forever by absence); operator view (API only, wallet read unaudited); self-service enrollment (no quotas); operator removal (no deletion); the production guide (run locally and on Railway, not by an outsider, no Docker path); the privacy documents (no legal review); the Umami integration (code and UI, fake-tested only); the monorepo (workspaces yes, IaC no).

## 4. What is unimplemented

OTLP protobuf and gRPC; rate limiting; idempotency; retention and rollup jobs; erasure workflow; bot mitigation; tracker pinning; read API and operator-issued keys; service and environment filters; global web dashboard; monitoring, alerting, backups, restore; Dockerfile and IaC; runbooks; SLOs; support process; adoption; every Soroban or ledger feature; a Wallets Kit adapter; package provenance.

## 5. Most important technical risks

1. Eligibility and track record cannot be shown from the repository (G9, E3).
2. The web analytics half of the RFP has never run end to end.
3. The availability commitments (99.99%, 99.90%) cannot be supported by one replica and one database.
4. Ingestion is unproven at the one-million-requests-per-day target and unprotected against abuse.
5. Privacy obligations (GDPR without opt-in, residency, erasure) have no implementation or legal review.
6. Adoption proof depends on third parties.
7. Dependency advisories (10 high) sit uneasily with a 24-hour patch commitment.

## 6. Findings register

Severity: Critical, High, Medium, Low, Info. "RFP" marks findings that block an RFP requirement even when the engineering severity is lower.

### 6.1 Security (SEC) — details in [security/threat-model.md](security/threat-model.md)

| ID | Sev | Finding |
|---|---|---|
| SEC-01 | Medium | No rate limiting; DB query per unauthenticated key attempt; unbounded challenge inserts |
| SEC-02 | Medium | CSRF relies on SameSite=Lax; no Origin check; docs subdomain is same-site |
| SEC-03 | Medium | Operator read of wallet funnel not audited |
| SEC-04 | Medium | Browser and server exporters share one `ingest` scope |
| SEC-05 | Medium/Low | SSRF guard: lookup and fetch resolve separately; IPv6 and special ranges incomplete |
| SEC-06 | Low | Sign-in message has no origin binding |
| SEC-07 | Low | Operator flag stale up to 7 days |
| SEC-08 | Low | Ingest error codes reveal key state |
| SEC-09 | Low | Body buffered before size check; gzip unsupported |
| SEC-10 | Low | Challenges and expired sessions never purged |
| SEC-11 | Low | `/v1/wallet-events` writes no audit row and no `last_used_at` |
| SEC-12 | Low | Loose UUID check can cause 500s |
| SEC-13 | Low | No quotas on projects, sites, members, keys |
| SEC-14 | Low | Operator RLS broader than needed |
| SEC-15 | Low | Default DB credentials fallback; default role password until `db:role` |
| SEC-16 | Info | No security headers or CSP |
| SEC-17 | Info | Definer functions use `search_path = public` |
| SEC-18 | Medium | 22 production advisories (10 high) in wallet-kit and `shadcn` trees |
| SEC-19 | Info | `analyst` role has no distinct permissions; no owner transfer |

### 6.2 Analytics (AN)

| ID | Sev | Finding |
|---|---|---|
| AN-01 | High (RFP) | No retention, rollup or purge |
| AN-02 | Medium | No idempotency: a retried batch is counted twice |
| AN-03 | Medium | An empty unit is treated as milliseconds; the stable metric is in seconds |
| AN-04 | Low | `partialSuccess` mixes requests and data points and reports capped routes as rejected although kept |
| AN-05 | Medium | Dashboards read raw rows into Node (up to 90 days); sequential per-project and per-row queries |
| AN-06 | Medium | No service or environment filter; staging and production summed |
| AN-07 | Medium | gzip request bodies probably unsupported (not verified at runtime) |
| AN-08 | Low | Concurrent batches can exceed service and route caps |
| AN-09 | High (RFP) | Umami never run against the code; tracker and image not pinned; one shared admin credential; re-login per request |
| AN-10 | Low | Incident windows computed client side and depend on the series step |
| AN-11 | High (RFP) | OTLP protobuf and gRPC unsupported; protobuf dependencies declared but unused |
| AN-12 | Low | Upper-bound re-bucketing biases latency up; percentiles above 10 s read 10,000 ms |
| AN-13 | Low | Percentile unit test uses loose bounds |

### 6.3 SDK (SDK)

| ID | Sev | Finding |
|---|---|---|
| SDK-01 | Medium | `failure_category` is a pattern, not an enum; lowercase text can pass |
| SDK-02 | Medium | SDK tests run against source through an alias, not the published bundle |
| SDK-03 | Medium | No release automation, tags or provenance; manual publish |
| SDK-04 | Low | npm keywords (`freighter`, `xbull`, `stellar-wallets-kit`) imply integrations that do not exist |
| SDK-05 | Low | Demo hard-codes provider `other` and error categories |
| SDK-06 | Low | The React entry bundles its own copy of the core |

### 6.4 Operations (OPS)

| ID | Sev | Finding |
|---|---|---|
| OPS-01 | High (RFP) | One replica per service; no standby, monitoring, alerting or backups evidenced |
| OPS-02 | Medium | Health check does not touch the database |
| OPS-03 | High (RFP) | No Dockerfile, IaC or `.env.example`; compose unverified |
| OPS-04 | Medium | CI has no lint, coverage, audit or SAST; no lint script exists |
| OPS-05 | Medium | Pre-deploy migration does not run on CLI deploys |
| OPS-06 | Low | Manual deployment; no tags or releases |
| OPS-07 | Low | Vitest configuration error in the author's folder; cause not identified |

### 6.5 Documentation consistency (DOC)

| ID | Sev | Finding |
|---|---|---|
| DOC-01 | Medium | `TECHNICAL.md:622`, `SECURITY.md:238,295` say "generic errors"; ingest `code` differs by key state |
| DOC-02 | Medium | `README.md:179`, `TECHNICAL.md:627` say every operator access is audited; the wallet read is not |
| DOC-03 | Low | `src/server/umami.ts:48` says "version-pinned"; it is not |
| DOC-04 | Low | `SECURITY.md:265` and the docs security page say "about 20" advisories; measured 22 |
| DOC-05 | Low | "SEP-43 style" (`README.md:31`, `TECHNICAL.md:123`, `session.ts:13`); the hashing prefix is the SEP-53 rule **(verify)** |
| DOC-06 | Medium | The older RFP matrix marks G6, A1, A7, D4 and D6 Done; this audit's evidence supports Partial or not independently verified |
| DOC-07 | Low | `TECHNICAL.md:109` says "alpha SDK"; `docs/sdk-build-spec.md` still describes the alpha |
| DOC-08 | Low | The audit brief says the docs site is not live and gives the Railway URL; the docs site is live and the custom domain is the published address |
| DOC-09 | Low | Unused `@opentelemetry/otlp-transformer` and `protobufjs` suggest protobuf support |
| DOC-10 | Info | "Stellar Pulse" remains only where explained: frozen migrations, rename notes, the Railway project name, and the external documentation pack name |
| DOC-11 | Low | `ROADMAP.md` and `docs/sdk-build-spec.md` cite a documentation pack `stellar-pulse-documentation/` that is not in the repository, so reviewers cannot read it |

## 7. Consistency review

### 7.1 What was checked and how it came out

| Check | Result |
|---|---|
| README claims match implementation | **Not fully**: DOC-02, DOC-05, DOC-07 |
| Technical documents match the code | **Not fully**: DOC-01, DOC-02, DOC-03 |
| API documentation matches routes | Matches; one route-level detail (wallet audit) corrected in [technical/api-reference.md](technical/api-reference.md) |
| Database documentation matches migrations | Matches; `001_init.sql` header still says "Stellar Pulse" (frozen, explained) |
| Security claims match enforcement | **Not fully**: DOC-01, DOC-02; gaps listed in the threat model |
| Test results match recorded execution | Yes: 80 pass, in [02-test-and-verification-report.md](02-test-and-verification-report.md) |
| Roadmap addresses the real gaps | Yes: every blocker maps to a deliverable |
| Budget maps to deliverables | Yes by method; **no dollar amount is proposed** |
| Products and Services match funded scope | Yes |
| Traction claims have evidence | Yes; absent evidence is marked **MISSING** |
| Stellar and Soroban claims are not overstated | Yes: no Soroban component is claimed |
| Public URLs are correct | Verified: app, docs, repository, npm, CI run |
| Contradictions between package documents | None found; IDs and counts were cross-checked |
| Invented metrics, partnerships or results | None |

### 7.2 Status differences from the older matrix

The older [docs/rfp-acceptance-matrix.md](../../rfp-acceptance-matrix.md) shows 17 Done. This audit applies the rule "implemented only if a test or observation backs it": 12 IMPLEMENTED and 5 IMPLEMENTED, NOT INDEPENDENTLY VERIFIED. Moved down: G6 (IaC missing), A1 (JSON only), A7 (web path unverified), D4 and D6 (no outside validation). The new matrix has 59 rows because it adds the eight evaluation-criteria rows.

## 8. RFP requirements

**Satisfied (12):** G1, G2, G3, G7, A2, A3, A4, A8, A9, D2, D7, H5. **Implemented but not independently verified (5):** W1, W6, W14, D4, D6.
**Not satisfied:** every MISSING or BLOCKED row in [03-rfp-requirements-matrix.md](03-rfp-requirements-matrix.md): notably G8, W2, W4, W10-W12, W15, H1-H4, H6, D3, D5, D9, D10, D11, E3, E5, plus the PARTIAL rows A1, A5, A6, A7, G6.

## 9. Critical blockers

1. **Eligibility and track record (G9, E3)** cannot be fixed by engineering.
2. **Adoption proof (D10)** needs three web projects and one API project.
3. **Web analytics never run for real (AN-09)** and not pinned (W4).
4. **Availability commitments (H1, H2)** unsupported by the architecture.
5. **Ingestion unproven and unprotected (A1, A5, A6; SEC-01)**.
6. **Privacy obligations unimplemented (W2, W10-W12, D11)**.
7. **Infrastructure not reproducible (D3, D5, D9, H7)**.

## 10. Recommended delivery priorities

In this order: run Umami for real and pin it (T1-1); harden and standardise ingestion (T1-2); retention and rollups (T1-3); tests and CI (T1-4); containers and IaC (T1-6); read API (T1-5); privacy and erasure (T2-3); monitoring, backups and runbooks (T2-2); load evidence (T2-6); launch, adoption and handover (T3-1 to T3-3). The cut line and effort are in [planning/roadmap-and-milestones.md](planning/roadmap-and-milestones.md). Soroban work is optional and must not displace any of the above.

## 11. Submission readiness assessment

**Not ready.** See [SUBMISSION-READINESS.md](SUBMISSION-READINESS.md). The technical package is complete and honest; eligibility, team, media fields, pilots and two cheap pieces of evidence (a real-wallet run and a real Umami run) are not.

## 12. Information the team must still provide

Round; team members, roles and SCF and SDF history; submitter type, representative, KYC or KYB readiness; ambassador affiliation; video; thumbnail; budget inputs (weekly rate, hosting quotes, the availability decision); answers from SCF to the five questions in [form-answers.md](form-answers.md); consent letters from pilot projects; a recorded real-wallet sign-in and Testnet demo run; a real Umami run; legal counsel for the privacy statements; maintainers and security-response roles; confirmation of the AI-use statement.

## 13. Recommended final Build submission strategy

1. **Resolve eligibility first.** If the team's SCF and SDF record is thin, strengthen it before applying.
2. **Convert unverified claims into evidence** while you wait: record a real-wallet run, run Umami for real, and write the availability position.
3. **Fix the small documentation contradictions** (DOC-01 to DOC-07) and the one-line audit gap (SEC-03) so a reviewer who reads the code does not find a claim the code contradicts.
4. **Apply with a modest, effort-based budget** and the stated cut line; do not default to the maximum.
5. **Lead with honesty:** a working multi-tenant core, a published SDK, a live deployment, and a plan whose gaps are named. Panel reviewers are told to assume any problem you omit is one you missed.
6. **Ask SCF the five questions** before submitting.

## 14. Package inventory

| Document | Path |
|---|---|
| Repository inventory | [01-repository-inventory.md](01-repository-inventory.md) |
| Test and verification report | [02-test-and-verification-report.md](02-test-and-verification-report.md) |
| RFP requirements matrix | [03-rfp-requirements-matrix.md](03-rfp-requirements-matrix.md) |
| RFP gap analysis | [04-rfp-gap-analysis.md](04-rfp-gap-analysis.md) |
| Technical specification | [technical/technical-specification.md](technical/technical-specification.md) |
| System architecture | [technical/architecture.md](technical/architecture.md) |
| Stellar integration | [technical/stellar-integration.md](technical/stellar-integration.md) |
| API reference | [technical/api-reference.md](technical/api-reference.md) |
| Data and telemetry specification | [technical/telemetry-specification.md](technical/telemetry-specification.md) |
| Threat model | [security/threat-model.md](security/threat-model.md) |
| Privacy and data protection | [security/privacy-and-data-protection.md](security/privacy-and-data-protection.md) |
| Infrastructure and operations | [operations/infrastructure-and-operations.md](operations/infrastructure-and-operations.md) |
| Deployment and handover | [operations/deployment-and-handover.md](operations/deployment-and-handover.md) |
| Roadmap and milestones | [planning/roadmap-and-milestones.md](planning/roadmap-and-milestones.md) |
| Acceptance test plan | [planning/acceptance-test-plan.md](planning/acceptance-test-plan.md) |
| Budget assumptions | [planning/budget-assumptions.md](planning/budget-assumptions.md) |
| Maintenance and governance | [planning/maintenance-and-governance.md](planning/maintenance-and-governance.md) |
| Competitive analysis | [planning/competitive-analysis.md](planning/competitive-analysis.md) |
| AI usage disclosure | [AI-DISCLOSURE.md](AI-DISCLOSURE.md) |
| Evidence register | [EVIDENCE-REGISTER.md](EVIDENCE-REGISTER.md) |
| Submission readiness | [SUBMISSION-READINESS.md](SUBMISSION-READINESS.md) |
| **Form answers** | [form-answers.md](form-answers.md) |
