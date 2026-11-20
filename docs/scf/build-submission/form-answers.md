# SCF Build Award submission: draft form answers

**Status:** draft text to copy into the SCF Award Submission Form. **Every claim here is backed by [EVIDENCE-REGISTER.md](EVIDENCE-REGISTER.md).** Anything the repository cannot answer is marked `[TEAM INPUT]`; anything that does not exist is marked **MISSING** with the steps to create it.
**Before you paste:** the form's fields, the RFP options, the round and the payment percentages can change. The guide you attached was written in September 2026; the RFP page was read on 2026-11-20. **Re-read the live form and the invitation email first.**
**Do not submit anything from this file without the checks in [SUBMISSION-READINESS.md](SUBMISSION-READINESS.md).**

## Read this first: four facts that change what you can say

1. **Track and RFP.** Track: **RFP**. RFP: **"Web and API Analytics for Stellar Ecosystem Projects"**, listed as a *Current Open RFP* alongside "XDR/CAP-Coverage Audit Tool and Indexer-Hardening Guide". The RFP page states no round or quarter.
2. **Round.** The Build guide you attached lists SCF #46 with a date of November 8, 2026 and was observed in September. **On 2026-11-20 that date has passed**, and a Tobin submission in your dashboard is in Panel Review for SCF #46. **Do not assume #46.** Use the round the live form offers, or ask `communityfund@stellar.org`.
3. **Eligibility.** The RFP states that proposers unknown to SCF are not eligible and weighs open-source maintainer history and years of work with SCF or SDF. **The repository cannot show this** (26 commits, all from November 2026). Section A17 and the readiness file treat it as the deciding question.
4. **The documentation site is live.** Your brief says to describe it as under development; it is live at <https://docs.usepyxis.xyz> (checked 2026-11-20). This file describes it as live.

## Evidence update (2026-11-20, later the same day)

Real-run evidence now exists in [evidence/](evidence/README.md) and changes several answers below. Summary, all **internal tests by the team, not external adoption**:
- A real Varial wallet signed in to the live app on Testnet; the server accepted a correct signature and rejected every forged, altered, malformed, replayed and cross-account variant (corrected 14-check test) (challenge expiry untested). A second, fully prompted run in a clean browser profile followed: connection, sign-in message and payment each approved by the user in the wallet ([evidence](evidence/wallet-run/README.md)).
- Two Testnet payments (1 XLM each, account to itself) are ledger-verified: `9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322` (ledger 5825901) and `4494c75d7eb60b978288c1f088e19d54fb6a20461f97db3aca659958b32f831c` (ledger 5829245). In the second run a further payment was **rejected in the wallet** and no transaction was created.
- The browser SDK's funnel events were stored by Pyxis and shown on the wallet funnel page (frontend-reported); the second run includes a reported failure (Signed 1 of 2 started, Failures reported 1).
- A real Umami 2.20.2 was deployed; Pyxis created a website in it; a controlled browser session produced data that the Pyxis web analytics page showed identically to Umami's own API.
- **API ingestion is now demonstrated (internal workload):** a stock OpenTelemetry Node SDK, configured only with the guide's settings, sent 270 requests; Pyxis counted all 270 with the right status split and showed p50/p95/p99. The service was built for the test, so latencies are artificial and this is not an API-reliability claim. A revoked ingest key was rejected (401).
- A second web analytics session on a new verified site also matched Umami's API.
- Still true: no external users, pilots or letters; no Soroban; Umami is a demonstration instance; the tracker is not version-pinned; none of this runs in CI; routes show as `/_unmatched` unless a framework instrumentation sets `http.route`; ingestion is OTLP JSON only.
Full wording: [traction-evidence.md](traction-evidence.md).

## SECTION A · Submission information

### A1 · Project
Filled automatically with the approved project. **Pyxis.**

### A2 · Round
`[TEAM INPUT: choose the round the live form shows]`. See fact 2 above.

### A3 · Build Award Track
**RFP.**

### A4 · Submission Title
Name the funded scope, not the brand:

> **Production launch of shared, privacy-first web and API analytics for Stellar projects**

### A5 · Project Type
Choose the closest option. In the September capture, a Developer Tooling project saw: DAO & Governance, Formal Verification Tool, IDE, Other Developer Tool, Other Security Tool, Reusable Contract Building Blocks, SDK, Static Analysis Tool, Testing Tool, ZKP. Recommended: **Other Developer Tool**. `[Verify the live list.]`

