# Final verification report

**Date:** 2026-11-20. **Auditor:** Claude (AI), working with the team. **Scope:** a real wallet and Testnet transaction, and a real Umami session, against the existing Pyxis implementation. Nothing was committed, pushed or submitted.

## 1. Summary
| Area | Outcome |
|---|---|
| Wallet connection (Testnet) | Observed |
| Pyxis wallet sign-in | **Observed** with a real Varial wallet (screenshots); user-cancelled attempt observed; server-side forged-signature rejection not demonstrated |
| Testnet transaction | **Ledger-verified** |
| Wallet SDK events | **Stored by Pyxis**, frontend-reported |
| Umami integration | Deployed; Pyxis created a website through it |
| Browser analytics | **Observed in Umami** |
| Pyxis dashboard | Web analytics and wallet funnel **verified** (screenshots) |
| Soroban | Not implemented; future scope, not a failure |

## 2-5. Wallet, authentication, transaction
- Connection: account `GA2C7E7S6PM7DA2KL6SAFWPKU6LFPVGXVC5TWNXXJPS2HL5QUVHZ6NGP` on Testnet at about 05:38 UTC. Wallet brand not captured.
- Authentication: Varial wallet, account `GB7H…65E5`, challenge issued about 05:48:04 UTC, signature approved manually, `/projects` reached; a second attempt cancelled by the user. See [authentication-verification.md](wallet/authentication-verification.md). Forged, altered, wrong-key, malformed, replayed and cross-account signatures were rejected by the live server in a 12-check test ([forged-signature-test.md](wallet/forged-signature-test.md)); challenge expiry was not tested.
- Transaction: hash `9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322`, ledger 5825901, 2026-11-20T05:39:05Z, successful, one `payment` operation of 1 XLM from the account to itself, fee 100 stroops. Verified directly on Horizon. Link: <https://stellar.expert/explorer/testnet/tx/9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322>.

## 6. Wallet SDK events
Vocabulary (9): `wallet_connect_started`, `wallet_connected`, `wallet_disconnect`, `transaction_sign_started/completed/failed`, `transaction_submit_started/completed/failed`. Stored, each once: connect_started, connected, sign_started, sign_completed, submit_started, submit_completed. Not exercised: `wallet_disconnect` and the three failure events. Events are frontend-reported and are not proof of ledger inclusion; the transaction in section 5 is. The server stores only name, provider category, network and count. Provider was recorded as `other`, so wallet-brand breakdown was not demonstrated.

## 7-8. Umami and browser analytics
Umami 2.20.2 on Railway; website `e23233f9-a2fe-4aad-ba10-5908704cce83`; session 05:37:30 to 05:37:47 UTC. Observed: 7 page views, 1 visitor, 1 visit, 16 s total time, 0 bounces, Edge/Windows/laptop, country NG, no referrer, 10 `demo_cta_click` events. **Not observed:** referrers, returning visitors, anything external. Details: [analytics-verification.md](umami/analytics-verification.md).

## 9. Dashboard
The Pyxis web analytics page (screenshot `dashboard/screenshots/pyxis-web-analytics.png`) matches the Umami API on all eight displayed values. The API metrics page (screenshot) shows 0 requests, an honest empty state. The Wallet funnel page (screenshot `pyxis-wallet-funnel.png`) shows the six events once each with 0 failures and the warning "Frontend-reported, not ledger-confirmed", matching the stored counts. The page copy says "pinned, self-hosted Umami", which overstates the unpinned tracker (DOC-03). The signed-in account (`GB7H…65E5`) differs from the demo wallet.

## 10. Privacy observations
Wallet events carry no address, signature or XDR (server allowlist). Umami stored city and region for the session; IP storage was not tested. Tracker network requests were not inspected, so the "no secrets leave the browser" claim for the tracker is not demonstrated. No compliance claim is made.

## 11. Failed, blocked or corrected items
- Earlier partial hashes `f164d628d3…` and `45411ec9af…` are unverified and not used.
- An earlier statement that "Pyxis recorded no events" was wrong and is withdrawn; it relied on `last_used_at`, which the wallet endpoint never updates, and was checked before the run happened.
- Challenge expiry untested; no HTTP or backend log capture for the real sign-in; no failure-path wallet events, no screenshot timestamps.

## 12. Remaining limitations
One-person internal tests. Umami is a demonstration instance without backups or monitoring and its tracker file is not version-pinned. Security of the Umami default password window (about a minute) is disclosed in the deployment note. No external adoption exists.

## 13. Evidence inventory
See [README.md](README.md) and [manifests/evidence-manifest.json](manifests/evidence-manifest.json): 9 items (5 verified or observed, 3 not recorded or not verified, 1 unverified).

## 14. Traction wording
See [../traction-evidence.md](../traction-evidence.md).
