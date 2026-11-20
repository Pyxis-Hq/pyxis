# Acceptance test plan

**Status:** proposed. Every milestone deliverable in [roadmap-and-milestones.md](roadmap-and-milestones.md) has at least one test that an SCF reviewer can run or read independently. Numeric thresholds marked **[confirm]** are proposals for the team to set; none is presented as a measured result.
**Evidence basis:** the gaps in [../04-rfp-gap-analysis.md](../04-rfp-gap-analysis.md); the existing test suite ([../02-test-and-verification-report.md](../02-test-and-verification-report.md)).
**Related:** [../03-rfp-requirements-matrix.md](../03-rfp-requirements-matrix.md).

## 1. Rules for all acceptance tests

1. Runnable from a **clean clone** with documented prerequisites; no personal machine state.
2. Results are published as CI run links or recorded logs. Screenshots carry timestamps.
3. A test that needs a human, a real wallet or a third party is labelled and its steps are written down.
4. A failing or skipped test is reported, never removed.
5. Load and availability figures state method, environment, duration and raw data. A target missed is reported as missed.

## 2. Tranche 1

| ID | Deliverable | Test | Pass criteria | Evidence | Verified by |
|---|---|---|---|---|---|
| AT-1.1a | T1-1 | Start the stack with the pinned Umami image; run the integration suite against it | Suite passes in CI; image reference is a digest | CI run, `docker-compose.yml` / IaC diff | Reviewer reads CI |
| AT-1.1b | T1-1 | Generate synthetic traffic (known page views, visitors, referrers, countries, browsers, devices, bounces) and read the dashboard | Each metric within **[confirm] 2%** of the generated truth, or the difference is explained by a documented Umami rule | Traffic script, report | Reviewer reruns script |
| AT-1.1c | T1-1 | Load the tracker on a static page, an SPA and an SSR app | All three report page views | Three sample apps, logs | Reviewer |
| AT-1.1d | T1-1 | Inspect the served tracker | Version and integrity hash are pinned; an upgrade requires a reviewed change | Repository diff | Reviewer |
| AT-1.2a | T1-2 | Export with a stock OpenTelemetry SDK and a Collector using **default** protocol settings | Accepted; dashboard shows the traffic | Config files, logs | Reviewer reruns |
| AT-1.2b | T1-2 | Send gzip and protobuf bodies, oversize bodies, chunked bodies | Accepted or rejected as documented; memory stays bounded | Test log | CI |
| AT-1.2c | T1-2 | Exceed the rate limits on challenge, verify, ingest and project creation | `429` with a `Retry-After`; legitimate traffic unaffected | Test log | CI |
| AT-1.2d | T1-2 | Post metrics with a browser-scope key | Rejected; browser key accepted only by `/v1/wallet-events` | Test log | CI |
| AT-1.2e | T1-2 | Send an empty-unit duration metric | Handled per the documented rule | Unit test | CI |
| AT-1.3a | T1-3 | Insert 90 days of synthetic aggregates; run the retention job | Rows older than the policy are removed; newer rows and rollups remain | Job log, row counts | CI |
| AT-1.3b | T1-3 | Query a 90-day range on a large dataset | Latency below **[confirm] 2 s** at **[confirm]** rows; no raw-row load into the app | Query plan, timings | Reviewer |
| AT-1.3c | T1-3 | Expire sessions and challenges; run the purge | Expired rows removed | Test log | CI |
| AT-1.4a | T1-4 | Run the full suite including sign-in, session and every route | All pass; coverage report published | CI run | Reviewer reads CI |
| AT-1.4b | T1-4 | Cross-tenant negative tests at HTTP level for every project route | Tenant B always gets `404` | Test log | CI |
| AT-1.4c | T1-4 | CI includes lint, dependency audit and secret scan | Jobs present and passing | Workflow file, run | Reviewer |
| AT-1.5a | T1-5 | Create a `query` key; call the read API | Returns documented aggregates; denies other projects | Test log | CI |
| AT-1.5b | T1-5 | Operator issues then revokes a read key | Access ends at once | Test log | CI |
| AT-1.6a | T1-6 | Clean clone, one command | Whole stack starts; migrations run automatically; smoke script passes | Recorded run | Reviewer reruns |
| AT-1.6b | T1-6 | Deploy to the IaC target environment | Environment matches the repository | Apply log | Reviewer |