### A6 · Project URL (optional)
<https://usepyxis.xyz> (live application; a testnet MVP). Your brief lists the Railway address `web-production-3c4c1c5f.up.railway.app`; both answer, but the custom domain is the one to publish. The wallet demo is at <https://usepyxis.xyz/demo>.

### A7 · Technical Architecture Document
Use the specification in this package:
`https://github.com/Pyxis-Hq/pyxis/blob/main/docs/scf/build-submission/technical/technical-specification.md`

**The link will return 404 until the team commits and pushes `docs/scf/build-submission/`.** This audit created the files but did **not** commit or push anything, as instructed. After pushing, test the link in a private window. Supporting documents: `architecture.md`, `stellar-integration.md`, `api-reference.md`, `telemetry-specification.md`, `security/threat-model.md`. The form requires a Stellar-specific document; the Stellar-specific content is in `stellar-integration.md` and states plainly that Pyxis has no Soroban component.

### A8 · GitHub URL (optional)
<https://github.com/Pyxis-Hq/pyxis> (public, Apache-2.0).

### A9 · Video URL (optional)
**MISSING.** The form wants a video under 3 minutes, 16:9, on YouTube or Vimeo. To create one: record (1) 15 seconds on the problem (Stellar projects cannot see how their APIs and sites are used without profiling users); (2) a live walkthrough: sign in with a wallet on the Testnet app, create a project and an ingest key, send one OpenTelemetry batch, see the dashboard with p50 and p95; (3) the team on camera; (4) the ask. **Show only what works today.** You can now show, from real runs: the wallet sign-in with the wallet's signature prompt; the demo dApp connecting a wallet and sending the 1 XLM Testnet payment with the ledger check; the wallet funnel page; and the web analytics page for the demo site. Label them "Testnet demonstration, internal session, one visitor". The API dashboard can now be shown with real data, but label it as a local test workload, not a user's API. A silent 2:37 cut already exists (its wallet scene is from the second, fully prompted run) in `artifacts/scf-demo/final/pyxis-scf-demo.mp4` (not committed, not uploaded); the URL for this field stays **MISSING** until it is uploaded to YouTube or Vimeo. Do not claim the Umami instance is the production plan.

### A10 · Products & Services (required)
Describe only what this award funds. Each item follows: delivered, exists today, improved, how Stellar is used, ecosystem value, how completion is verified.

**1. Verified, pinned web analytics (Umami).**
- *Delivered:* a hosted web analytics service for Stellar projects with domain verification and the metrics the RFP names (page views, visitors, referrers, session duration, bounce rate, country, device and browser), on a version-pinned Umami and tracker.
- *Exists today:* domain verification, an Umami client and a dashboard page. On 2026-11-20 it ran once against a **real Umami 2.20.2** (demonstration instance): Pyxis verified a domain and created the Umami website itself, and its web analytics page matched Umami's API on page views, visitors, bounce, session time, country, browser and device for one controlled internal session ([evidence](evidence/dashboard/dashboard-verification.md)). Still missing: automated tests against a real Umami, a pinned tracker (only the server image tag is pinned), referrer and custom-event display, and any external traffic.
- *Improved:* run and pin a real Umami; integration tests in CI; bot mitigation; erasure workflow.
- *Stellar:* serves Stellar ecosystem projects; sign-in uses a Stellar wallet signature. No on-chain component.
- *Value:* one privacy-first analytics service SCF can run for many projects.
- *Verified by:* integration suite against the pinned Umami in CI; synthetic traffic matches the dashboard within a stated tolerance.

