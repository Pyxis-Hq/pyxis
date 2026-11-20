# Feature status (as observed on 2026-11-20)

## Verified working (observed in this session)
- Wallet-signature sign-in endpoint: a correct signature is accepted and a session is created (positive control).
- Project creation, ingest-key creation and **revocation** (UI shows Revoked; the next request returns 401 `auth_revoked`).
- **OTLP/HTTP JSON ingestion from a stock OpenTelemetry Node SDK** using the documented settings. 270 of 270 requests arrived with the correct status-class split. Percentiles, volume chart and endpoint table render from the data.
- Empty-state dashboard before any data (no pre-loaded sample data in a new project).
- Web analytics: site registration, domain verification by well-known file, automatic Umami website creation, tracker script, real page views from a real browser session, and a dashboard that **matches Umami's own API** on page views, visitors, bounce rate, average session, country, browser and device.

## Partially verified
- **Route naming.** Works when a framework instrumentation sets `http.route` (Express: `/accounts/:account`). With plain Node `http` instrumentation every route appears as `/_unmatched`, although the API metrics guide says the URL path is used and normalized when `http.route` is missing. Documentation and behaviour disagree.
- **Wallet funnel.** Verified earlier the same day from the team's own run (six events stored and displayed, "frontend-reported" warning shown). Not repeated in this session (no wallet).
- **Time-range filters** (1h, 24h, 7d) and the endpoint filter box were exercised in the recording; their results were not individually checked.
- **Wallet SDK.** Documentation page captured; the SDK ran in the earlier demo dApp, not in this session.
- **Referrers and custom events.** Referrers untested (direct visit). Umami recorded a custom event, but Pyxis does not display custom events.

## Not demonstrated / needs further implementation
- Wallet connection, signing and any Testnet payment **in this session**; wallet failure events.
- OTLP protobuf, gzip, rate limiting, retention, load behaviour.
- Soroban or any contract/ledger observability (not implemented).
- npm package page capture (blocked by Cloudflare).
- Any external adopter, pilot or non-internal traffic.

## Issues found (not fixed; no application code was changed)
1. **Docs vs behaviour:** missing `http.route` yields `/_unmatched`, not a normalized URL path.
2. **Docs gap:** with the stock Node SDK the default trace exporter keeps failing against `localhost:4318` unless `OTEL_TRACES_EXPORTER=none` and `OTEL_METRICS_EXPORTER=otlp` are set; the guide does not say so.
3. **UI:** the request-volume chart's x-axis labels overlap ("20 Nov, 10:00" printed over itself).
4. **Docs:** the SDK reference says "Currently 0.1.0-beta.0"; the published version is 0.1.0-beta.1.
5. **Error codes reveal key state** (`auth_revoked`), contrary to the "generic errors" wording in the docs (known as DOC-01 / SEC-08).
6. **Evidence in the public repository:** the team's wallet screenshots under `docs/scf/build-submission/evidence/` show unrelated browser tabs (one names another project) and partial wallet addresses. They should be cropped and re-committed.
