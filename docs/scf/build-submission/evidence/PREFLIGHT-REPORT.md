# Pre-flight report: wallet and Umami verification

**Date:** 2026-11-20. **Commit inspected:** `a7df1da` (working tree). **Status:** inspection only. No wallet, transaction or analytics run has happened yet.

## Implementation map

| # | Item | Where | Finding |
|---|---|---|---|
| 1 | Wallet sign-in | `src/lib/wallet.ts` `connectAndSign`, `src/app/signin/` | Stellar Wallets Kit v2 `authModal()` then `signMessage()` on a server challenge |
| 2 | Provider | `@creit.tech/stellar-wallets-kit`, `defaultModules()` | Any supported browser wallet (Freighter etc.); the user picks in the modal |
| 3-4 | Challenge and verification | `src/server/auth/session.ts` | Server-side signature check, 7-day session (read in the earlier audit; no run recorded) |
| 5 | Network | `wallet.ts:11,16`; `demo/page.tsx:16,31,58,63,67` | **Hard-coded to Testnet** (`Networks.TESTNET`, `horizon-testnet.stellar.org`). The live app cannot send to Mainnet through these paths |
| 6-7 | Wallet SDK and lifecycle events | `sdk/wallets-kit`, `src/app/demo/page.tsx` | Vocabulary: `wallet_connect_started`, `wallet_connected`, `wallet_disconnect`, `transaction_sign_started/completed/failed`, `transaction_submit_started/completed/failed`. The demo emits all but `wallet_disconnect`, and always reports provider `other` |
| 8 | Umami deployment | `docker-compose` only | **Not deployed.** `railway variables` shows no `UMAMI_URL`, `UMAMI_USER`, `UMAMI_PASSWORD` or `UMAMI_PUBLIC_URL` |
| 9 | Tracker | `src/server/umami.ts:50` | Snippet `<script defer src="{UMAMI_PUBLIC_URL}/script.js" data-website-id data-domains>`; not version-pinned |
| 10 | Site registration | `api/v1/projects/[id]/sites/**`, `.../verify/route.ts` | Domain plus verification token, then the Umami website is created |
| 11 | Umami API client | `src/server/umami.ts` | Login with `UMAMI_USER`/`UMAMI_PASSWORD`, then reports |
| 12 | Dashboard | `.../sites/[siteId]/web/route.ts` | Returns 404 `not_ready` without `UMAMI_*` configuration |

## Environment

- Live app `web-production-3c4c1c5f.up.railway.app` and `usepyxis.xyz` return 200; `/demo` returns 200.
- **Testnet: positively identified from source.** There is no network setting to flip.
- **Umami: not running and not reachable.** The web-analytics half cannot be demonstrated against the live app until an instance is provisioned.

## What I can and cannot do from here

| Step | Can I do it? | Why |
|---|---|---|
| Wallet connect and message signature | **No** | Needs a browser wallet extension and your approval |
| Testnet payment | **No, not alone** | Needs your wallet to sign; the demo sends 1 XLM to the connected account itself |
| Query the tx on Horizon, record ledger and time | Yes | Once you give me the hash |
| Event counts in the dashboard | Partly | I can read the API after you sign in; a screenshot needs you |
| Umami run | **Blocked** | Needs provisioning and a decision (below) |

## Findings to know before the demo

1. The demo's "recipient" is the connected account itself, so no unknown address is involved.
2. The demo reports `wallet_provider: "other"` regardless of the wallet used. Expect that in the data.
3. The demo page asks for an ingest key; the key is visible in the browser, so use a dedicated one and revoke it afterwards.
4. Sign-in has no automated test, so the first real wallet run is the first evidence of it.

## Decisions needed

- **Umami:** provision a staging Umami on Railway (new service plus a database, and adding the four `UMAMI_*` variables to `web`)? This changes production configuration, so I will not do it without your approval. Pinning the tracker version would need a source change, which I will not make.
