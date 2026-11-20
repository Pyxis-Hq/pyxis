# Pyxis wallet authentication

**Status:** OBSERVED (successful sign-in with a real wallet, screenshots) plus a user-cancelled attempt, and server-side rejection of forged, altered, malformed and replayed signatures **tested live** (12 of 12). Challenge expiry and a successful-signature replay were not tested.
**Date:** 2026-11-20. **App:** <https://usepyxis.xyz/signin>. **Network:** Testnet.

## Sequence (screenshots in `screenshots/`)

| # | File | What it shows |
|---|---|---|
| 1 | `01-signin-page.png` | Sign-in page: "Connect a Stellar wallet set to Testnet and sign a one-time message. No transaction is sent and no funds move." Team time: about 06:47 WAT (05:47 UTC) |
| 2 | `02-wallet-modal.png` | Stellar Wallets Kit modal listing Varial, Albedo, xBull, LOBSTR, MetaMask and others |
| 3 | `03-varial-sign-message.png` | The **Varial** wallet asks to sign a message from `usepyxis.xyz`: `Pyxis sign-in (testnet)`, `account: GB7HKG4RRC…`, a nonce, `expires: 2026-11-20T05:53:04.033Z`. Wallet `GB7H…65E5`, network Test Net. Page shows "Waiting for your wallet…" |
| 4 | `04-projects-after-signin.png` | After confirming: the protected `/projects` page, signed in as `GB7H…65E5`, listing two projects the account owns (Nextellar, Demo Project) |
| 5 | `05-signin-cancelled.png` | Second attempt, cancelled by the user (about 06:48 WAT): "Sign-in was cancelled or failed. Try again." The user stays on `/signin` |

## What this establishes
- **Wallet:** Varial (identified from the popup). Account `GB7H…65E5` (public Testnet address, shown truncated in the screenshots).
- **Timing:** the challenge message embeds its expiry. The server's challenge lifetime is 5 minutes (`CHALLENGE_TTL_MS` in `src/server/auth/session.ts`), so the challenge was issued at about **05:48:04 UTC**. That is a server-derived time; the 06:47 WAT note is the team's approximate recollection.
- **Flow:** connect (wallet modal), server challenge, message signature approved manually in the wallet, session created, protected area reachable. Connection, signature and session are distinct steps in the images.
- The message contains the account, a nonce and an expiry, and says explicitly that no transaction is sent.
- The cancelled attempt leaves the user signed out with a generic, non-revealing message and no session.

## Server-side negative test
Image 5 is a client-side cancel (no signature reached the server). The server-side rejection was tested separately: [forged-signature-test.md](forged-signature-test.md), 12 of 12 checks passed on the live app (forged, altered, wrong-key, malformed, unknown, replayed and cross-account all rejected). Expiry was not tested.

## What this does not establish
- The 200 responses, session cookie and backend logs were not captured.
- Screenshots carry no browser-visible timestamp; times above come from the team and the embedded expiry.
- The account used for this sign-in (`GB7H…65E5`) differs from the wallet in the demo dApp (`GA2C…6NGP`). The wallet used on the demo dApp was not identified.
- No claim is made about the nonce being single-use from these screenshots; that comes from source (`used_at IS NULL` in the update at `session.ts:31`) and the manual script only.

## Remaining gap
Challenge expiry (5 minutes) and a replay of an accepted signature were not tested.
