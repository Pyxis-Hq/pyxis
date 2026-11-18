# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Existing codebase: Next.js 16, Tailwind 4, shadcn/ui (base-ui), Redux Toolkit + RTK Query, Figtree, Iconsax/Hugeicons, web3icons, PostgreSQL. Stack was specified by the user.

## Users
Primary: Stellar project builders (developers and owners) who enroll a project, mint ingest keys, install a tracker or OpenTelemetry exporter, and read their own web, API and wallet-funnel dashboards day to day.
Secondary (confirmed, not primary): SCF operators who need an aggregate, auditable ecosystem view; SCF reviewers judging the grant submission.

## Product Purpose
Shared, open-source, multi-tenant analytics for Stellar ecosystem projects, built for the SCF RFP "Web and API Analytics for Stellar Ecosystem Projects". It gives each project web analytics (pinned self-hosted Umami), API request/latency metrics (OTLP metrics only, stored as counters and histograms in PostgreSQL), and an optional wallet-funnel signal, without operating an analytics stack. Success for the current phase is a verifiable testnet MVP that satisfies SCF review criteria; later, three web projects and one API project instrumented and a community-operable handover.

## Positioning
Ecosystem-wide, comparable metrics with strict tenant isolation and no visitor profiling: only aggregates are stored, project identity comes from the credential never the payload, and operators see aggregates only, with every access audited. Wallet events are explicitly frontend-reported, never presented as ledger-confirmed.

## Operating Context
Runs on Stellar testnet for the MVP. Sign-in is a signed Stellar wallet message (SEP-43 style). Builders dual-export OpenTelemetry metrics (OTLP/HTTP JSON currently) to their own APM and to Pyxis. Domains are verified by DNS TXT or a well-known file before a tracker is issued. Self-hosted, to be handed to a community operator.

## Capabilities and Constraints
- Metrics only: no traces, logs, request bodies, IPs, wallet addresses, signatures or XDR are stored.
- Percentiles come from merged fixed-boundary histograms and are approximations; the interface must state definitions (e.g. 5xx / all responses).
- Wallet events cannot prove on-ledger outcomes.
- Open: the product name "Pyxis" (chosen 2026-11-18, renamed from "Stellar Pulse"; trademark, domain and npm scope checks are still pending) and the "testnet MVP" wording are provisional.
- Open: SLA figures are not yet claimed; no availability promise in the UI.

## Evidence on Hand
None to cite. There are no pilot letters, real users, production traffic or track-record claims. All seeded data is synthetic and must be labelled as such. Copy must not imply adoption, customers, uptime or compliance.

## Product Principles
1. Honest measurement: show definitions, approximations and limits next to the numbers.
2. Privacy by omission: if a number would need personal data, it does not exist.
3. Tenant boundaries are visible: users can always tell whose data they are looking at and why.
4. Builders first: setup to first data point should be fast and copy-pasteable.
5. Verifiable over impressive: every claim in the UI maps to something a reviewer can test.

## Accessibility & Inclusion
No product-specific standard confirmed. Baseline in the plan: responsive layouts, keyboard-operable controls, readable contrast, honouring prefers-reduced-motion.
