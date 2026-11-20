# 01 · Repository inventory

**Status:** audit output for the SCF Build submission. **Commit audited:** `a7df1da` on `main` of <https://github.com/Pyxis-Hq/pyxis> (160 tracked files, 26 commits, one author in git history).
**Evidence basis:** direct reading of the files cited below, plus three read-only subsystem audits whose raw reports are kept outside the repository. Status labels follow the audit rules: IMPLEMENTED, IMPLEMENTED NOT INDEPENDENTLY VERIFIED, PARTIAL, PLANNED, MISSING, BLOCKED.
**Related:** [02-test-and-verification-report.md](02-test-and-verification-report.md), [technical/architecture.md](technical/architecture.md), [EVIDENCE-REGISTER.md](EVIDENCE-REGISTER.md).

## 1. Repository structure

```text
src/app/                  Next.js 16 App Router: pages, session API (api/v1), ingest API (v1)
src/components/           pyxis/ (shell, charts, primitives, wallet funnel), ui/ (shadcn/Base UI)
src/lib/                  RTK Query client (api.ts), store, wallet sign-in helper (wallet.ts)
src/server/               db, auth, keys, ingest (otlp, histogram, normalize), queries, umami, domain, wallet-events
db/migrations/            001_init.sql (frozen), 002_rename_to_pyxis.sql
scripts/                  migrate, dev-db (embedded PostgreSQL), seed, e2e-smoke, set-app-role
sdk/wallets-kit/          @pyxis-hq/wallets-kit (npm workspace package)
apps/docs/                Fumadocs documentation site (npm workspace package)
tests/                    5 Vitest suites
docs/                     design teardown, handover plan, SDK spec, RFP matrix and checklist, this package
.github/                  CI workflow, Dependabot, issue forms, pull request template
```

Top-level documents: README.md (287 lines), TECHNICAL.md (676), SECURITY.md (307), PRODUCT.md (43), DESIGN.md (315), ROADMAP.md (92), CONTRIBUTING.md (304), LICENSE (Apache-2.0), AGENTS.md.

## 2. Technology stack (from `package.json`)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (Turbopack, breaking-change release) | 16.4.6 |
| UI runtime | React, React DOM | 19.3.1 |
| Styling | Tailwind CSS, shadcn/ui on Base UI | 4.3.5, `@base-ui/react` ^1.9.0 |
| State and data | Redux Toolkit with RTK Query | ^2.14.0 |
| Language | TypeScript (strict) | ^5 |
| Database | PostgreSQL 17 or 18; `pg` driver | `pg` ^8.23.1 |
| Stellar | `@stellar/stellar-sdk`; `@creit.tech/stellar-wallets-kit` (demo only) | ^17.4.0; ^2.8.0 |
| Validation | `zod` | ^4.6.7 |
| Tests | Vitest; `embedded-postgres` for database tests | ^5.1.1; ^18.6.0-beta.19 |
| Package build | `tsup` (SDK) | ^8.5.1 |
| Docs site | Fumadocs (`fumadocs-ui`, `-core`, `-mdx`) | 16.19.4 / 16.19.4 / 15.6.3 |
| Node | Node.js 22 in CI and production (no `engines` field) | 22 |

Declared but **unused**: `@opentelemetry/otlp-transformer` and `protobufjs` appear in `package.json` and are imported nowhere (verified by search). They suggest protobuf OTLP support that does not exist.

## 3. Runtime architecture

One Next.js process (`next start`) serves the UI, the session-authenticated JSON API and the key-authenticated ingest endpoints. PostgreSQL holds all state. Umami is a separate service reached over its REST API. There is no queue, worker, scheduler or cache. See [technical/architecture.md](technical/architecture.md).

## 4. Application entry points

| Entry | Path | Auth | Purpose |
|---|---|---|---|
| Public landing page | `src/app/page.tsx` | none | Marketing page with synthetic sample chart |
| Sign-in | `src/app/signin/page.tsx` | none | Wallet sign-in |
| App | `src/app/projects/**`, `src/app/operator/page.tsx` | session | Dashboards, keys, sites, wallet funnel, settings, operator view |
| Demo dApp | `src/app/demo/page.tsx` | none | Testnet wallet flow that reports funnel events |
| Session API | `src/app/api/v1/**` (17 routes) | session cookie | Auth, projects, members, keys, sites, analytics, operator |
| Ingest API | `src/app/v1/metrics`, `wallet-events`, `traces`, `logs` | ingest key | OTLP JSON metrics, wallet events; traces and logs return 404 |

## 5. Backend and frontend boundaries

Server code lives in `src/server/**` and is imported only by route handlers. The browser talks to `/api/v1/**` through RTK Query (`src/lib/api.ts`). Ingest keys never reach the dashboard client except at creation time. The demo page and the SDK run in the browser and talk to `/v1/wallet-events` with a write-only key.

## 6. Database architecture

Two migrations: `001_init.sql` (207 lines; its header comment still says "Stellar Pulse" because applied migrations are frozen and checksummed) and `002_rename_to_pyxis.sql` (renames the runtime role and 8 functions). Twelve tables, row-level security enabled and forced on eight of them, five `SECURITY DEFINER` functions for pre-tenant lookups, one runtime role (`pyxis_app`, no `BYPASSRLS`, not owner). Details in [technical/technical-specification.md](technical/technical-specification.md) section 10.

## 7. API routes

