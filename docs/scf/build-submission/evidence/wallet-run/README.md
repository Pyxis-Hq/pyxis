# Wallet run (real wallet, Testnet) - 2026-11-20

**Wallet:** Varial (the Freighter-lineage Stellar wallet; its extension ID is the one formerly used by Freighter, and the wallet picker lists it as "Varial", not "Freighter"). **Browser:** Chrome 158 in a **dedicated profile** (`pyxis-chrome-profile`), launched normally and driven over the DevTools protocol, so the wallet extension worked. The user unlocked the wallet and clicked every Approve/Reject themselves; automation never touched the wallet popups. **Account:** `GDRF…RN33` (a fresh demo account, public Testnet address).

## Timeline (UTC server clock; the capture machine's clock ran about 30 s behind)
| What | Result |
|---|---|
| Sign-in at usepyxis.xyz | Connection request and sign-in message approved in the wallet; `/projects` reached (screenshots 08b, popups 16, 17) |
| New project and ingest key | Created through the API (project "Wallet demo project") |
| Connect on the demo dApp (`pyxis-capture-site.vercel.app/wallet`) | Connection approved (popup 18); account shown as connected |
| 1 XLM payment to the same account | Approved in the wallet (popup 19: Test Net, fee 0.00001 XLM). **Hash `4494c75d7eb60b978288c1f088e19d54fb6a20461f97db3aca659958b32f831c`, ledger 5,829,245, 10:17:45Z, successful** |
| Disconnect, reconnect, second payment | Second payment **rejected in the wallet**; the dApp logged "Signing rejected." and no transaction was created |
| Wallet funnel page | Connect started 2, Connected 2, Sign started 2, **Signed 1**, Submit started 1, Submit reported OK 1, **Failures reported 1**, with the "Frontend-reported, not ledger-confirmed" banner (screenshot 15) |

## Independent verification (Horizon Testnet, by the auditor)
- The transaction is successful, one `payment` of 1.0000000 XLM from the account to itself, fee 100 stroops, network passphrase `Test SDF Network ; September 2015`.
- The account has three transactions: the funding create_account at 10:09:35Z (before this run), this payment, and a **10,000 XLM payment from the Friendbot account at 10:18:10Z**. The third was triggered by the demo dApp, which calls Friendbot on every connect (the reconnect topped the account up). It is not a payment the user signed.
- The rejected payment produced no transaction.

## Limits and corrections
- Internal test; one wallet, one account. The funnel events are frontend-reported; only the Horizon query proves the payment.
- The dApp reports the provider category as `other` for every wallet.
- **Secret exposure caught and fixed:** my harness tried to show the ingest key as dots, but the page re-rendered and screenshots 11a, 12a and 13 showed the full key in plain text. They were masked in place, the key (`95c1f6bf6b155758`) was **revoked** (HTTP 200), and nothing had been committed or pushed. The masks also cover the connected address.
- The raw desktop recording was **deleted**: it also captured other windows (another Chrome window with tabs, and the editor with this conversation). Only four clean popup frames were kept (screenshots 16-19); the sign-in message popup has its account line masked in the video.
- Playwright's own Chrome launch hid the wallet extension (the picker showed "Install"), which is why the run attaches to a normally launched Chrome.