**2. Production API analytics over OpenTelemetry.**
- *Delivered:* ingestion that accepts stock OpenTelemetry exporters, stores only metric aggregates, and serves tenant and operator dashboards at the RFP's design volume.
- *Exists today:* OTLP/HTTP **JSON** ingestion with delta histograms, route templating (including Stellar accounts, contracts and muxed accounts), tenant isolation in PostgreSQL, and p50, p95, p99 dashboards. 80 automated tests pass. On 2026-11-20 a stock OpenTelemetry Node SDK, configured only with the guide's settings (OTLP/HTTP JSON, delta temporality, ingest key), sent 270 requests from a local test service and Pyxis counted all 270 with the correct status-class split ([evidence](evidence/api-and-web-capture/tested-workflows.md)). Known gaps from that run: routes appear as `/_unmatched` unless a framework instrumentation sets `http.route` (the guide says the URL path is used), and the Node SDK needs `OTEL_TRACES_EXPORTER=none` to avoid failing trace exports.
- *Improved:* OTLP protobuf and gzip; rate limiting; rollups and a 24-month retention policy; a published load test.
- *Stellar:* Stellar-aware route normalisation; built for Stellar API operators.
- *Value:* API visibility without storing traces or request bodies.
- *Verified by:* stock SDK and Collector defaults accepted; load report; retention job test.

**3. Multi-tenant operations, privacy and handover.**
- *Delivered:* self-service enrollment with abuse controls, operator removal with data deletion, a tenant erasure workflow, monitoring, backups with a demonstrated restore, runbooks, containers and infrastructure-as-code, and a handover rehearsal.
- *Exists today:* project, member and key management; forced row-level security; operator aggregate view with an audit log; a public production guide. **No monitoring, backups, IaC or container image.**
- *Verified by:* alert test, restore log, outside-operator dry run.

**4. Wallet-funnel SDK (supporting, optional in the RFP).**
- *Exists today:* `@pyxis-hq/wallets-kit@0.1.0-beta.1` on npm: core client and React bindings; counts only, no addresses. In a live Testnet run from a separate demo dApp it delivered six funnel events that Pyxis stored and displayed. Events are **reported by the frontend**, not ledger-verified; the transaction in the run was checked separately on Horizon. Wallet brand reported as `other` in that run, so a per-wallet breakdown is not demonstrated.
- *Stellar:* wallet connect, sign and submit funnel for Stellar dApps.
- *Improved (stretch):* Stellar Wallets Kit adapter; publishing with provenance.

**Honest risks (reviewers assume you missed any you omit):** the web and API paths have run only on controlled internal test traffic (two Umami sessions, one local 270-request workload) and are not tested in CI; the sign-in challenge endpoint and ingestion have no rate limiting or retention today; availability targets need an architecture decision; adoption depends on partner projects; the team's SCF track record must be shown; Stellar's role is the sign-in identity and ecosystem context, **not an on-chain function**, which the guide's "Stellar must be core" test may question.

### A11 · Traction Evidence (required): actual evidence only

| Kind | Evidence | Status |
|---|---|---|
| Live product | <https://usepyxis.xyz> (HTTP 200, 2026-11-20); <https://docs.usepyxis.xyz> | VERIFIED. Testnet MVP; dashboard sample data is synthetic and labelled so |
| Repository | <https://github.com/Pyxis-Hq/pyxis>: Apache-2.0, 26 commits, CI green on `main`, branch protection | VERIFIED. Created 2026-11-18; 0 stars |
| npm | <https://www.npmjs.com/package/@pyxis-hq/wallets-kit> `0.1.0-beta.1` | VERIFIED. 247 downloads in two days **are not adoption** (mirrors and scanners); do not cite them as users |
| Tests | 80 passing tests; typecheck; builds; CI run <https://github.com/Pyxis-Hq/pyxis/actions/runs/44662475801> | VERIFIED |
| Wallet sign-in | A real Varial wallet signed in on Testnet; every prompt screenshotted in the second run; a 14-check live sign-in test (correct signature accepted, forged variants rejected) | VERIFIED ([evidence](evidence/wallet/authentication-verification.md), second run with every prompt screenshotted: [wallet-run](evidence/wallet-run/README.md)). Internal tests; challenge expiry untested; no HTTP logs captured |
| Stellar Testnet transaction | Hash `9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322`, ledger 5825901, successful, one 1 XLM payment (account to itself); <https://stellar.expert/explorer/testnet/tx/9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322> | VERIFIED on Horizon by the auditor. Second payment: `4494c75d7eb60b978288c1f088e19d54fb6a20461f97db3aca659958b32f831c`, ledger 5829245, <https://stellar.expert/explorer/testnet/tx/4494c75d7eb60b978288c1f088e19d54fb6a20461f97db3aca659958b32f831c>; the wallet showed Test Net and the fee before approval. **No contract ID** (Pyxis has no contract); Testnet only; self-payments |
| Wallet funnel | Six events stored and shown on the wallet funnel page (screenshot) | VERIFIED, two internal runs ([second run](evidence/wallet-run/screenshots/15-wallet-funnel.png): Signed 1 of 2, Failures reported 1). Frontend-reported, not ledger-confirmed; the dApp reports every wallet as provider `other` |
| Web analytics session | Real Umami 2.20.2; 7 page views, 1 visitor, 16 s session, NG, Edge, laptop, one custom event; the Pyxis page matched Umami's API | VERIFIED ([evidence](evidence/umami/analytics-verification.md)). One internal visitor per session; a second session on a new site (`pyxis-capture-site.vercel.app`, 6 views) also matched ([screenshot](evidence/api-and-web-capture/screenshots/05-web-analytics.png)); referrers untested |
| API ingestion | A stock OpenTelemetry Node SDK (documented settings) sent 270 requests; Pyxis counted all 270; p50 92.9 ms, p95 550 ms, p99 910 ms; status classes matched the client exactly; a revoked key returned 401 | VERIFIED ([evidence](evidence/api-and-web-capture/tested-workflows.md), [screenshots](evidence/api-and-web-capture/screenshots/)). Local test service with artificial latencies; no external traffic; OTLP JSON only |
| User validation | none | **MISSING.** To obtain: onboard two or three real projects, record what they did and what broke |
| Pilot commitments | none | **MISSING.** To obtain: letters of intent from the SCF-awarded projects the RFP wants instrumented (three for web, one for API) |
| Previously funded | none | `[TEAM INPUT]` |

