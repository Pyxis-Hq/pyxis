# Evidence register

**Status:** an indexed list of the proof behind every significant claim in the submission package. A claim without an entry here must not be made. Verification status uses the audit vocabulary: **VERIFIED** (checked directly by the auditor on 2026-11-20), **CITED** (read in source or documents, not run), **UNVERIFIED** (asserted by a document, not checked), **ABSENT** (no evidence exists).
**Audited commit:** `a7df1dad66b6803ff26150a0c40569ceeb174de8`.
**Related:** [02-test-and-verification-report.md](02-test-and-verification-report.md), [03-rfp-requirements-matrix.md](03-rfp-requirements-matrix.md), [FINAL-AUDIT-REPORT.md](FINAL-AUDIT-REPORT.md).

## 1. Repository, build and tests

| ID | Claim | Evidence type | Location | Status | Limitation |
|---|---|---|---|---|---|
| EV-001 | The code is public under Apache-2.0 | GitHub API; file | <https://github.com/Pyxis-Hq/pyxis>; `LICENSE` | VERIFIED | Repository created 2026-11-18; 26 commits, one author; 0 stars, 0 forks |
| EV-002 | The project typechecks | Command | `npm run typecheck`, exit 0 | VERIFIED | Clean clone, Node 24 locally |
| EV-003 | 80 automated tests pass | Command | `npx vitest run`, 5 files, 80 passed | VERIFIED | See coverage gaps in report 02 |
| EV-004 | The app, SDK and docs build | Commands | `npm run build` and two workspace builds, exit 0 | VERIFIED | |
| EV-005 | CI is green for the audited commit | GitHub Actions | <https://github.com/Pyxis-Hq/pyxis/actions/runs/44662475801> | VERIFIED | CI runs typecheck, tests and builds only |
| EV-006 | Tenant isolation holds on a real PostgreSQL | Tests | `tests/db.test.ts` (9 tests) | VERIFIED | Embedded server, not the deployment; no HTTP-level test |
| EV-007 | Runtime role is not owner and has no `BYPASSRLS` | Test and SQL | `tests/db.test.ts`; `001_init.sql:6` | VERIFIED (test) | **Deployed role not inspected** |
| EV-008 | OTLP parsing, normalization and drop reasons behave as documented | Tests | `tests/unit.test.ts` (17 tests) | VERIFIED | Loose percentile assertion |
| EV-009 | Wallet events cannot carry address-like properties | Tests | `tests/wallet.test.ts`; `tests/sdk.test.ts` | VERIFIED for property names | `failure_category` accepts lowercase text |
| EV-010 | Sign-in, replay rejection and tenant isolation work over HTTP | Manual script | `scripts/e2e-smoke.mts` | CITED | **Not run for this package; not in CI;** generated keypair, not a wallet |
| EV-011 | 22 production dependency advisories (10 high) | Command | `npm audit --omit=dev` | VERIFIED | Direct advice is a breaking downgrade |

## 2. Live deployment

| ID | Claim | Evidence type | Location | Status | Limitation |
|---|---|---|---|---|---|
| EV-020 | The application is live over HTTPS | HTTP check | <https://usepyxis.xyz> returned 200 | VERIFIED | One probe; no uptime history |
| EV-021 | The documentation site is live | HTTP check | <https://docs.usepyxis.xyz> returned 307 to `/docs`, then 200 | VERIFIED | The brief said the docs were under development; they are live |
| EV-022 | The original Railway URL still answers | HTTP check | `web-production-3c4c1c5f.up.railway.app` returned 200 | VERIFIED | |
| EV-023 | The live app is the renamed build | HTTP check | page title "Pyxis"; sign-in challenge returned 200 | VERIFIED | |
| EV-024 | Migration `002` is applied in production | Command output | `applied 002_rename_to_pyxis.sql` over `railway ssh` | CITED (session record) | Not re-checked by this audit |
| EV-025 | One replica per service, region `us-west2` | CLI deployment manifest | `railway deployment list --json` | CITED | Railway dashboard not inspected |
| EV-026 | DNS and certificates are in place | Railway status | domain status verified, certificate valid | CITED (session record) | |
| EV-027 | Umami was not deployed at audit time (2026-11-20 morning) | Absence | no `UMAMI_*` variables | **SUPERSEDED**: Umami 2.20.2 deployed later that day, see [evidence/umami/umami-deployment-verification.md](evidence/umami/umami-deployment-verification.md) | Demonstration instance only |

## 3. SDK and npm

