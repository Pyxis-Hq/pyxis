# @pyxis-hq/wallets-kit

Privacy-first wallet funnel analytics for Stellar dApps, reporting to a [Pyxis](https://github.com/Pyxis-Hq/pyxis) server. It records **counts only**: no addresses, signatures, XDR or free text. Events are reported by the frontend and are not proof of ledger inclusion.

Zero runtime dependencies. ESM and CJS, with types. SSR-safe. About 3 kB gzipped.

## Install

```bash
npm install @pyxis-hq/wallets-kit
```

## Use

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
```

## Events

`wallet_connect_started`, `wallet_connected`, `wallet_disconnect`, `transaction_sign_started`, `transaction_sign_completed`, `transaction_sign_failed`, `transaction_submit_started`, `transaction_submit_completed`, `transaction_submit_failed`.

Providers: `freighter`, `xbull`, `albedo`, `lobstr`, `rabet`, `hana`, `ledger`, `hot_wallet`, `other`. Networks: `testnet`, `public`, `other`. `failure_category` must match `^[a-z_]{1,32}$`.

## Behaviour

- `track()` never throws and never waits on the network.
- Nothing starts until the first event, so importing during server rendering is safe.
- Honours Do Not Track and Global Privacy Control (`respectDoNotTrack`, default on). Wire `enabled` or `setEnabled()` to your consent control.
- Batches up to 20 events (max 50), flushes every 5 s and when the page is hidden (`keepalive`).
- Retries 5xx, 429 and network errors with backoff; drops other 4xx; splits a batch on 413; stops sending after 3 consecutive 401/403 (`stats().circuitOpen`).
- The queue is bounded (`maxQueue`, default 100) and held in memory only. Nothing is stored in cookies or storage.

## API

`new PyxisWallet(options)` or `createPyxisWallet(options)`; `track`, `flush`, `setEnabled`, `stats`, `destroy`, `droppedCount`, `queued`. Options: `endpoint`, `ingestKey`, `network`, `enabled`, `respectDoNotTrack`, `maxQueue`, `batchSize`, `flushIntervalMs`, `debug`, `fetchImpl`.

Status: beta (`0.1.x`). Licensed under Apache-2.0.
