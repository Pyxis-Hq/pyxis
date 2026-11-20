# Pyxis

Shared, multi-tenant analytics for Stellar projects. A builder signs in with a Stellar wallet, enrolls a project, and gets three views of their product without running an analytics stack:

- **API analytics:** request volume, latency percentiles (p50 / p95 / p99) and 5xx error rate per route, from the OpenTelemetry metrics their services already emit.
- **Web analytics:** page views, referrers, countries, browsers and devices from a self-hosted [Umami](https://umami.is), issued only after the owner proves control of the domain.
- **Wallet funnel:** how many people get from "connect wallet" to a reported transaction submission, counted from event names alone.

Built for the SCF RFP *Web and API Analytics for Stellar Ecosystem Projects*. Plan and SCF mapping: [ROADMAP.md](ROADMAP.md). Product truth and constraints: [PRODUCT.md](PRODUCT.md).

> **Testnet MVP.** The name "Pyxis" and the wording "testnet MVP" are provisional. All seeded data is synthetic and labelled as such. Nothing here claims customers, adoption, uptime or compliance.
>
> **Renamed.** Pyxis was called "Stellar Pulse" until 2026-11-18. An older deployment may still use the old names (database role `pulse_app`, key prefix `sp_live_`, variable `PULSE_APP_PASSWORD`). The migration and the steps to move a live deployment are in [docs/handover-build-plan.md](docs/handover-build-plan.md) section 6.5a.

## Contents

[Principles](#principles) · [Status](#status-what-is-real-today) · [Architecture](#architecture) · [Get your first data point](#get-your-first-data-point) · [What is stored](#what-is-stored-and-what-is-not) · [Quickstart](#quickstart) · [Configuration](#configuration) · [Sending data](#sending-data) · [Roles](#roles) · [Repository layout](#repository-layout) · [Scripts](#scripts) · [Testing](#testing) · [Deployment](#deployment) · [Security](#security-notes) · [Limits](#limits) · [Known gaps](#known-gaps) · [Documentation](#documentation) · [Contributing](#contributing)

## Principles

1. **Honest measurement.** Definitions, approximations and limits are shown next to every number. Percentiles are interpolated from fixed-boundary histograms and say so.
2. **Privacy by omission.** If a number would need personal data, it does not exist. No IPs, request bodies, traces, logs, wallet addresses, signatures or transaction XDR are stored.
3. **Tenant boundaries are visible and enforced.** The project comes from the credential, never from the payload, and PostgreSQL row-level security enforces isolation.
4. **Builders first.** Setup to first data point should be fast and copy-pasteable.
5. **Verifiable over impressive.** Every claim in the UI maps to something a reviewer can test.

## Status: what is real today

| Area | State | Evidence |
|---|---|---|
| Stellar-account sign-in (SEP-43 style signed challenge, testnet) | Built | server verified by `scripts/e2e-smoke.mts`; **the browser wallet path (Wallets Kit) has not been exercised with a real wallet** |
| Projects, members and roles (owner / admin / developer / analyst / viewer), operator role | Built (add or re-role a member by Stellar key in Settings; no invitation email) | e2e, UI review against a mock API |
| API keys: hashed, shown once, scopes, revoke, last used | Built | `tests/db.test.ts`, e2e |
| OTLP/HTTP **JSON** metrics receiver | Built | `tests/unit.test.ts`, e2e |
| Route normalization, mergeable histograms, p50 / p95 / p99 | Built | unit tests |
| PostgreSQL row-level-security tenant isolation (non-owner runtime role) | Built | `tests/db.test.ts` on real PostgreSQL |
| Dashboards: API metrics with previous-period deltas and incident windows, keys and setup, wallet funnel, settings and team, operator overview with audit log | Built, dark-first UI | build compiles; verified visually against a mock API with sample data, **not yet against real production data** |
| Wallet funnel: SDK, `/v1/wallet-events`, funnel panel, `/demo` testnet dApp | Built (SDK published as beta) | `tests/wallet.test.ts`, e2e; **`/demo` has not been run with a real wallet and a funded account** |
| Site enrollment, domain verification (DNS TXT or well-known file, SSRF-guarded), Umami client, report UI | Built | `tests/web.test.ts` against a fake Umami; **never run against a real Umami release** |
| Public SDK packages | Partial | `@pyxis-hq/wallets-kit@0.1.0-beta.0` is on npm (core and React); the Stellar Wallets Kit adapter and OpenTelemetry helper are not built; see [docs/sdk-build-spec.md](docs/sdk-build-spec.md) |
| Umami deployment pinned by digest, tracker under an ad-blocker-neutral name | Not done (compose uses `latest`, untested) | ROADMAP M2 |
| OTLP protobuf and gRPC, quotas UI, exports, erasure, 24-month rollups, bot detection, HA, load tests | Not started | ROADMAP M2 / M3 |

## Architecture

```mermaid
flowchart LR
  subgraph Builder["Builder's systems"]
    API["Backend service<br/>OpenTelemetry exporter"]
    DAPP["dApp frontend<br/>wallet funnel SDK"]
    SITE["Website<br/>Umami tracker snippet"]
    OWNER["Project owner<br/>browser"]
  end

  subgraph Pyxis["Pyxis (Next.js app)"]
    UI["Dashboards<br/>React + RTK Query"]
    REST["Session API<br/>/api/v1/*"]
    ING["Ingest API<br/>/v1/metrics<br/>/v1/wallet-events"]
  end

  DB[("PostgreSQL<br/>row-level security")]
  UMAMI["Umami<br/>web analytics engine"]

  API -- "OTLP/HTTP JSON<br/>Bearer ingest key" --> ING
  DAPP -- "event names only<br/>Bearer ingest key" --> ING
  SITE -- "page views" --> UMAMI
  OWNER -- "signs in with a Stellar wallet" --> UI
  UI --> REST
  REST --> DB
  ING --> DB
  REST -- "reports via Umami REST API" --> UMAMI
```

Everything runs in one Next.js 16 application: the dashboards, the session-authenticated API under `/api/v1`, and the key-authenticated ingest API under `/v1`. Umami is a separate service that Pyxis talks to over its documented REST API and never reads from its database. A deeper walk-through with sequence diagrams, the data model and the security design is in [TECHNICAL.md](TECHNICAL.md).

## Get your first data point

```mermaid
flowchart TD
  A["Open the app and connect a Stellar wallet<br/>(testnet), sign a one-time message"] --> B["Create a project"]
  B --> C["Create an ingest key<br/>shown once, copy it now"]
  C --> D{"What are you measuring?"}
  D -- "Backend API" --> E["Paste the generated OpenTelemetry<br/>settings into your service"]
  D -- "Wallet funnel" --> F["Install the wallet SDK in your dApp<br/>and call track"]
  D -- "Website" --> G["Add the domain, publish the DNS TXT<br/>record or well-known file, verify"]
  E --> H["Overview fills in<br/>(refreshes every 15 seconds)"]
  F --> I["Wallet funnel page counts events"]
  G --> J["Install the Umami tracker snippet<br/>web report appears"]
```

## What is stored, and what is not

```mermaid
flowchart LR
  IN["Incoming data"] --> V{"Allowlist<br/>and limits"}
  V -- "counters and latency histograms<br/>per route, per minute" --> S1["Stored"]
  V -- "event names and counts<br/>per minute" --> S1
  V -- "SHA-256 of key secrets<br/>membership by Stellar key" --> S1
  V -- "traces, logs, request bodies<br/>IPs, query strings" --> R["Rejected or never read"]
  V -- "wallet addresses, signatures<br/>transaction XDR, free text" --> R
```

Web analytics counts (visitors, countries, browsers) come from Umami and follow Umami's own definitions and data handling.

## Quickstart

Prerequisites: Node.js 22 (CI uses 22), npm, and either Docker or nothing else (an embedded PostgreSQL is provided).

```bash
npm install --legacy-peer-deps   # the legacy flag is required by current peer ranges
npm run db:dev                   # embedded PostgreSQL on :54329 (or: docker compose up postgres)
npm run seed                     # SYNTHETIC demo data; prints ingest keys
OPERATOR_ACCOUNTS=G... npm run dev
```

Open <http://localhost:3000>. `OPERATOR_ACCOUNTS` is a comma-separated list of Stellar public keys that receive the operator role when they sign in.

`npm run db:dev` keeps its data in `.pyxis-data/` (git-ignored) and stays in the foreground; stop it with Ctrl+C. The default connection strings point at it, so no environment file is needed for local work.

Run the end-to-end smoke test against a running instance:

```bash
SMOKE_SECRET=S... npx tsx scripts/e2e-smoke.mts http://localhost:3000 <ingest-token>
```

### Use a deployed backend with a local UI

Set `BACKEND_URL` (for example in `.env.local`) and `next dev` proxies every `/api/*` and `/v1/*` request to that deployment. Unset, the app uses its own routes and database.

## Configuration

| Variable | Used by | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | app runtime | `postgres://pyxis_app:pyxis_app@localhost:54329/pyxis` | Connection for the non-owner runtime role `pyxis_app` |
| `ADMIN_DATABASE_URL` | `db:migrate`, `db:role` | `postgres://postgres:postgres@localhost:54329/pyxis` (migrate only) | Owner connection used to run migrations |
| `PYXIS_APP_PASSWORD` | `db:role` | none (required there) | Replaces the development password of `pyxis_app` after migrating |
| `OPERATOR_ACCOUNTS` | app runtime | empty | Stellar public keys that get the operator role at sign-in |
| `UMAMI_URL` | app runtime | none | Base URL of the Umami instance; web analytics is off without it |
| `UMAMI_USER`, `UMAMI_PASSWORD` | app runtime | none | Credentials for Umami's REST API |
| `UMAMI_PUBLIC_URL` | app runtime | `UMAMI_URL` | Origin that the tracker snippet loads `script.js` from |
| `BACKEND_URL` | `next dev` / `next build` | none | Proxy API requests to a deployed backend |
| `NEXT_DIST_DIR` | Next.js | `.next` | Separate build directory, useful for a second dev or build run |

Without the three `UMAMI_*` variables, domains still verify but no tracker is issued.

## Sending data

### API metrics (OpenTelemetry)

Pyxis accepts **OTLP/HTTP JSON** metrics at `POST /v1/metrics`, delta temporality, with the HTTP server duration histogram. The Keys and setup page generates these settings with your new key:

```bash
export OTEL_EXPORTER_OTLP_METRICS_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=https://<your-pyxis-host>/v1/metrics
export OTEL_EXPORTER_OTLP_METRICS_HEADERS="Authorization=Bearer <ingest key>"
export OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE=delta
export OTEL_SERVICE_NAME=my-api
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment.name=testnet
```

This is a dual export: keep your existing APM and add Pyxis as a second destination. Traces and logs are rejected (`404 signal_not_supported`). Cumulative temporality is dropped with a reason code, which is the most common mistake.

### Wallet funnel

The SDK is published on npm as [`@pyxis-hq/wallets-kit`](https://www.npmjs.com/package/@pyxis-hq/wallets-kit) (`npm install @pyxis-hq/wallets-kit`). Its source is in [sdk/wallets-kit/](sdk/wallets-kit/) and the `/demo` page uses it. It has a core client and a `/react` entry. It records nine allowlisted events (connect, sign and submit, each started, completed or failed, plus disconnect) and **never** accepts addresses, signatures or XDR. Wallet events are reported by your frontend and are **not** proof that a transaction reached the ledger. The remaining SDK work (the Stellar Wallets Kit adapter and an OpenTelemetry helper) is specified in [docs/sdk-build-spec.md](docs/sdk-build-spec.md).

### Web analytics

Add the domain on the Web analytics page, publish the DNS TXT record (`_pyxis.<domain>`) or serve the token at `/.well-known/pyxis.txt`, press Verify, then install the tracker snippet that Pyxis issues.

## Roles

| Role | Can do |
|---|---|
| viewer, analyst | Read the project's dashboards, sites and team list |
| developer | Everything above, plus create and revoke ingest keys |
| admin | Everything above, plus rename the project, add or remove members, add and verify sites |
| owner | Everything an admin can do; cannot be removed. The creator of a project is its owner |
| operator | A deployment-level role set by `OPERATOR_ACCOUNTS`. Reads aggregates across projects and can suspend or reinstate a project; every access is written to an audit log |

## Repository layout

```text
src/
  app/                    Next.js routes
    page.tsx, signin/     public landing page and wallet sign-in
    projects/             the app: project list, overview, keys, sites, wallet funnel, settings
    operator/, demo/      operator overview, testnet demo dApp
    api/v1/               session-authenticated JSON API
    v1/                   key-authenticated ingest: metrics, wallet-events (traces and logs rejected)
  components/             pyxis/ (app shell, charts, primitives), ui/ (shadcn base)
  lib/                    RTK Query API client, store, wallet sign-in helper
  server/                 db access, auth, keys, ingest parsing, queries, Umami and domain verification
db/migrations/            SQL schema and row-level-security policies
scripts/                  migrate, local Postgres, seed, e2e smoke, runtime-role password
sdk/wallets-kit/          @pyxis-hq/wallets-kit, the published wallet-funnel SDK
apps/docs/                documentation site (Fumadocs); `npm run dev --workspace @pyxis-hq/docs` serves it on :3100
tests/                    vitest suites
docs/                     SDK build spec, design teardown
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (spins up its own embedded PostgreSQL) |
| `npm run db:dev` | Embedded PostgreSQL on `:54329`, migrations applied |
| `npm run db:migrate` | Apply `db/migrations/*.sql` (checksummed, transactional) |
| `npm run db:role` | Set the `pyxis_app` password from `PYXIS_APP_PASSWORD` |
| `npm run seed` | Load synthetic demo data and print ingest keys |

## Testing

`npm test` runs four suites: route normalization, histograms, OTLP parsing and key format (`unit`); tenant isolation and the key lifecycle on a real PostgreSQL (`db`); the wallet-event schema and the SDK (`wallet`, `sdk`); domain normalization, the SSRF guard, domain verification and the Umami client against a fake server (`web`). CI runs install, typecheck, tests and build on every push and pull request ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Deployment

Running your own instance? Follow the production guide: <https://docs.usepyxis.xyz/docs/guides/run-in-production> (source in `apps/docs/content/docs/guides/run-in-production.mdx`).

The live service is at <https://usepyxis.xyz> and the documentation is at <https://docs.usepyxis.xyz> (two Railway services; the domain is registered at Namecheap). The docs service deploys `apps/docs` on its own: from `apps/docs`, run `railway up --service docs`.


The repository includes a [railway.json](railway.json) (Railpack build, `npm run db:migrate && npm run db:role` before deploy, `npm start`, health check on `/`). A working setup is one app service plus a PostgreSQL service, with `DATABASE_URL` pointing at the runtime role and `ADMIN_DATABASE_URL` and `PYXIS_APP_PASSWORD` set for the migration step. Note: on one deployment the pre-deploy step did not run, so confirm migrations after the first deploy and run `npm run db:migrate && npm run db:role` inside the service if needed.

`docker-compose.yml` defines PostgreSQL, Umami and Umami's database for an evaluation stack. It is **unverified**: it has not been run in a clean room, and Umami uses `latest` rather than a pinned digest.

## Security notes

- The runtime role `pyxis_app` is not an owner and has no `BYPASSRLS`; the tenant is set per transaction with `set_config(..., true)`.
- The tenant is derived from the API key only; payload attributes such as `tenant.id` are never read.
- Only a SHA-256 of each 256-bit random key secret is stored. Sign-in challenges are single-use and expire in 5 minutes. Sessions are an httpOnly, SameSite=Lax cookie that is `Secure` in production and lasts 7 days.
- Domain verification never follows redirects and refuses private addresses (SSRF guard).
- The operator view returns aggregates only; opening a project or the overview is written to `operator_audit_events`.
- Ingestion is metrics only. Browser ingest keys are visible to users: create a dedicated ingest-only key for browser use and revoke it when done.
- Report a vulnerability privately instead of opening a public issue. The policy, scope, threat model, known weaknesses and a deployment hardening checklist are in [SECURITY.md](SECURITY.md).

## Limits

| Limit | Value |
|---|---|
| Metrics request body | 1,000,000 bytes, at most 5,000 data points |
| Wallet events request | at most 50 events and 20,000 characters |
| Distinct services per project | 10 (service and environment pairs) |
| Distinct routes per service | 200 over 7 days; beyond that routes fold into `/_other` |
| Accepted timestamps | up to 24 hours old, up to 5 minutes ahead |
| Query range | at most 90 days |
| Aggregation | 60-second buckets, 12 fixed latency buckets (5 ms to 10 s and above) |

## Known gaps

- No rate limiting on `/v1/*` yet (body-size and batch caps only).
- OTLP protobuf and gRPC are not supported; JSON only.
- Wallet-event requests do not update an API key's "last used" time, so a key used only for wallet events shows "never".
- The `query` key scope exists but nothing consumes it; there is no public read API.
- Umami has not been run against a real release, and `docker-compose.yml` is unverified.
- The UI is dark-only. No light theme has been designed.

## Documentation

| Document | What it covers |
|---|---|
| [TECHNICAL.md](TECHNICAL.md) | Architecture, request flows, data model, security design, API reference, operations |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Step-by-step guide to contributing |
| [SECURITY.md](SECURITY.md) | How to report a vulnerability, security model, threat model, known weaknesses, hardening checklist |
| [PRODUCT.md](PRODUCT.md) | Users, purpose, constraints, principles |
| [DESIGN.md](DESIGN.md) | Visual system: tokens, components, rules |
| [ROADMAP.md](ROADMAP.md) | MVP definition and the full-project plan |
| [docs/rfp-acceptance-matrix.md](docs/rfp-acceptance-matrix.md) | Every SCF RFP requirement mapped to status, evidence and gaps |
| [docs/rfp-checklist.md](docs/rfp-checklist.md) | Actionable delivery checklist for the SCF RFP |
| [docs/handover-build-plan.md](docs/handover-build-plan.md) | Handover guide: setup, GitHub, live deployment, and the build plan for the SDK and Umami |
| [docs/sdk-build-spec.md](docs/sdk-build-spec.md) | Specification for building the public SDK |
| [docs/design-teardown.md](docs/design-teardown.md) | Competitor and reference design research |

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Next.js 16 in this repo has breaking changes versus older versions: read [AGENTS.md](AGENTS.md) before writing framework code.

## License

Pyxis is released under the [Apache License 2.0](LICENSE). Contributions are accepted under the same license.

## Tech

Next.js 16 · React 19 · Tailwind 4 · shadcn/ui (Base UI) · Redux Toolkit and RTK Query · Geist and Geist Mono · Lucide and web3icons · PostgreSQL 17/18 · Stellar SDK and Stellar Wallets Kit · Vitest.
