# Testnet transaction: what was submitted

**Status:** OBSERVED and ledger-verified. Details in [transaction-verification.md](transaction-verification.md).

- **Flow:** the demo dApp builds a payment with `@stellar/stellar-sdk`, shows a confirmation naming network and source account, asks the wallet to sign, submits to Horizon Testnet, then reads the transaction back from Horizon.
- **Transaction:** 1 XLM, source account to itself (the recipient is controlled by the same user). Fee 100 stroops.
- **Approval:** the user confirmed in the page dialog and approved signing in the wallet. The auditor did not sign anything and never saw a key.
- **Hash:** `9909a163c03a8ecc3e725b559656e10c22cc0bcb55dc136d4672b8f765540322`, ledger 5825901.

The existing Pyxis app (`/demo`) has an equivalent flow. This run used a separate app so that production code was not changed.
