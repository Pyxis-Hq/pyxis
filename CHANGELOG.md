# Changelog

All notable changes to Pyxis are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The application has no tagged releases yet; its changes are listed under **Unreleased**, newest first. The wallet SDK is published separately and follows semantic versioning.

## Unreleased

### Added
- **2026-11-20:** documentation for SCF reviewers under `docs/scf/` (reviewer index, RFP compliance matrix, technical specification, threat model, deliverables, operations, traction evidence and the evidence behind it) and a documentation index in `docs/README.md`.
- **2026-11-20:** this changelog and a Code of Conduct.
- **2026-11-20:** the "Run Pyxis in production" guide on the documentation site.
- **2026-11-20:** link to the documentation site from the landing page header and footer.
- **2026-11-20:** the documentation site deployed at <https://docs.usepyxis.xyz>; the application deployed at <https://usepyxis.xyz>.
- **2026-11-18:** the Fumadocs documentation site (`apps/docs`) in the application's dark violet theme.
- **2026-11-18:** the Apache-2.0 licence.
- **2026-11-18:** CI, Railway configuration, issue and pull request templates, and Dependabot.
- **2026-11-18:** test suites: unit, database isolation, wallet, web and end-to-end.
- **2026-11-18:** the dashboards (API metrics, web analytics, wallet funnel), onboarding, the operator view and the design system.
- **2026-11-18:** authentication by wallet signature, project and member management, ingest keys, the ingest endpoints (`/v1/metrics`, `/v1/wallet-events`) and the session API.
- **2026-11-18:** the PostgreSQL schema with forced row-level security, SQL migrations and database scripts.
- **2026-11-18:** README, technical, security, contributing and design documents.

### Changed
- **2026-11-18:** renamed from "Stellar Pulse" to "Pyxis" (migration `002_rename_to_pyxis.sql`). An older deployment may still use the old database role, key prefix and variable names; see the README.
- **2026-11-20:** reorganized the documentation: SCF documents moved to `docs/scf/`, and the older acceptance matrix replaced by a pointer to the current compliance matrix.
- **2026-11-18:** security reports are directed to GitHub's private vulnerability reporting (documented in `SECURITY.md`).

### Fixed
- **2026-11-20:** removed the claim that the Umami tracker is "pinned" from the web analytics page, the landing page, the README and a code comment. The Umami server image tag can be pinned by the operator; the tracker snippet carries no version.
- **2026-11-20:** migration checksums ignore line endings, so migrations apply on Windows and Linux alike.
- **2026-11-20:** `.npmrc` sets `legacy-peer-deps`, so a plain `npm install` works on Railway.
- **2026-11-18:** CI generates the Next.js route types before type checking.
- **2026-11-18:** normalized line endings across platforms.

### Security
- **2026-11-18:** applied safe dependency updates and fixed the Vitest, Vite and Tinypool advisories; recorded the remaining findings and ignored declined major updates. Remaining advisories are tracked in `SECURITY.md`.

## `@pyxis-hq/wallets-kit` (npm)

### 0.1.0-beta.1: 2026-11-20
- Improved discoverability on npm: keywords and a homepage that points to the guide.

### 0.1.0-beta.0: 2026-11-18
- First published beta: framework-agnostic core client (`PyxisWallet`, `createPyxisWallet`) and React bindings (`PyxisProvider`, `usePyxis`), ESM and CommonJS builds with types. Reports wallet-funnel events as counts only; events are frontend-reported and are not ledger confirmation.

### 0.0.0-stage: 2026-11-18
- Initial publish of the package name. Superseded by 0.1.0-beta.0.
