# Testnet transaction verification (ledger-verified)

**Verified:** 2026-11-20 by the auditor, directly against Stellar Testnet Horizon, independent of the demo page.
**Status:** VERIFIED.

| Field | Value |
|---|---|
| Network | Stellar Testnet. Passphrase from `horizon-testnet.stellar.org/`: `Test SDF Network ; September 2015` |
| Hash | `9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322` |
| Explorer | <https://stellar.expert/explorer/testnet/tx/9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322> |
| Result | `successful: true` |
| Ledger | 5825901 (closed 2026-11-20T05:39:05Z; Horizon `created_at` is the same) |
| Source account | `GA2C7E7S6PM7DA2KL6SAFWPKU6LFPVGXVC5TWNXXJPS2HL5QUVHZ6NGP` (public Testnet address) |
| Operations | 1: `payment`, native asset (XLM), amount `1.0000000`, from the source account **to itself** |
| Fee charged | 100 stroops; memo none |
| Account history | Two transactions: `71cfaff5d3…` in ledger 5825898 (05:38:50Z; funding, consistent with Friendbot) and this one |

## Separate lifecycle steps (not one claim)

| Step | Observed by | Result |
|---|---|---|
| Wallet connection | Demo page log, frontend | Connected, provider category `other` |
| Transaction signing | Demo page log, frontend | User approved in the wallet |
| Submission | Demo page log and Horizon | Hash returned by Horizon |
| Ledger confirmation | **Auditor, Horizon query** | Included, ledger 5825901, successful |

## Notes and limits
- The recipient is the sender. This is a harmless self-payment and not a transfer between parties.
- The browser log shows 05:38:37Z for the ledger check while the ledger closed at 05:39:05Z. The browser clock was about 28 seconds behind. Server and ledger times are used as the reference everywhere.
- The two earlier partial hashes the team gave (`f164d628d3…`, `45411ec9af…`) are **not** on this account (only the two transactions above exist). They stay **UNVERIFIED** and are not used in any claim.
- A Testnet transaction shows a working integration. It is not production use, adoption or Mainnet evidence.
