# @pyxis-hq/wallets-kit

[![npm](https://img.shields.io/npm/v/@pyxis-hq/wallets-kit)](https://www.npmjs.com/package/@pyxis-hq/wallets-kit)
[![license](https://img.shields.io/npm/l/@pyxis-hq/wallets-kit)](https://github.com/Pyxis-Hq/pyxis/blob/main/LICENSE)
[![types](https://img.shields.io/npm/types/@pyxis-hq/wallets-kit)](https://www.npmjs.com/package/@pyxis-hq/wallets-kit)

**Privacy-first wallet analytics for Stellar and Soroban dApps.** See where users drop off when they connect a wallet, sign a transaction or submit it, without collecting a single address, signature or line of free text. Events are sent to a [Pyxis](https://github.com/Pyxis-Hq/pyxis) server and stored as counts.

- Works with Freighter, xBull, Albedo, LOBSTR, Rabet, Hana, Ledger and Hot Wallet, or any other (`other`).
- Zero runtime dependencies. ESM and CJS, with TypeScript types. About 3 kB gzipped.
- Vanilla JavaScript or React. Safe to import during server-side rendering.
- Honours Do Not Track and Global Privacy Control. Nothing is stored in cookies or storage.

Events are reported by the frontend. They show what the browser says happened and are **not** proof that a transaction reached the ledger.

## Install

```bash
npm install @pyxis-hq/wallets-kit
```

## Quick start

```ts
import { createPyxisWallet } from "@pyxis-hq/wallets-kit";

const pyxis = createPyxisWallet({
  endpoint: "https://your-pyxis.example/v1/wallet-events",
  ingestKey: "pyx_live_...", // a write-only ingest key from your Pyxis project
  network: "public",
});

pyxis.track("wallet_connect_started");
pyxis.track("wallet_connected", { wallet_provider: "freighter" });
pyxis.track("transaction_sign_failed", { wallet_provider: "freighter", failure_category: "user_rejected" });
```

React:

```tsx
import { PyxisProvider, usePyxis } from "@pyxis-hq/wallets-kit/react";

<PyxisProvider endpoint="..." ingestKey="..." network="public"><App /></PyxisProvider>;

const { track } = usePyxis();
track("wallet_connect_started");
```

## What it records

| Event | When |
|---|---|
| `wallet_connect_started`, `wallet_connected`, `wallet_disconnect` | Connecting and disconnecting a wallet |
| `transaction_sign_started`, `transaction_sign_completed`, `transaction_sign_failed` | Signing a transaction |
| `transaction_submit_started`, `transaction_submit_completed`, `transaction_submit_failed` | Submitting a transaction |

Providers: `freighter`, `xbull`, `albedo`, `lobstr`, `rabet`, `hana`, `ledger`, `hot_wallet`, `other`. Networks: `testnet`, `public`, `other`. `failure_category` must match `^[a-z_]{1,32}$`.

It **never** accepts or sends wallet addresses, signatures, transaction XDR or free text. The server also rejects any such property.

## Behaviour

- `track()` never throws and never waits on the network.
- Nothing starts until the first event, so importing during server rendering is safe.
- Honours Do Not Track and Global Privacy Control (`respectDoNotTrack`, default on). Wire `enabled` or `setEnabled()` to your consent control.
- Batches up to 20 events (max 50), flushes every 5 s and when the page is hidden (`keepalive`).
- Retries 5xx, 429 and network errors with backoff; drops other 4xx; splits a batch on 413; stops sending after 3 consecutive 401/403 (`stats().circuitOpen`).
- The queue is bounded (`maxQueue`, default 100) and held in memory only.

## API

`new PyxisWallet(options)` or `createPyxisWallet(options)`; `track`, `flush`, `setEnabled`, `stats`, `destroy`, `droppedCount`, `queued`. Options: `endpoint`, `ingestKey`, `network`, `enabled`, `respectDoNotTrack`, `maxQueue`, `batchSize`, `flushIntervalMs`, `debug`, `fetchImpl`.

Full reference: <https://docs.usepyxis.xyz/docs/reference/sdk>. Guide: <https://docs.usepyxis.xyz/docs/guides/wallet-funnel>.

## Links

- Documentation: <https://docs.usepyxis.xyz>
- Source and issues: <https://github.com/Pyxis-Hq/pyxis>

Status: beta (`0.1.x`). Licensed under Apache-2.0.