Suggested wording for the field (it says what the evidence is):

> Pyxis is live at usepyxis.xyz and open source (Apache-2.0), with a wallet SDK published on npm. In internal Testnet demonstrations, a real wallet signed in and sent Testnet payments confirmed on the ledger (explorer links below), the SDK's wallet funnel was stored and displayed, including a payment the user rejected, a stock OpenTelemetry SDK sent 270 requests that Pyxis counted exactly, and a real Umami session matched Pyxis's dashboard. Wallet funnel events are frontend-reported, not ledger-confirmed. We have no external adopters yet; onboarding SCF projects is the purpose of this proposal.

(about 90 words: SCF delegates asked for a short traction field. Put the links under it: usepyxis.xyz, the GitHub repository, the npm package and the two Stellar Expert transactions. Keep the detail for the architecture document and supporting files.)

Do not write: "used by", "trusted by", "production users", "processed N requests" as if it were customer traffic (the 270 requests are a local test workload), "handles N requests per day", "on-chain verified" for the funnel events, "supports OpenTelemetry" without "JSON".

### A12 · Resubmission Feedback
Leave blank for a first submission. `[TEAM INPUT if this is a resubmission]`.

### A13 · Ambassador Affiliation
`[TEAM INPUT: Yes or No]`. Nothing in the repository shows one.

### A13a · Affiliated Chapter
Not applicable unless A13 is Yes.

### A14 · Thumbnail (required)
**MISSING.** Create a 16:9 image (for example 1920×1080) with the Pyxis mark and a short readable line, for example "Privacy-first analytics for Stellar". The mark is in `src/components/pyxis/logo.tsx` (three bars on a violet square).

### A15 · Team Members (optional)
Each person needs an SCF Dashboard account (Discord login). `[TEAM INPUT]`.

### A16 · Mailing List (required)
Select at least one team member. `[TEAM INPUT]`.

### A17 · Team Description (required)
**`[TEAM INPUT]`. The repository cannot supply this.** Do **not** reuse the Tobin team text from the other submission unless the same people work on Pyxis and you say so. The RFP weighs maintainer history and SCF or SDF history, so write the proof, not a summary:

```
Headcount: [n]
For each person: role · years of experience · relevant stack (TypeScript, Next.js, PostgreSQL, OpenTelemetry, Stellar) · what they have shipped, scaled or open-sourced (links) · LinkedIn and GitHub
Prior SCF or SDF awards, tranches delivered, public repositories maintained, dates: [list with links]
Evidence of operating a hosted service for others: [list]
Availability for the 12-month hosting and support period: [yes/no, who]
```

## SECTION B · Deliverables and budget (RFP track)

