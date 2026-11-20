# Dashboard verification

**Status:** VERIFIED for web analytics and wallet funnel (screenshots, cross-checked with Umami and the stored counts). Sign-in recording and API analytics remain open.

## Wallet funnel: stored counts (read-only query of `wallet_event_buckets`, 2026-11-20, window 36 hours)

Project `Demo Project`, network `testnet`, provider category `other`, every bucket count 1:

| Bucket (UTC, server) | Event | Provenance |
|---|---|---|
| 05:38 | `wallet_connect_started` | frontend-reported |
| 05:38 | `wallet_connected` | frontend-reported |
| 05:38 | `transaction_sign_started` | frontend-reported |
| 05:39 | `transaction_sign_completed` | frontend-reported |
| 05:39 | `transaction_submit_started` | frontend-reported |
| 05:39 | `transaction_submit_completed` | frontend-reported; the transaction is separately ledger-verified |

- This matches what the SDK reported (`sent: 5`, later 6 after the last flush, `dropped 0`, `rejected 0`).
- Not generated: `wallet_disconnect` (not clicked), and any failed-path event.
- No address, signature or XDR is stored: the table has only name, provider, network and count.
- The data is **real but from a single internal test**, not synthetic and not external.
- **Correction:** an earlier note said no events existed. That check ran before this session and used `last_used_at`, which the wallet endpoint never updates (only the metrics endpoint does). The 05:38 events above are the first real run.

## Web analytics page: VERIFIED against Umami (screenshot)
File: `screenshots/pyxis-web-analytics.png`, captured by the team on 2026-11-20 after the session (about 06:40 local time; no timestamp is visible in the image), from `usepyxis.xyz` for project "Demo Project", site `pyxis-demo-dapp.vercel.app` shown as Verified. Real data, not seeded.

| Pyxis shows | Umami API (read by the auditor) | Match |
|---|---|---|
| Page views 7 (last 7 days) | 7 | Yes |
| Unique visitors 1 | 1 | Yes |
| Bounce rate 0.0% | 0 bounces of 1 visit | Yes |
| Avg session 16 s | totaltime 16 s, 1 visit | Yes |
| Country NG 1 | NG 1 | Yes |
| Browser edge-chromium 1 | edge-chromium 1 | Yes |
| Device laptop 1 | laptop 1 | Yes |
| Referrers: none | none | Yes |

Observations: the page copy says "pinned, self-hosted Umami". The server image is pinned to a tag, but the tracker snippet has no version, so the wording overstates it (see DOC-03). The dashboard does not show custom events or OS. The sidebar shows the signed-in account as `GB7H…65E5`, which is **not** the demo dApp wallet (`GA2C…6NGP`), so the sign-in and the demo used different accounts. This also confirms an authenticated session on the live app but is not a recorded sign-in.

## API metrics page (screenshot)
File: `screenshots/pyxis-api-metrics-overview.png`. Shows the Demo Project with **0 requests** and empty latency and status panels, and the onboarding checklist at "2 of 4 done". No API (OTLP) data was sent in this test. This is honest empty state, not a failure, and it is not API-analytics evidence.

## Wallet funnel page: VERIFIED (screenshot)
The first-run screenshot (project "Demo Project", range 7d) was removed because it showed unrelated browser tabs and has been deleted; the figures below come from the stored counts above and match what it showed. The second run's funnel is in `../wallet-run/screenshots/15-wallet-funnel.png`.
- Shows Connect started 1, Connected 1, Sign started 1, Signed 1, Submit started 1, Submit reported OK 1 (each step 100% of the one above), Failures reported 0. This equals the six stored buckets queried above.
- The page carries the warning "Frontend-reported, not ledger-confirmed" and "Event counts only. No addresses, signatures or transactions are stored." The labelling matches the provenance used in this evidence.
- No `wallet_disconnect` row is displayed (the page does not list it), and the failure count is an aggregate of 0.

## Still not captured
- A recorded wallet sign-in and a rejected-signature test.
- Screenshot timestamps (none visible in any image).
