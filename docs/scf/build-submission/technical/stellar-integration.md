# Stellar integration specification

**Status:** lists every actual Stellar touchpoint in the repository at commit `a7df1da`, then the Soroban gap analysis. **There is no Soroban contract, no Soroban RPC or Horizon read-back, no event indexing and no ledger verification in Pyxis today.**
**Evidence basis:** repository-wide search for `@stellar/stellar-sdk`, `stellar-wallets-kit`, Horizon, Soroban, RPC, contract and SEP references, and reading of the files cited below.
**Related:** [technical-specification.md](technical-specification.md).

## 1. Summary

| Area | Status |
|---|---|
| Wallet sign-in by signed message | IMPLEMENTED (server side verified by tests); **browser wallet flow not evidenced** |
| Stellar public-key validation | IMPLEMENTED |
| Demo dApp with real wallet connect and a testnet payment | IMPLEMENTED, NOT INDEPENDENTLY VERIFIED (no recorded run) |
| Wallet-funnel SDK with a `network` label | IMPLEMENTED; the label is declared by the client and never checked |
| Soroban smart contracts | MISSING |
| Soroban RPC, Horizon read-back, event indexing | MISSING |
| Ledger-verified transaction outcomes | MISSING |
| Testnet or Mainnet evidence (contract IDs, transaction hashes) | MISSING; none exists in the repository |

## 2. Touchpoints

### 2.1 Sign-in by signed message

| Step | Where | Notes |
|---|---|---|
| Browser connects a wallet and signs a message | `src/lib/wallet.ts:7-18` | Uses Stellar Wallets Kit v2 `authModal` and `signMessage` with the **testnet** passphrase |
| Server issues a challenge | `src/server/auth/session.ts:20-26` | 24 random bytes, 5-minute expiry, stored in `auth_challenges` |
| Message format | `session.ts:14-16` | `Pyxis sign-in (testnet)\naccount: ...\nnonce: ...\nexpires: ...` |
| Signed payload | `session.ts:17-18` | `sha256("Stellar Signed Message:\n" + message)` |
| Signature check | `session.ts:36` | `Keypair.fromPublicKey(account).verify(hash, signature)` |
| Single use | `session.ts:30-34` | `UPDATE ... SET used_at WHERE used_at IS NULL AND expires_at > now()` |

Standards: the code comments call this "SEP-43 style". SEP-43 describes the wallet interface; the `"Stellar Signed Message:\n"` hashing prefix is the **SEP-53** message-signing rule. The documents should say "SEP-53 message signing through a SEP-43 wallet interface" instead of "SEP-43 style". **(verify against the current SEP texts before citing.)**

Tests: **no Vitest suite covers sign-in** (a search of `tests/` finds no call to `createChallenge`, `verifyChallenge` or the message hash). The flow is exercised only by `scripts/e2e-smoke.mts`, a manual script run against a running server with a **generated keypair** (bad signature rejected, signed challenge accepted, replay of the same nonce rejected). CI does not run that script. **No test or record shows a real browser wallet completing the flow.** Status: IMPLEMENTED; server side exercised manually; browser path NOT INDEPENDENTLY VERIFIED.

### 2.2 Key validation

`StrKey.isValidEd25519PublicKey` guards challenge creation (`session.ts:21`) and member invitation (`src/app/api/v1/projects/[id]/members/route.ts`). The database also checks `^G[A-Z2-7]{55}$` (`001_init.sql:12`).

### 2.3 Demo dApp (`src/app/demo/page.tsx`)

Connects a wallet with Wallets Kit, funds the account through Friendbot, builds a **1 XLM self-payment** with `TransactionBuilder` on `https://horizon-testnet.stellar.org`, signs it through the wallet, submits it, and reports funnel events through `PyxisWallet`. It proves that a testnet transaction can be built, signed and submitted from this page. It does **not** prove that the events match the ledger.

Defects in the demo (they matter if it is used as evidence): the provider is hard-coded to `other` (line 44) and every signing error is reported as `user_rejected` (line 64), so the demo cannot demonstrate provider breakdown or real failure categories.

### 2.4 Network label in the SDK

`PyxisWallet` sends `network` (`testnet`, `public` or `other`) from its options (`sdk/wallets-kit/src/index.ts`). The server stores it as given. It is a label chosen by the caller, not a fact about the transaction.

### 2.5 Libraries

`@stellar/stellar-sdk` ^17.4.0 (`Keypair`, `StrKey`, `Horizon`, `TransactionBuilder`, `Networks`); `@creit.tech/stellar-wallets-kit` ^2.8.0, loaded only in the browser. `npm audit` reports vulnerabilities in the transitive tree of the wallet kit with no upstream fix (see the security documents).

## 3. Three kinds of "transaction" evidence

These are different things and must not be conflated:

| Level | Example | Available in Pyxis |
|---|---|---|
| Frontend-reported | `transaction_submit_completed` sent by the browser | Yes, as counts |
| Backend-observed | The Pyxis server sees the submit request | No |
| Network-observed | Horizon or Soroban RPC returns the transaction result | No |
| Ledger-verified | The transaction is found in a closed ledger and its operations match the request | No |

The wallet API labels its data `reported_by: "frontend"` and `verified_on_ledger: false` (`src/app/api/v1/projects/[id]/wallet/route.ts`).

## 4. Soroban integration gap analysis

Nothing in the repository touches Soroban. For each candidate feature, the questions requested by the audit brief are answered the same way for all of them:

| Feature | Implemented | Source file | SDK or RPC interface | Tested | Deployed | Evidence | Work remaining |
|---|---|---|---|---|---|---|---|
| Soroban RPC read-back of transaction outcomes | No | none | would use `rpc.Server` from `@stellar/stellar-sdk` | No | No | none | Design, implementation, tests, evidence run |
| Horizon read-back of classic transactions | No | none | would use `Horizon.Server` | No | No | none | As above |
| Contract event indexing | No | none | would use RPC `getEvents` | No | No | none | As above, plus storage and retention |
| Verified-vs-reported reconciliation of wallet funnel | No | none | needs the two above | No | No | none | Join frontend events to observed outcomes without storing addresses |
| Smart contract owned by Pyxis | No | none | n/a | No | No | none | **Not required by the web and API analytics RFP**; do not claim |
| Ecosystem observatory (public network activity) | No | none | RPC and Horizon | No | No | none | Scope and privacy design |

**The web and API analytics RFP does not require any Soroban feature.** Its Stellar-specific content is the ecosystem context, Stellar-aware route templating (`{stellar_account}`, `{contract_id}`, `{muxed_account}`) and the optional wallet funnel. The Soroban roadmap must therefore be presented as an optional extension that is subordinate to the RFP's web and API deliverables.

## 5. Evidence that does not exist

- No Testnet or Mainnet contract ID.
- No transaction hash produced by the demo and recorded in the repository.
- No recorded run of the sign-in flow with a real wallet.
- No ledger reconciliation of any funnel count.

The submission must not state otherwise. If evidence is wanted, the steps are: run the demo with a funded Testnet account, record the transaction hash from the Stellar Expert or Horizon page, and record the matching funnel counts from the dashboard at the same time.