**Verify first:** the RFP-specific fields in the live form (the September capture showed: a confirmation, Budget, **RFP Track Specifics** (choose the RFP), three tranche deliverable fields, three completion dates). Payment: Tranche 0 is 10% on acceptance; Tranches 1, 2, 3 are 20%, 30%, 40% `[verify]`.

- **Confirmation:** "Yes, I understand" (the submission directly addresses the open RFP).
- **RFP Track Specifics:** *Web and API Analytics for Stellar Ecosystem Projects*.
- **Budget:** `[TEAM INPUT]`. Use [planning/budget-assumptions.md](planning/budget-assumptions.md): `E = 50 × BLENDED_WEEKLY_RATE`, plus quoted direct costs. **Do not default to $150,000.**

### Questions to ask SCF before submitting
1. The form says Tranche 2 must include an **"onchain monitoring plan and corresponding threat model"**. Pyxis has no on-chain component. Is a service monitoring plan plus a threat model that covers the wallet sign-in and the wallet-event path acceptable?
2. The form says Tranche 3 is **"Mainnet launch (or equivalent)"**. Is production launch of the hosted service the accepted equivalent?
3. Does the award cover the **12 months of hosting and support** after the final tranche, or must the team fund it?
4. May **legal review** of the privacy statements be in the budget?
5. Which **round** is open to this RFP now?

### Tranche 1 · Verified and hardened core
`[Completion date DD/MM/YYYY: TEAM INPUT]` · Budget: `T1 = sum of the six lines below`

| Deliverable | Description | How to measure completion | Budget |
|---|---|---|---|
| **1.1 Real, pinned Umami integration** | Deploy Umami from an image digest; pin and integrity-check the tracker; run the integration suite against the real Umami in CI; prove each required web metric with synthetic traffic on static, SPA and SSR sites | CI run linking the pinned image digest; integration log; metrics within the stated tolerance of generated traffic | `6.0% × E + direct` |
| **1.2 Ingestion hardening and protocol support** | Accept OTLP/HTTP protobuf and gzip; per-IP and per-key rate limits; a browser-only key scope; streaming body cap; strict identifiers; wallet-events audit parity | Stock OpenTelemetry SDK and Collector with default settings accepted; test log for limits, `429`, scope separation | `10.0% × E` |
| **1.3 Rollups and retention** | SQL-side aggregation, hourly and daily rollups, a scheduled retention job implementing a published 24-month policy, purge of expired sessions and challenges | Retention test in CI; a 90-day query within the stated latency; no raw-row load in the app | `6.0% × E` |
| **1.4 Test and CI hardening** | Tests for sign-in, session, authorization and every route; cross-tenant negative tests over HTTP; the smoke script in CI; lint, coverage, dependency and secret scanning | CI run with the new jobs; coverage report | `6.0% × E` |
| **1.5 Read API and operator-issued keys** | A documented read API consumed by the `query` scope; operators issue and revoke read keys | Test log: read key returns aggregates, denies other projects, revocation immediate | `5.0% × E` |
| **1.6 Containers and infrastructure-as-code baseline** | Pinned Dockerfile; compose that runs the whole stack; `.env.example`; automatic migration; IaC for one target environment | A clean clone starts the stack with one command; smoke script passes | `7.0% × E + direct` |

### Tranche 2 · Privacy, operability and evidence at scale
**Must include the threat model and monitoring plan (see question 1).** `[Completion date: TEAM INPUT]`

| Deliverable | Description | How to measure completion | Budget |
|---|---|---|---|
| **2.1 Threat model and launch-gate security fixes** | Final STRIDE threat model, independently reviewed; origin checks; SSRF guard pinned to the validated address; operator audit completeness; fail-fast configuration; security headers | Published model and reviewer notes; tests for each fix | `5.0% × E` |
| **2.2 Monitoring plan and operations baseline** | Published monitoring plan; probes, metrics, alerts and structured logs live; database-aware health endpoint; scheduled backups and a **demonstrated restore**; incident and rotation runbooks exercised once | An induced fault alerts a human; restore log with the test suite passing on the restored instance | `8.0% × E + direct` |
| **2.3 Privacy and compliance** | Bot mitigation; tenant erasure reaching Umami; retention statement; counsel-reviewed GDPR, residency and erasure statements; ad-blocker-neutral script names | Erasure test log; published statements; bot test | `8.0% × E` (+ legal cost if allowed) |
| **2.4 Enrollment and removal controls** | Quotas; approval-required mode; operator removal that deletes data; audit of project-level admin actions | Test log | `5.0% × E` |
| **2.5 Operator dashboards** | Cross-project web metrics with filters; service and environment filters | Fixture tests; screenshots | `6.0% × E` |
| **2.6 Published load test** | A synthetic OTLP generator and a method to sustain about 1,000,000 requests per day; results with environment, latency, error rate and database growth | Report with raw data; target met or shortfall stated | `6.0% × E + direct` |

