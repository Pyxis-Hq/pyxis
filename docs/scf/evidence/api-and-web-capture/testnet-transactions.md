# Testnet transactions

**Network:** Stellar Testnet only. **Mainnet was not used.**

## This capture session
**No transaction was created or submitted.** The browser had no wallet extension, no wallet approval was available, and signing was never bypassed. No Friendbot funding was requested and the Stellar CLI (28.0.0, installed) was not used. The throwaway signing key used for sign-in was never funded and never signed a transaction.

## Transaction shown in the video (from the earlier team session)
| Field | Value |
|---|---|
| Network | Stellar Testnet (`Test SDF Network ; September 2015`) |
| Type | One `payment` operation, native XLM, 1.0000000, account to itself (`GA2C…6NGP`) |
| Submitted | Yes, through the demo dApp with a real browser wallet, approved manually by the team |
| Hash | `9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322` |
| Ledger | 5,825,901, closed 2026-11-20T05:39:05Z, `successful: true`, fee 100 stroops |
| Independently verified | **Yes**, by querying Horizon Testnet directly (not through the demo page): [wallet/transaction-verification.md](../wallet/transaction-verification.md) |
| Explorer | <https://stellar.expert/explorer/testnet/tx/9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322> |

## Limitations
- Self-payment on Testnet; an integration test, not usage or adoption. Wallet-funnel events from that run are **frontend-reported** and are not proof of the transaction; only the Horizon query is.
- A connected wallet and a sign-in signature are not on-chain events. Only this one payment is.