## 3. Tranche 2

| ID | Deliverable | Test | Pass criteria | Evidence | Verified by |
|---|---|---|---|---|---|
| AT-2.1a | T2-1 | Review the threat model against the code | Every STRIDE row has a control or an accepted risk with a reason | Document, reviewer notes | Independent reviewer **[confirm who]** |
| AT-2.1b | T2-1 | Send a mutating request with a foreign `Origin` | Rejected | Test log | CI |
| AT-2.1c | T2-1 | SSRF tests with a resolver that changes between calls, IPv4-mapped IPv6 in hex, NAT64 | All refused | Test log | CI |
| AT-2.1d | T2-1 | Operator reads every tenant view | An audit row exists for each | Test log | CI |
| AT-2.1e | T2-1 | Start the app in production mode with no `DATABASE_URL` | Refuses to start | Test log | CI |
| AT-2.2a | T2-2 | Stop the app and the database in turn | An alert reaches a human within **[confirm] 5 minutes** | Alert record | Reviewer witnesses or reads log |
| AT-2.2b | T2-2 | Restore the latest backup into a second instance | Test suite and smoke script pass; row counts match | Restore log | Reviewer |
| AT-2.2c | T2-2 | Run the incident and rotation runbooks once each | Steps complete as written; time recorded | Run log | Reviewer |
| AT-2.3a | T2-3 | Replay known bot traffic against a test site | Excluded from the metrics | Traffic script, report | Reviewer |
| AT-2.3b | T2-3 | Submit an erasure request for a test tenant | Its data is gone in Pyxis and Umami; the request is logged | Test log, queries | CI + reviewer |
| AT-2.3c | T2-3 | Read the published statements | Reviewed and signed by counsel **[confirm]** | Documents | Reviewer |
| AT-2.3d | T2-3 | Load the tracker with a standard ad-block list enabled | Script loads and records | Test log | Reviewer |
| AT-2.4a | T2-4 | Create projects past the quota; switch to approval mode | Quota enforced; new projects are `pending` until approved | Test log | CI |
| AT-2.4b | T2-4 | Operator removes a project | Data deleted and the action audited | Test log | CI |
| AT-2.5a | T2-5 | Compare web and API metrics across projects with filters | Correct against fixtures | Test log, screenshots | Reviewer |
| AT-2.6a | T2-6 | Sustain the design volume (about 1,000,000 requests per day equivalent) for **[confirm] 24 h** | Report states method, environment, p50/p95/p99 ingest latency, error rate, database growth; target met or the shortfall is stated | Raw data, report | Reviewer reads raw data |

## 4. Tranche 3

| ID | Deliverable | Test | Pass criteria | Evidence | Verified by |
|---|---|---|---|---|---|
| AT-3.1a | T3-1 | Read the published availability figures and probe configuration | Figures computed from raw probe data over the stated window; SLO stated honestly | Probe data, status page | Reviewer |
| AT-3.1b | T3-1 | Run the vulnerability patch drill | A published advisory is triaged and a fix or mitigation is released within the stated time | Drill log | Reviewer |
| AT-3.1c | T3-1 | Review the support log | Responses within the stated times | Log | Reviewer |
| AT-3.2a | T3-2 | Open each of the four named projects' live dashboards | Real data from the project; consent on file | Dashboards, consent letters | Reviewer |
| AT-3.2b | T3-2 | Watch the tenant-perspective video | Shows onboarding to live data | Video | Reviewer |
| AT-3.3a | T3-3 | An outside operator rebuilds from a clean checkout | Working system; steps timed; issues recorded | Dry-run log | The outside operator signs it |
| AT-3.3b | T3-3 | Migrate data between two instances | Counts match; ingest keys keep working | Migration log | Reviewer |
| AT-3.4a | T3-4 (stretch) | Use the adapter with Wallets Kit | Events captured with no manual calls; package published with provenance | Package page, workflow | Reviewer |
| AT-3.5a | T3-5 | Re-run the traceability matrix | No MISSING rows except those deferred with written reasons | Updated matrix | Reviewer |

## 5. Existing tests that carry forward

The 80 current tests remain the regression base; the roadmap adds to them and does not replace them. The manual smoke script `scripts/e2e-smoke.mts` becomes a CI job in T1-4.