| Route | Methods | Responsibility |
|---|---|---|
| `/api/v1/auth/challenge`, `/verify`, `/logout`, `/me` | POST, POST, POST, GET | Wallet sign-in and session |
| `/api/v1/projects` | GET, POST | List and create projects |
| `/api/v1/projects/[id]` | GET, PATCH | Project detail, rename |
| `/api/v1/projects/[id]/members`, `/members/[userId]` | GET, POST, DELETE | Team management |
| `/api/v1/projects/[id]/keys`, `/keys/[keyId]` | GET, POST, DELETE | Ingest key lifecycle |
| `/api/v1/projects/[id]/sites`, `/sites/[siteId]/verify`, `/sites/[siteId]/web` | GET, POST, POST, GET | Domain verification and Umami report |
| `/api/v1/projects/[id]/analytics`, `/wallet` | GET | API analytics and wallet funnel |
| `/api/v1/operator/overview`, `/operator/projects/[id]/status` | GET, PATCH | Operator aggregates and project status |
| `/v1/metrics` | POST | OTLP/HTTP JSON metrics |
| `/v1/wallet-events` | POST, OPTIONS | Wallet funnel events (CORS `*`) |
| `/v1/traces`, `/v1/logs` | POST | Always `404 signal_not_supported` |

## 8. Authentication and authorization components

`src/server/auth/session.ts` (challenge, signature verification, session, role ranking), `src/server/keys.ts` (ingest keys), `src/server/db.ts` (`withContext` tenant transaction), `src/lib/wallet.ts` (browser sign-in helper). Roles: viewer, analyst, developer, admin, owner (per project) and operator (deployment-wide, from `OPERATOR_ACCOUNTS`).

## 9. Analytics ingestion components

`src/server/ingest/otlp.ts` (parse and persist), `histogram.ts` (12 fixed buckets, rebucket, merge, quantile), `normalize.ts` (route templating), `src/server/wallet-events.ts` (allowlist validator, minute buckets), `src/server/queries.ts` (summaries, series, endpoints), `src/server/umami.ts` (Umami REST client), `src/server/domain.ts` (domain verification and SSRF guard).

## 10. Stellar integration components

Only: signature verification of the sign-in challenge (`@stellar/stellar-sdk` `Keypair.verify`, `StrKey`), the demo's testnet payment through Wallets Kit and Horizon testnet, and the SDK's client-declared `network` label. **No Soroban contract, RPC, Horizon read-back, event indexing or ledger verification exists.** See [technical/stellar-integration.md](technical/stellar-integration.md).

## 11. SDK packages and public interfaces

`@pyxis-hq/wallets-kit@0.1.0-beta.1` (npm `latest`): core `PyxisWallet`, `createPyxisWallet`, React `PyxisProvider` and `usePyxis`. No Stellar Wallets Kit adapter, no OpenTelemetry helper, no automatic capture.

## 12. External services and dependencies

| Service | Used for | State |
|---|---|---|
| Railway | Hosting of the app, the docs site and PostgreSQL | Live |
| Namecheap | DNS for `usepyxis.xyz` | Live |
| npm | Publishing `@pyxis-hq/wallets-kit` | Live |
| Umami | Web analytics engine | **Not deployed; client tested against a fake server only** |
| Horizon testnet, Friendbot | Demo only | Used by `src/app/demo/page.tsx` |

## 13. CI/CD and testing infrastructure

`.github/workflows/ci.yml`: one job (Ubuntu, Node 22): `npm ci --legacy-peer-deps`, build SDK, `typecheck`, `npm test`, `npm run build`, build docs. **No lint, coverage, dependency audit, SAST, publish or deploy step.** No `lint` script exists. Dependabot (npm weekly, GitHub Actions monthly) is configured. Deployment is manual with the Railway CLI.

## 14. Deployment configuration

`railway.json` (Railpack, `npm run build`, pre-deploy migrate and role, `npm run start`, health check `/`), `docker-compose.yml` (PostgreSQL, Umami, Umami database; self-labelled unverified; Umami tag is the mutable `postgresql-latest`), `.npmrc` (`legacy-peer-deps=true`). **No Dockerfile, no infrastructure-as-code, no `.env.example`.**

## 15. Documentation inventory

Product and design: PRODUCT.md, DESIGN.md, ROADMAP.md. Engineering: README.md, TECHNICAL.md, CONTRIBUTING.md, SECURITY.md. Planning: `docs/handover-build-plan.md`, `docs/sdk-build-spec.md`, `docs/rfp-acceptance-matrix.md`, `docs/rfp-checklist.md`, `docs/design-teardown.md`. Public site: <https://docs.usepyxis.xyz> (15 pages, source in `apps/docs/content/docs/`). This submission package: `docs/scf/build-submission/`.

## 16. Incomplete, undocumented or hard to maintain

| Area | Observation |
|---|---|
| Duplicated truth | The RFP matrix, TECHNICAL.md, the docs site and this package describe the same facts in four places; they drift (see the consistency findings in [FINAL-AUDIT-REPORT.md](FINAL-AUDIT-REPORT.md)) |
| Unused dependencies | `@opentelemetry/otlp-transformer`, `protobufjs` |
| Stale comments | `src/server/umami.ts:48` calls the tracker "version-pinned"; it is not. `001_init.sql:1` says "Stellar Pulse" (frozen) |
| No `.env.example` | Operators must read the docs to learn the variables |
| Default credentials fallback | `src/server/db.ts:9` falls back to `pyxis_app:pyxis_app@localhost`, so a missing production variable does not fail fast |
| Dashboard reads | Queries load raw bucket rows into Node for up to 90 days (`src/server/queries.ts:37-77`) |
| Release process | Manual `npm publish` from a personal account; no tags, changelog or provenance |
| Local vs CI | In the author's working folder `vitest` failed with a configuration error that did not occur in a clean clone; cause not identified |
