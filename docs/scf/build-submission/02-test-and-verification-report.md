# 02 · Test and verification report

**Status:** results of commands executed on 2026-11-20 against a **clean clone** of `main` at commit `a7df1dad66b6803ff26150a0c40569ceeb174de8`. Raw log: kept in the audit scratch area outside the repository; the commands below reproduce it.
**Related:** [01-repository-inventory.md](01-repository-inventory.md), [03-rfp-requirements-matrix.md](03-rfp-requirements-matrix.md), [EVIDENCE-REGISTER.md](EVIDENCE-REGISTER.md).

## 1. Environment

| Item | Value |
|---|---|
| OS | Windows 11 Pro (Git Bash) |
| Node.js | v24.14.0 (CI and production use Node 22) |
| npm | 11.19.0 |
| Install | `npm ci --legacy-peer-deps` (the repository also ships `.npmrc` with `legacy-peer-deps=true`) |
| Database for tests | `embedded-postgres` ^18.6.0-beta.19, started by the test suite itself |
| Git | clean clone of `https://github.com/Pyxis-Hq/pyxis.git`, hard-reset to `origin/main` |

The author's own working folder produced a Vitest configuration error (`Cannot read properties of undefined (reading 'config')`) that does **not** occur in a clean clone. The cause was not identified. Results below are from the clean clone.

## 2. Commands and results

| # | Command | Result | Duration | Notes |
|---|---|---|---|---|
| 1 | `npm ci --legacy-peer-deps` | **Pass** (exit 0) | 5 min 29 s | npm reports **23 vulnerabilities (4 low, 9 moderate, 10 high)** |
| 2 | `npm run typecheck` (`next typegen && tsc --noEmit`) | **Pass** (exit 0) | 24 s | Route types generated |
| 3 | `npx vitest run --reporter=verbose` | **Pass: 5 files, 80 tests, 0 failed, 0 skipped** | 28 s total, 22.6 s in Vitest | |
| 4 | `npm run build` (Next.js app) | **Pass** (exit 0) | 52 s | 35 route entries generated |
| 5 | `npm run build --workspace @pyxis-hq/wallets-kit` | **Pass** (exit 0) | 8 s | ESM, CJS and type declarations |
| 6 | `npm run build --workspace @pyxis-hq/docs` | **Pass** (exit 0) | 59 s | |
| 7 | `npm audit --omit=dev --audit-level=high` | **Fail by design** (exit 1) | 24 s | **22 vulnerabilities (3 low, 9 moderate, 10 high)**, none critical |
| 8 | `npm audit --json` | exit 1 | 10 s | Same findings, machine-readable |

**Linting:** not run. The repository has **no `lint` script** and no ESLint configuration was found. **Coverage:** not run; no coverage tool is configured. **SDK tests:** included in step 3 (`tests/sdk.test.ts`). **Migration check:** the database suite applies the migrations to a fresh database (`tests/db.test.ts`); no separate migration-safety test exists.

### 2.1 Tests per suite

| Suite | Tests | Covers |
|---|---|---|
| `tests/unit.test.ts` | 17 | Route normalization, histogram merge and quantiles, OTLP parsing and drop reasons, ingest key format |
| `tests/db.test.ts` | 9 | Row-level security on a real PostgreSQL, runtime role attributes, pooled-connection context, SQL-injection strings, key lifecycle |
| `tests/wallet.test.ts` | 12 | Server-side wallet event validator and the SDK queue |
| `tests/web.test.ts` | 33 | Domain normalization, the SSRF address check, domain verification (with injected resolvers), the Umami client against a **fake** server |
| `tests/sdk.test.ts` | 9 | The published SDK core and React bindings, built from source through a Vitest alias |
| **Total** | **80** | |

### 2.2 Dependency audit summary

All 22 production findings come through two trees: `@creit.tech/stellar-wallets-kit` (the `elliptic`, `secp256k1`, `@near-js/crypto`, `@hot-wallet/sdk`, `@reown/appkit` chain) and `shadcn` (`minimatch`, `ts-morph`). `npm audit` offers only a breaking downgrade of the wallet kit as a remedy. The wallet kit is used by the demo page and the sign-in helper, **not** by the ingest path. `SECURITY.md` says "about 20"; the measured count is 22.

## 3. Reproduce

```bash
git clone https://github.com/Pyxis-Hq/pyxis.git && cd pyxis
git checkout a7df1dad66b6803ff26150a0c40569ceeb174de8
npm ci --legacy-peer-deps
npm run typecheck
npx vitest run --reporter=verbose
npm run build && npm run build --workspace @pyxis-hq/wallets-kit && npm run build --workspace @pyxis-hq/docs
npm audit --omit=dev
```

Prerequisites: Node.js 22 or later and npm. No external service, credential or Docker is needed.

## 4. What the tests prove, and what they do not