| ID | Claim | Evidence type | Location | Status | Limitation |
|---|---|---|---|---|---|
| EV-030 | `@pyxis-hq/wallets-kit@0.1.0-beta.1` is published and `latest` | npm registry | <https://www.npmjs.com/package/@pyxis-hq/wallets-kit>; `npm view` | VERIFIED | Also lists `0.0.0-stage` and `0.1.0-beta.0`; origin of `0.0.0-stage` unknown |
| EV-031 | The published `dist/index.js` matches the repository build | Diff by the SDK audit | tarball vs local build | VERIFIED for `dist/index.js` and README | Other files not diffed |
| EV-032 | The package carries no provenance attestation | Registry metadata | `npm view --json` | VERIFIED (absence) | |
| EV-033 | npm downloads are 247 between 2026-11-18 and 2026-11-20 | npm API | `api.npmjs.org/downloads/point/...` | VERIFIED as a number | **Not evidence of adoption**; new packages are fetched by mirrors and scanners |
| EV-034 | The SDK has no Wallets Kit adapter, OpenTelemetry helper or auto-capture | Source search | `sdk/wallets-kit/src` | VERIFIED (absence) | |

## 4. Stellar

| ID | Claim | Evidence type | Location | Status | Limitation |
|---|---|---|---|---|---|
| EV-040 | Sign-in verifies a signed message | Source | `session.ts:14-36` | CITED | No browser-wallet run recorded |
| EV-041 | The demo builds, signs and submits a Testnet payment | Source | `src/app/demo/page.tsx:46-70` | CITED | **No recorded run, no transaction hash** |
| EV-042 | No Soroban contract, RPC read-back or ledger verification exists | Repository search | whole repository | VERIFIED (absence) | |
| EV-043 | Testnet or Mainnet contract IDs | n/a | none (Pyxis has no contract) | **ABSENT** | Not required by the RFP |
| EV-044 | A Testnet payment is on the ledger: `9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322`, ledger 5825901 | Horizon query | [evidence/wallet/transaction-verification.md](evidence/wallet/transaction-verification.md) | VERIFIED | Self-payment, internal test |
| EV-045 | A real Varial wallet signed in; the live server passed a 14-check sign-in test (correct signature accepted, every forged variant rejected) | Screenshots; live script | [evidence/wallet/authentication-verification.md](evidence/wallet/authentication-verification.md), [forged-signature-test.md](evidence/wallet/forged-signature-test.md) | VERIFIED | Corrected v2 (first run flawed); expiry untested; no HTTP logs for the real sign-in |
| EV-046 | Six wallet funnel events stored and shown; web analytics page matches Umami | Query, screenshots, Umami API | [evidence/dashboard/dashboard-verification.md](evidence/dashboard/dashboard-verification.md) | VERIFIED | Frontend-reported; one internal visitor |

## 5. Security and privacy

| ID | Claim | Evidence type | Location | Status | Limitation |
|---|---|---|---|---|---|
| EV-050 | No critical or high application vulnerability and no cross-tenant path were found | Source audit | [security/threat-model.md](security/threat-model.md) | CITED | Read-only audit; the app and database were not attacked |
| EV-051 | No secrets in the 26 commits | Pattern scan | audit | CITED | Pattern-based |
| EV-052 | Operator reads of the wallet funnel are not audited | Source | `projects/[id]/wallet/route.ts` | VERIFIED | Contradicts README and `SECURITY.md` |
| EV-053 | Ingest error codes distinguish key states | Source | `v1/metrics/route.ts:10` | VERIFIED | Contradicts "generic errors" in the docs |
| EV-054 | No retention job exists | Source search | whole repository | VERIFIED (absence) | |
| EV-055 | No independent security audit has been performed | Absence | none | **ABSENT** | |
| EV-056 | No legal review of privacy statements exists | Absence | none | **ABSENT** | |

## 6. Operations

| ID | Claim | Evidence type | Location | Status | Limitation |
|---|---|---|---|---|---|
| EV-060 | The production guide's generic steps work on a local PostgreSQL | Commands run during this work | session record | VERIFIED then | Not repeated for this package |
| EV-061 | No Dockerfile, IaC, monitoring, alerting or backup schedule exists in the repository | Repository search | whole repository | VERIFIED (absence) | Hosting-provider features not inspected |
| EV-062 | `main` is protected (1 review, check `test`, linear history, no force push); admins may bypass | GitHub API | branch protection | VERIFIED | |
| EV-063 | Dependabot and secret scanning are enabled | GitHub settings | `.github/dependabot.yml` | CITED | |

## 7. Adoption, team and track record

| ID | Claim | Evidence type | Location | Status |
|---|---|---|---|---|
| EV-070 | Any SCF-awarded project uses Pyxis | none | none | **ABSENT** |
| EV-071 | Any external user, customer or pilot commitment | none | none | **ABSENT** |
| EV-072 | The team's SCF and SDF history and open-source maintainer record | none in the repository | to be supplied | **ABSENT** |
| EV-073 | Real wallet sign-in recorded | prompt-by-prompt screenshots (second run); first-run screenshots removed | [evidence/wallet-run/](evidence/wallet-run/README.md) | **PRESENT (2026-11-20)** |
| EV-074 | A real Umami run | Umami API and dashboard screenshot | [evidence/umami/](evidence/umami/analytics-verification.md) | **PRESENT (2026-11-20), one internal session** |
| EV-075 | A load test or availability measurement | none | to be produced | **ABSENT** |

## 8. Rule

If a new claim is added to the form answers, add its evidence here first. If the evidence is ABSENT, the claim is either removed or rewritten as a plan.
