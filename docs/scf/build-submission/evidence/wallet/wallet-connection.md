# Wallet connection

**Status:** OBSERVED (frontend-reported, with the on-chain account confirmed by Horizon).

- **App:** the standalone Testnet demo dApp <https://pyxis-demo-dapp.vercel.app/wallet> (built for this verification; separate from the Pyxis repository). Stellar Wallets Kit v2 `authModal()`, wallet approved manually by the user.
- **Time:** 2026-11-20 about 05:38 UTC.
- **Network:** Testnet (hard-coded in the demo and in `src/lib/wallet.ts`).
- **Address (public Testnet):** `GA2C7E7S6PM7DA2KL6SAFWPKU6LFPVGXVC5TWNXXJPS2HL5QUVHZ6NGP`. Exists on Testnet per Horizon.
- **Wallet provider:** not captured. The demo reported category `other`; the stored events carry `other`. The auditor does not know which wallet extension was used, so none is claimed.
- **Funding:** the page called Friendbot; Horizon shows a 05:38:50Z transaction on the account, consistent with funding.
- **Source:** `pyxis-demo-dapp/src/App.tsx` (`connect`), `@creit.tech/stellar-wallets-kit`.

Limit: wallet connection and the Pyxis sign-in signature are different things. Sign-in is covered in [authentication-verification.md](authentication-verification.md).