| Claim | Proven by | Limit |
|---|---|---|
| Tenant A cannot read or write tenant B's rows; no context returns nothing; pooled connections do not leak context | `tests/db.test.ts` (9 tests) on a real PostgreSQL | The embedded server does not enforce passwords; HTTP routes are not exercised |
| Runtime role is not the table owner and cannot bypass RLS | `tests/db.test.ts` "runtime role is not owner..." | Production role attributes were not inspected |
| Percentiles come from merged histograms | `tests/unit.test.ts` "merges before computing quantiles" | The assertion uses loose bounds, so it would not catch a small interpolation error |
| Wallet events cannot carry an address, signature, XDR, message or email | `tests/wallet.test.ts` (prohibited properties) | `failure_category` accepts any lowercase `a-z_` string |
| SDK never throws and bounds its queue | `tests/wallet.test.ts`, `tests/sdk.test.ts` | Runs against the source, not the published bundle; no real browser, no timers across a page hide |
| Domain verification refuses private addresses and redirects | `tests/web.test.ts` | Injected resolvers model **one** resolution, so DNS rebinding between lookup and fetch is **not** tested despite the test title |
| Umami client builds reports and a snippet | `tests/web.test.ts` | **Fake server only**; no real Umami release |

## 5. Not tested at all

| Area | Why it matters |
|---|---|
| Wallet sign-in (`createChallenge`, `verifyChallenge`, `currentUser`, `authorize`) | No Vitest test calls them. Only `scripts/e2e-smoke.mts` exercises sign-in, replay rejection and tenant isolation, by hand against a running server with a generated keypair. CI does not run it |
| Every HTTP route handler | No route-level test exists |
| `/v1/metrics` end to end (limits, partial success, protobuf, gzip) | Only the pure parser is unit-tested |
| The dashboards and the React components | No component or browser test |
| Rate limiting, retention, idempotency | These features do not exist |
| Real browser wallet | Never run and recorded |
| Real Umami | Never deployed in the test or the live environment |
| Load and availability | No benchmark, soak or failover test |

## 6. Blocked verifications

| ID | Verification | Blocked by | Exact steps to unblock |
|---|---|---|---|
| B1 | Browser wallet sign-in with Freighter or another wallet | Needs a real wallet and a human | Open `/signin` on a Testnet deployment, connect Freighter, sign, confirm a session; record a screen capture and the wallet and version used |
| B2 | Demo run with a funded Testnet account | Needs a wallet and Friendbot | Run `/demo`, make the payment, record the Stellar Expert transaction hash and the matching funnel counts |
| B3 | Umami against a real release | No Umami deployed | Deploy a pinned Umami, set `UMAMI_*`, verify a real domain, load a test page, compare counts |
| B4 | Docker compose from a clean clone | Docker daemon not running on the audit machine | Start Docker, run `docker compose up`, apply migrations, run `scripts/e2e-smoke.mts` |
| B5 | Load at the one-million-requests-per-day target | No harness | Build a synthetic OTLP generator, run for 24 h of equivalent volume, record latency, errors, database size |
| B6 | Lint and coverage | No lint script, no coverage tool | Add ESLint and a coverage provider (deliverable T1-4) |
| B7 | CI run results for the audited commit | **Resolved:** the GitHub Actions run for `a7df1da` completed with success (<https://github.com/Pyxis-Hq/pyxis/actions/runs/44662475801>, checked 2026-11-20 through the GitHub API); the seven earlier runs also succeeded | none |

## 7. Test-to-requirement traceability

| RFP row | Requirement | Test or script | Result | Gap |
|---|---|---|---|---|
| G1 | Tenant isolation | `tests/db.test.ts` (all 9) | Pass | HTTP level untested |
| G3, G7 | Self-service enrollment, no fees | none | n/a | No test |
| G8 | Operator read keys | none | n/a | Feature missing |
| W6, W14 | Web metrics | `tests/web.test.ts` (Umami fake) | Pass against a fake | Real Umami unverified |
| W12 | Erasure | none | n/a | Feature missing |
| A1 | OTLP acceptance | `tests/unit.test.ts` (OTLP parsing, 4 tests) | Pass | JSON only |
| A2 | Metrics-only storage | `tests/unit.test.ts` "drops sensitive attributes"; `scripts/e2e-smoke.mts` (traces 404) | Pass; smoke manual | Smoke not in CI |
| A3 | Required attributes | `tests/unit.test.ts` "normalizes, converts s->ms..." | Pass | Empty-unit case untested |
| A4 | Path normalization | `tests/unit.test.ts` (route normalization, 10 tests) | Pass | `M`, `0x`, short hashes |
| A8 | Percentiles | `tests/unit.test.ts` "merges before computing quantiles" | Pass | Loose bounds |
| D7 | Test suite | all five suites | 80 pass | Auth, routes, UI absent |
| H3 | Vulnerability response | `npm audit` | 22 findings (10 high) | No patch process |
