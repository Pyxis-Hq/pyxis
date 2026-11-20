# Traction evidence

**Status:** draft for the SCF Build form, 2026-11-20. Every statement maps to [evidence/manifests/evidence-manifest.json](evidence/manifests/evidence-manifest.json). Vocabulary: Implemented, Demonstrated, Independently verified, Published, Adopted by external users, Planned.

## A. Live MVP: Implemented, Published
Pyxis runs at <https://usepyxis.xyz> with documentation at <https://docs.usepyxis.xyz>; source is public under Apache-2.0 at <https://github.com/Pyxis-Hq/pyxis>. CI is green for commit `a7df1da`; 80 automated tests pass. Created 2026-11-18; one author.

## B. Real Stellar wallet authentication: Demonstrated
On 2026-11-20 a real Varial wallet (Testnet) signed in to usepyxis.xyz: the app presented a one-time message, the wallet signed it with manual approval, and the protected projects page opened ([screenshots](evidence/wallet/screenshots/)). A cancelled attempt left the user signed out. A live negative test with throwaway keys then confirmed the server rejects forged, altered, wrong-key, malformed, replayed and cross-account signatures (12 of 12 checks, [report](evidence/wallet/forged-signature-test.md)). Limits: challenge expiry was not tested; no HTTP logs were captured for the real sign-in. See [wallet/authentication-verification.md](evidence/wallet/authentication-verification.md).

## C. Stellar Testnet transaction: Demonstrated, Independently verified
One real 1 XLM Testnet payment (account to itself) through a connected wallet is on the ledger: hash `9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322`, ledger 5825901, successful. Explorer: <https://stellar.expert/explorer/testnet/tx/9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322>. Testnet only; internal test; no Mainnet transaction exists.

## D. Published wallet SDK: Published
`@pyxis-hq/wallets-kit@0.1.0-beta.1` is on npm. In the run above its browser SDK reported six funnel events, which the Pyxis server stored as counts with no address, signature or XDR. Those events are frontend-reported; only the transaction in C is ledger-verified.

## E. Real Umami analytics session: Demonstrated
A real Umami 2.20.2 instance was deployed. Pyxis verified a domain and created the Umami website itself. A controlled internal browser session produced 7 page views, 1 visitor, a custom event and device and country data in Umami. See [evidence/umami/analytics-verification.md](evidence/umami/analytics-verification.md). Not external traffic.

## F. Dashboard verification: partial
The Pyxis web analytics page shows 7 page views, 1 visitor, 0.0% bounce, 16 s average session, country NG, Edge and laptop. These match the values read from Umami's own API ([screenshot](evidence/dashboard/screenshots/pyxis-web-analytics.png)). The wallet funnel page shows the six events once each with 0 failures and states "Frontend-reported, not ledger-confirmed" ([screenshot](evidence/dashboard/screenshots/pyxis-wallet-funnel.png)); it matches the stored counts. The API metrics page correctly shows 0 requests because no API data was sent.

## G. External adoption and pilots: none
**No external project has onboarded.** No letters of intent, pilots, customers or external users exist. The npm download count (247 on 2026-11-20) is not evidence of adoption. All runs above are internal tests.

## Wording for the form
"Pyxis is live at usepyxis.xyz (open source, Apache-2.0, 80 passing tests). In an internal Testnet demonstration, a real wallet connected to a demo dApp, submitted a Testnet payment confirmed on the ledger (hash and explorer link), and reported its funnel through our published SDK; a real Umami instance recorded a controlled browser session. We have no external adopters yet; onboarding SCF projects is the purpose of this proposal."
