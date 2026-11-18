# Pyxis — Roadmap (MVP + full project)

Sources: `stellar-pulse-documentation/` (docs 01–12, OpenAPI, SQL, tests matrix), PRD v1.0, and the SCF handbook pages
(RFP track "Web and API Analytics", submission criteria, budget & deliverable guidelines).

## 0. Read this first: decisions and honest gaps

| # | Finding | Decision |
|---|---|---|
| 1 | The live RFP states **no budget**. The docs pack assumes $60,000 (10/20/30/40). | Keep 10/20/30/40 (matches SCF's recommended #0–#3 split). Treat $60k as a *proposal*, validate before submitting. |
| 2 | The RFP requires Umami **or** GoatCounter as the web engine. | Umami (already chosen in docs, Postgres-native, fits the stack). Pyxis never writes to Umami tables. |
| 3 | SCF says Tranche 1 must be *development, not planning*, and architecture must be complete at application time. | MVP (Tranche #1) = running software, not documents. Docs 01–12 already serve as the architecture. |
| 4 | "Stellar relevance": SCF rejects superficial Stellar integrations. An analytics platform's Stellar link is weak unless built in. | Make Stellar real in the MVP on **testnet**: sign-in with a Stellar account (SEP-10-style signed challenge), a Wallets-Kit event SDK, and a testnet demo dApp that connects, signs and submits real testnet transactions while emitting funnel events. |
| 5 | Wallet events are frontend-reported, not proof of ledger outcome. | UI and docs label them "reported", never "confirmed". |
| 6 | Docs warn a 99.99% SLA cannot be claimed from single-host Compose. | MVP makes no availability claim. SLA is a Tranche 4 item with measured evidence. |
| 7 | Adoption proof (3 web + 1 API pilots) needs written consent. Nothing in the repo evidences it. | **Human task**: collect pilot LOIs now. Tracked in the checklist below. Never fabricate; demo data is labelled *synthetic*. |
| 8 | Experience / SCF track record carries extra weight and a weak record can disqualify. | **Human task**: assemble verifiable evidence (doc 12 §2). Cannot be built. |
| 9 | The proposal PDF could not be rendered here (no poppler). | Docs pack + PRD used as source of truth. Re-check the PDF against `ROADMAP.md` before submitting. |

## 1. MVP definition (testnet, ~Tranche #1 → #2 boundary)

**Goal:** a reviewer opens a public URL, signs in with a testnet Stellar account, enrolls a project, sends real API
metrics via OTLP, sees endpoint-level dashboards, and sees an operator view that is provably tenant-isolated.

### In the MVP (vertical slice of P0)
1. **Identity/enrollment:** Stellar-account sign-in (challenge/sign/verify, testnet), project create, members/roles (owner/admin/developer/analyst/viewer), operator role.
2. **API keys:** `pyx_live_<id>.<secret>` format, shown once, SHA-256 of high-entropy secret stored, scopes, revoke, last-used.
3. **OTLP/HTTP metrics receiver** (`/v1/metrics`, **JSON only in this MVP**; `http/protobuf` is the first M2 item because it is the OTel SDK default): authenticate first, size/attribute limits, metrics-only (traces/logs rejected `404/415`), tenant from key never payload, allowlist, route normalization (UUID, ints, G/C/M addresses, hashes, trailing slash, `http.route` precedence), 1-minute buckets, mergeable fixed-boundary histograms, delta temporality (cumulative rejected with explicit reason), drop counters by reason.
4. **Postgres schema + RLS** (non-owner runtime role, transaction-local tenant context) + isolation tests.
5. **Dashboards (Next.js + shadcn + RTK Query):** project overview (volume, status-class distribution, p50/p95/p99, error rate), endpoint table (sortable/filterable), keys page, onboarding with copy-paste OTel dual-export snippet.
6. **Operator view:** all projects, side-by-side comparison, aggregate-only, audit log, API-key management for machine access, suspend/remove project.
7. **Wallet SDK alpha** (`@pyxis-hq/wallets-kit`): allowlisted events, bounded queue, never blocks wallet flow; testnet demo dApp.
8. **Web analytics (Umami):** pinned Umami in Docker Compose, site registration + DNS TXT/HTTP-file verification, tracker snippet, link-out dashboard. Embedded Umami reports land in M2.
9. **Dev/ops:** Docker Compose (Postgres + app + Umami), migrations with checksums, seed script labelled *synthetic*, CI (typecheck, unit, isolation tests), README that deploys clean.
10. **Docs for reviewers:** README quickstart, acceptance matrix with pass/fail from real test runs, demo script.

### Explicitly not in the MVP (so we never over-claim)
Umami embedded reports, OIDC/email auth, quotas UI, 24-month rollups job, exports, GDPR erasure workflow, bot detection, HA, load reports, SBOM/signing, handover rehearsal.

### MVP exit criteria (verifiable)
- `docker compose up` + `npm run db:migrate && npm run seed` works from a clean clone.
- Test suite green: normalization fixtures, histogram merge/percentile, key lifecycle, **cross-tenant negative tests**, revoked-key rejection, payload-tenant-spoof ignored, oversize rejection, no secrets in logs.
- Real OTel exporter (sample service) → Pyxis → dashboard numbers reconcile to stored buckets.
- Demo dApp run on Stellar testnet produces funnel counts.
- Recorded demo script (doc 12 §5) can be followed end-to-end.

## 2. Design direction (avoiding generic AI UI)

Constraints from the brief: **no glows, no soft blob shapes, no generic pills.** Skills requested: impeccable, taste-skill,
emilkowalski/skills, brand-identity-skill, stageshow. They install via `npx impeccable install`, `npx skills add …`,
`/plugin install …`; install requires user approval, so they are listed as a setup step, and their *rules* are applied manually in the meantime.

- **Concept: "instrument panel / ledger".** Pyxis reads like a lab instrument or printed ledger, not a SaaS landing page. Hairline rules, tabular numerals, monospace data, square corners (radius 2px), dense but legible tables, charts as plain strokes.
- **Type:** Figtree (variable) for UI; Figtree tabular-nums for data; mono only for keys/IDs.
- **Colour:** warm paper neutral + near-black ink, one signal colour (vermilion) used only for state/emphasis, categorical chart colours validated for contrast. No gradients, no shadows-as-glow, elevation by hairline border only.
- **Shapes:** rectangles. Status = text label with a 6px square marker, not rounded pills.
- **Icons:** Vuesax (via `iconsax-reactjs`), Hugeicons where Vuesax lacks one; web3 logos via `@web3icons/react`.
- **Motion (Emil Kowalski rules):** ease-out for enter, <200ms, transform/opacity only, honour `prefers-reduced-motion`, no decorative animation.
- **Components:** shadcn base only; project variants built by composing/extending them (`src/components/pyxis/*`).

## 3. Full-project roadmap (6-month build + 12-month service)

| Phase | Tranche (share) | Month | Deliverables | Acceptance evidence |
|---|---|---|---|---|
| **M0 Award acceptance** | #0 (10%) | 0–1 | Monorepo, licence (Apache-2.0), CI, local env, schema+RLS, enrolment, Stellar sign-in, key lifecycle | Clean deploy from README, tenant membership tests, dependency/licence inventory |
| **M1 MVP (this repo)** | #1 (20%) | 1–3 | Items in §1: OTLP pipeline, dashboards, operator view, wallet SDK alpha, Umami staged, testnet demo | Acceptance matrix rows green; recorded testnet demo; sample service dual-export; revoked key rejected |
| **M2 Testnet / ecosystem** | #2 (30%) | 4–5 | Umami embedded reports, domain verify prod-grade, bot/inflation strategy, operator comparison + exports API, retention (24-month rollups), quotas, GDPR/erasure + jurisdiction/residency statements, threat model + monitoring plan (required by SCF at Tranche 2), load tests, pilots integrating | Operator sees aggregates only; export reconciles; load report; ≥3 web and 1 API pilot in progress |
| **M3 Mainnet / handover-ready** | #3 (40%) | 6 | Production deploy (IaC), HA + backups + restore drill, SLO dashboards/alerts, security test report, SBOM + signed tracker, operator runbooks, tenant onboarding guide, handover rehearsal, recorded tenant-perspective + operator demos | Pilots live; independent operator deploys/restores/rotates keys; critical tests green |
| **Service** | — | 7–18 | Hosting, 24h critical/high patching, ticket SLAs (5 BD respond / 10 BD resolve), monthly/quarterly reports, handover between months 6–12 of service at SCF discretion | Monthly SLO + patch + backup reports |

Excluded from budget per SCF: audits (Audit Bank), marketing, legal/entity fees, bounties.

## 4. Reviewer-alignment map (SCF criteria → where it is addressed)

| SCF criterion | Response |
|---|---|
| Technical soundness, architecture | docs 02–05 + working vertical slice |
| Umami rationale | doc 07; Umami unmodified, pinned by digest |
| Isolation & access control | RLS + credential-derived tenant + negative tests (visible in CI) |
| Privacy/security | docs 06, 11; metrics-only; no addresses/IPs stored; redaction tests |
| Realistic SLA | no claim in MVP; measured SLOs by Tranche #3 |
| Handover | IaC from monorepo, runbooks, rehearsal |
| Stellar relevance / differentiation | Stellar-account auth, Wallets-Kit funnel SDK, testnet demo; ecosystem-wide comparable metrics |
| Verifiable deliverables | every tranche item has an acceptance ID in `tests/acceptance-matrix.csv` |
| Adoption/traction | **needs human-gathered pilot LOIs** |

## 5. Human-only blockers (cannot be built)
1. Pilot letters: 3 SCF-awarded web projects + 1 API project, with permission to be named.
2. Verifiable maintainer / SCF-SDF track record and eligibility ("builders unknown to SCF are not eligible").
3. Budget validation: effort, cloud, 12-month hosting forecast.
4. Hosting region/legal review for GDPR (counsel).
5. Install the design skills (user approval needed): `npx impeccable install`, `npx skills add emilkowalski/skills`, `npx skills add benjitaylor/skills --skill stageshow`, `/plugin install taste-skill@taste-skill`, `/plugin install brand-identity@brand-identity-skill`.