### Tranche 3 · Production launch and handover
`[Completion date: TEAM INPUT]` · Tranche 3 includes the onchain-metric field only for the Integration track; it does not apply to RFP.

| Deliverable | Description | How to measure completion | Budget |
|---|---|---|---|
| **3.1 Production launch with measured service levels** | Production from the monorepo; availability measured and published against an honest SLO; public status page; patch process with a drill; support policy and log | Published figures from raw probe data; drill log; response log | `6.0% × E + direct` |
| **3.2 Adoption proof** | At least three SCF-awarded projects on web analytics and one on API traffic, with consent; live operator view; a tenant-perspective video | Four named dashboards with live data; consent letters; video | `6.0% × E` |
| **3.3 Handover package and dry run** | Complete runbooks; an outside operator rebuilds from a clean checkout; data-migration rehearsal | Signed dry-run log; migration log | `6.0% × E` |
| **3.4 SDK and release engineering (optional)** | Wallets Kit adapter; npm publishing with provenance; changelog and tags | Package page with provenance; adapter test | **Not in the core request** |
| **3.5 Final report and remediation** | Review findings fixed or accepted with reasons; Audit Bank request; reproducible-evidence report | Updated requirements matrix; report | `4.0% × E` |

**Core shares sum to 100% of `E` (50 person-weeks).** Exclude marketing, audit costs, bounties, past work and general overhead.

## SECTION C · Legal acknowledgements (do not accept on the team's behalf)

The form requires all six boxes. This audit has **not** accepted any. The official applicant must read each and decide.

| Acknowledgement | What it commits you to | Question for the applicant or counsel |
|---|---|---|
| Official Rules and Terms | You have read the Official Rules, the Handbook, the SDF Privacy Policy and Terms of Service | Has every team member read them? |
| Restrictions on Use of Funds | No speculation, wash trading, investment advice, marketing of yield, sanctioned dealings; SDF may withhold payment on suspicion | Do any planned activities touch these? |
| Sanctions Compliance | Neither you nor directors, officers, shareholders or agents are Sanctioned Persons | Is every individual and entity eligible? Residency of each person? |
| Marketing and Publication Rights | A perpetual, worldwide licence for SDF to use your submission, name, likeness and voice | Does every person shown in the video consent? Can the entity grant this? |
| Disclaimers and Limitations | XLM is volatile; release of SDF from liability | Does the entity accept XLM price risk (budget paid in XLM)? |
| General Conditions | SDF may modify programs; the Official Rules prevail | Reviewed by counsel? |

Also decide: **submitter type** (individual, team or entity), the named **Representative**, and who completes **KYC or KYB** at stellar.org/bd-kyc (every contributor on a team).

## Things not to say

"Supports OpenTelemetry" without "JSON"; "version-pinned" (only the Umami server image tag is pinned; the tracker is not, and the Pyxis web analytics page still says "pinned"); "GDPR compliant"; "handles one million requests a day"; "99.99% available"; "verified on-chain" for funnel events; "independently audited"; "used by"; any users, volumes, revenue or partnerships.

Now allowed, with the qualifier "internal Testnet demonstration": "tested with a real wallet" (Varial, sign-in; the payment wallet brand is unknown), "web analytics verified against a real Umami" (two controlled sessions), "a stock OpenTelemetry SDK's metrics are ingested and aggregated" (JSON, delta temporality, a local 270-request test workload).

## Information the team must still provide

Round; team members, roles and SCF or SDF history; ambassador affiliation; video; thumbnail; budget inputs (rate, quotes, availability decision); the answers to the five questions to ask SCF; consent from pilot projects. (The real-wallet run and the real Umami run are done; see [evidence/](evidence/README.md).) Also decide whether to commit the demo dApp, which lives outside the repository, and whether to keep the demonstration Umami and demo site running.
