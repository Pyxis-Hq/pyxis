# Evidence directory

Real-run evidence for the Pyxis SCF Build submission, collected 2026-11-20. Start with [FINAL-VERIFICATION-REPORT.md](FINAL-VERIFICATION-REPORT.md). Earlier planning: [PREFLIGHT-REPORT.md](PREFLIGHT-REPORT.md).

| Area | Files |
|---|---|
| Wallet and Testnet | [wallet-connection](wallet/wallet-connection.md), [authentication-verification](wallet/authentication-verification.md), [testnet-transaction](wallet/testnet-transaction.md), [transaction-verification](wallet/transaction-verification.md) |
| Umami | [umami-deployment-verification](umami/umami-deployment-verification.md), [browser-session](umami/browser-session.md), [analytics-verification](umami/analytics-verification.md) |
| Dashboard | [dashboard-verification](dashboard/dashboard-verification.md) |
| Logs | [activity log](logs/relevant-browser-console.log), [check outputs](logs/relevant-server-logs.txt) (not raw server logs) |
| Index | [evidence-manifest.json](manifests/evidence-manifest.json) |

Screenshots: `dashboard/screenshots/` holds three genuine team captures (web analytics, API metrics overview, wallet funnel). `wallet/screenshots/` holds five sign-in captures. `umami/screenshots` is **empty**. Do not describe missing ones as existing.

Provenance labels used throughout: **frontend-reported** (sent by the browser SDK), **ledger-verified** (read back from Horizon by the auditor), **server-stored** (read from the Pyxis or Umami store by the auditor).
