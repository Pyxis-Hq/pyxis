# Submission readiness

**Status:** checklist of what the SCF Build submission needs and what is still missing, as of 2026-11-20 (updated after the real wallet and Umami runs in [evidence/](evidence/README.md)). **Overall: not ready to submit.** The technical package is ready for review; the items the application can be rejected on (eligibility, adoption, the team, the form's media fields) are not.
**Related:** [form-answers.md](form-answers.md), [FINAL-AUDIT-REPORT.md](FINAL-AUDIT-REPORT.md), [03-rfp-requirements-matrix.md](03-rfp-requirements-matrix.md).

Legend: **READY** (can be used as is) · **DRAFT** (written, needs team review) · **MISSING** (must be created) · **BLOCKED** (needs a decision or a third party).

## 1. Eligibility and track record (decides viability)

| # | Item | Status | Action |
|---|---|---|---|
| 1 | Proposer known to SCF; SCF and SDF history; open-source maintainer record (RFP) | **BLOCKED** | Team supplies verifiable history. Without it the application may be ineligible regardless of the code |
| 2 | The named submitter, representative and entity (or individuals) | **MISSING** | Decide submitter type; KYC or KYB readiness for every contributor |
| 3 | Open round for this RFP | **BLOCKED** | The RFP page gives no round; SCF #46 (Nov 8) has passed. Ask SCF or read the live form |

## 2. Form fields

| Field | Status | Note |
|---|---|---|
| A1-A4, A6, A8 | **DRAFT** | In [form-answers.md](form-answers.md) |
| A5 Project type | **DRAFT** | Confirm the live option list |
| A7 Architecture document | **DRAFT, link dead until pushed** | Commit and push `docs/scf/build-submission/`; test in a private window |
| A9 Video | **MISSING** | Script in form-answers; real runs now exist to show (sign-in, Testnet payment, funnel, web analytics); label as an internal demonstration |
| A10 Products and services | **DRAFT** | Written to the funded scope; "exists today" lines updated with the 2026-11-20 evidence |
| A11 Traction evidence | **DRAFT, improved but internal only** | Live product, repository, npm, tests **plus** real wallet sign-in, a ledger-verified Testnet payment, the wallet funnel and a real Umami session (all internal tests, see [traction-evidence.md](traction-evidence.md)). User validation and pilots are still missing |
| A12-A13a | **BLOCKED** | Team input |
| A14 Thumbnail | **MISSING** | 16:9 image |
| A15-A17 Team | **BLOCKED** | Team input; do not reuse another project's team text |
| B Budget and tranches | **DRAFT** | Needs rate, quotes and the availability decision |
| C Legal acknowledgements | **BLOCKED** | The applicant must read and accept; counsel recommended |

## 3. Evidence the application is stronger with (create before submitting)

| Evidence | Effort | Why |
|---|---|---|
| A recorded real-wallet sign-in and a Testnet demo run with a transaction hash | **DONE 2026-11-20** | Varial sign-in (second run, every prompt screenshotted), 14-check live sign-in test (positive control included), ledger-verified payment `9909a163…0322` (ledger 5825901). Internal only; expiry untested ([evidence](evidence/FINAL-VERIFICATION-REPORT.md)) |
| A real Umami run against the code, with the result recorded | **DONE 2026-11-20 (one session)** | Umami 2.20.2; Pyxis created the website; Pyxis page matched Umami's API. Not in CI; referrers and custom events not shown by Pyxis; the demonstration instance has no backups or monitoring |
| Letters of intent from SCF-awarded projects | Weeks, third parties | The RFP requires adoption proof; intent letters show a plan |
| An honest availability position and a costed hosting plan | Days | The RFP evaluates SLA realism |
| Proof of the team's SCF and SDF history | Days | Eligibility |

## 4. Quick fixes that remove avoidable credibility damage

These contradict the project's own documents. They are small, but **this audit did not change any file outside `docs/scf/build-submission/`**, so the team must decide and make them:

| Item | Fix |
|---|---|
| DOC-01 | Reword "generic errors" in `TECHNICAL.md` and `SECURITY.md`, or make the ingest codes generic (SEC-08) |
| DOC-02 and SEC-03 | Either add the missing operator audit row for `/wallet` or correct "every access is audited" in `README.md` and `TECHNICAL.md` |
| DOC-03 | **FIXED** after the screenshots were taken: the "pinned" wording was removed from the web analytics page, the landing page, the README intro and the `src/server/umami.ts` comment. The dashboard screenshot in `evidence/dashboard/` still shows the old wording because it predates the fix. Remaining: `TECHNICAL.md` and the compose file still say `latest`/unpinned |
| New: sign-in abuse | The unauthenticated challenge endpoint writes a row per call with no rate limit; list rate limiting as a planned deliverable (already in tranche 1.2) |
| New: wallet provider | The demo dApp reports every wallet as `other`; either map the wallet module to a provider or do not claim a per-wallet breakdown |
| DOC-04 | State the measured advisory count (22, 10 high) in `SECURITY.md` and the docs site |
| DOC-05 | Say "SEP-53 message signing through a SEP-43 wallet interface" after checking the SEP texts |
| DOC-06 | Align `docs/rfp-acceptance-matrix.md` with the stricter statuses in this package (G6, A1, A7, D4, D6) |
| DOC-07 | Update "alpha SDK" in `TECHNICAL.md` |

## 5. Technical hygiene before a reviewer opens the repository

| Item | Status |
|---|---|
| Public repository with licence and README | **READY** |
| CI green on `main` | **READY** (run 44662475801) |
| Documentation site | **READY** (live) |
| `docs/scf/build-submission/` committed and pushed (now including `evidence/`, dashboard and wallet-run screenshots, and `traction-evidence.md`) | **MISSING** (created, not committed, as instructed) |
| The demo dApp (`scf-rfp-projects/pyxis-demo-dapp`, live at pyxis-demo-dapp.vercel.app) | **DECISION**: it is outside the repository; commit it (for example under `examples/`) or state that it is a separate demonstration |
| Demonstration Umami on Railway (`umami`, `umami-db`) | **DECISION**: keep, or replace with the production plan; rotate its `APP_SECRET` (it appeared in a command output) and add backups before relying on it |
| Package on npm with a README | **READY** |
| No secrets or personal data in git | **READY** (pattern scan found none) |
| Open-source governance basics (maintainers file, code of conduct, `CODEOWNERS`, changelog) | **MISSING** |

## 6. Decisions the team must make

1. Is the team's SCF and SDF history strong enough for the RFP's eligibility rule? If not, wait and build it.
2. Which availability position: design for 99.99% and 99.90%, or propose lower measurable targets with a path up?
3. Who holds the maintainer, hosting and security-response roles, and for how long (12 months after the final tranche)?
4. Which questions to put to SCF before submitting (five are listed in form-answers).
5. ~~Whether to run Umami for real and record a real-wallet session before submitting.~~ Done on 2026-11-20 (internal evidence). Remaining: whether to repeat with a second, external-looking site that has referrers, and whether to test challenge expiry.

## 7. Recommendation

Do not submit yet. The real-wallet and real-Umami evidence now exists, so the technical case is stronger, but the deciding items are unchanged: eligibility and SCF history (section 1), adoption proof, the availability position, the team text, the video and thumbnail. Make the quick fixes in section 4 (the "pinned" claims especially, because the evidence shows they overstate), commit the package, resolve eligibility, then submit with a modest, effort-based budget and the cut line in the roadmap. A truthful application that shows what is missing and a credible plan scores better than one that claims more than the code can show.
