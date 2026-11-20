# SCF Build submission: documents for reviewers

Pyxis is privacy-first analytics infrastructure for the Stellar ecosystem: web analytics, API metrics and a wallet funnel in one multi-tenant platform. It is a **Testnet MVP**, submitted to the SCF RFP track for *Web and API Analytics for Stellar Ecosystem Projects*.

| | |
|---|---|
| Live application | <https://usepyxis.xyz> |
| Documentation site | <https://docs.usepyxis.xyz> |
| Source code | <https://github.com/Pyxis-Hq/pyxis> (Apache-2.0, see [LICENSE](../../LICENSE)) |
| Wallet SDK | <https://www.npmjs.com/package/@pyxis-hq/wallets-kit> |
| Demo video | to be added when published |

## Where to find each document

| What a reviewer needs | Document |
|---|---|
| **Technical architecture** (Stellar-specific): system, components, Stellar integration, data, security, operations | [technical/technical-specification.md](technical/technical-specification.md) |
| Architecture diagrams and component boundaries | [technical/architecture.md](technical/architecture.md) |
| How Pyxis uses Stellar, and what it does not (no Soroban component yet) | [technical/stellar-integration.md](technical/stellar-integration.md) |
| HTTP API reference | [technical/api-reference.md](technical/api-reference.md) |
| Telemetry and event specification | [technical/telemetry-specification.md](technical/telemetry-specification.md) |
| **RFP requirements, status and evidence** (one row per requirement) | [rfp-compliance-matrix.md](rfp-compliance-matrix.md) |
| **Deliverables by tranche**, schedule and effort | [planning/roadmap-and-milestones.md](planning/roadmap-and-milestones.md) |
| How each deliverable will be accepted | [planning/acceptance-test-plan.md](planning/acceptance-test-plan.md) |
| **Threat model and monitoring plan** (the Tranche 2 starting point) | [security/threat-model.md](security/threat-model.md) |
| Privacy and data protection | [security/privacy-and-data-protection.md](security/privacy-and-data-protection.md) |
| Infrastructure, operations and handover | [operations/infrastructure-and-operations.md](operations/infrastructure-and-operations.md), [operations/deployment-and-handover.md](operations/deployment-and-handover.md) |
| Maintenance and governance | [planning/maintenance-and-governance.md](planning/maintenance-and-governance.md) |
| **Traction evidence** (short summary with links) | [traction-evidence.md](traction-evidence.md) |
| The runs and screenshots behind every claim | [evidence/README.md](evidence/README.md) |
| Vulnerability reporting, contribution guide | [SECURITY.md](../../SECURITY.md), [CONTRIBUTING.md](../../CONTRIBUTING.md) |

## Status at a glance

- **Built and verified:** wallet-signature sign-in; projects, members, ingest keys with revocation; tenant isolation by forced row-level security; OTLP/HTTP JSON ingestion with delta histograms; API dashboards (volume, p50/p95/p99, status classes, routes); web analytics through a self-hosted Umami with domain verification; a wallet-funnel SDK on npm; a live deployment.
- **Demonstrated on Testnet, in internal sessions:** a real wallet signing in and sending a payment that is confirmed on the ledger; a stock OpenTelemetry SDK sending 270 requests that Pyxis counted exactly; real browser sessions matching Umami's own numbers. Details and limits are in the [evidence](evidence/README.md).
- **Not built yet:** Soroban or ledger observability, rate limiting, data retention, OTLP protobuf and gzip, monitoring and backups, infrastructure-as-code, a production service-level target.
- **No external adopters yet.** Every run above is an internal test.

## Conventions

- **Requirement status:** IMPLEMENTED means a test or an observation backs it; NIV means implemented but not independently verified; PARTIAL, PLANNED, MISSING and BLOCKED are as defined in the [compliance matrix](rfp-compliance-matrix.md).
- **Evidence provenance:** *frontend-reported* (sent by a browser SDK, not ledger confirmation), *ledger-verified* (read back from Stellar Horizon), *server-stored* (read from the Pyxis or Umami store).
- **Dates are relative** in the roadmap (weeks from award acceptance); no calendar dates are promised.
