# Infrastructure and operations

**Status:** describes what runs today (observed 2026-11-20) and what does not exist. **Nothing here implies high availability.** The Railway dashboard (domains, backups, variables, usage) was **not** inspected by this audit; statements about it come from the CLI, the repository and HTTP checks.
**Evidence basis:** `railway.json`, `docker-compose.yml`, `.github/workflows/ci.yml`, `package.json` scripts, `railway deployment list` output, `curl` checks of the live hosts, and the deployment lessons recorded in `docs/handover-build-plan.md`.
**Related:** [deployment-and-handover.md](deployment-and-handover.md), [../technical/architecture.md](../technical/architecture.md), [../security/threat-model.md](../security/threat-model.md).

## 1. What is running today

| Item | Value | Source |
|---|---|---|
| Platform | Railway, one project, environment `production` | CLI |
| Services | `web` (the app), `docs` (the documentation site), `Postgres` | CLI |
| Replicas | 1 per service | deployment manifest (`numReplicas: 1`) |
| Region | `us-west2` (US West) | deployment manifest |
| App URL | <https://usepyxis.xyz> (200) and the Railway URL (200) | HTTP check 2026-11-20 |
| Docs URL | <https://docs.usepyxis.xyz> (307 to `/docs`, then 200) | HTTP check |
| DNS | Namecheap: `ALIAS` for the apex, `CNAME` for `docs`, `_railway-verify` TXT records | session record |
| TLS | Issued by Railway after domain verification | Railway status: certificate valid |
| Database | Railway PostgreSQL reached over the private network (`postgres.railway.internal`); app connects as `pyxis_app` | variables (host only inspected) |
| Umami | **Not deployed** | repository; no variables set |
| Build | Railpack: `npm install`, `npm run build`, start `npm run start` | `railway.json`, build log |
| Deployment method | Manual: `railway up` from a developer machine | session record |
| CI | GitHub Actions: build SDK, typecheck, test, build app, build docs | `.github/workflows/ci.yml` |

## 2. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Runtime role `pyxis_app`. **If unset the code falls back to `postgres://pyxis_app:pyxis_app@localhost:54329/pyxis`, so a missing production value does not fail fast** |
| `ADMIN_DATABASE_URL` | For migrations | Owner connection; not used at runtime |
| `PYXIS_APP_PASSWORD` | For `db:role` | Replaces the development password of `pyxis_app` |
| `OPERATOR_ACCOUNTS` | Recommended | Comma-separated Stellar public keys |
| `UMAMI_URL`, `UMAMI_USER`, `UMAMI_PASSWORD`, `UMAMI_PUBLIC_URL` | For web analytics | Not set in production |
| `BACKEND_URL`, `NEXT_DIST_DIR` | Development | |
| `PORT` | Platform-provided | |

There is no `.env.example`. A variable named `APP_URL` exists on the live service but **no code reads it**.

## 3. Secrets

Stored as Railway service variables. No secret manager, no rotation schedule and no access review exist. The default role password `pulse_app`/`pyxis_app` is created by the migrations and must be replaced by `db:role`; whether it was replaced on the live database was **not verified** (the deployment config runs `db:role`).

## 4. Health, logging, monitoring, alerting

| Capability | Status |
|---|---|
| Health check | `GET /` returns 200. It does **not** check the database |
| Logging | Console output only; no structured logging, no log shipping, no retention policy |
| Monitoring | **MISSING**: no uptime probe, no metrics, no dashboards |
| Alerting | **MISSING** |
| Audit trail | `ingestion_audit` and `operator_audit_events` tables only |

## 5. Backups and recovery

| Capability | Status |
|---|---|
| Automated database backups | **Not evidenced.** Whether Railway provides backups for this plan was not verified |
| Manual backup procedure | `pg_dump` is documented in the public guide; **not exercised** |
| Restore procedure | **MISSING**; no restore has been performed |
| Recovery objectives | None defined |

## 6. Deployment lessons (observed)

| Problem | Cause | Resolution |
|---|---|---|
| Deploy failed with no logs, repeatedly | A Windows checkout uploads CRLF files; the stored LF checksum of `001_init.sql` no longer matched | Checksums now ignore line endings (`scripts/migrate.ts`) |
| `npm install` failed with `ERESOLVE` on Railway | Peer-dependency conflicts without the flag | `.npmrc` with `legacy-peer-deps=true` |
| Pre-deploy migration did not run on CLI deploys | Railway ignored the pre-deploy command for `railway up` uploads | Run `npm run db:migrate && npm run db:role` by hand over `railway ssh` after a deploy that adds a migration |
| `railway ssh` picked the wrong key | Several keys on the developer machine | Pass `-i <key>` |
| Linking a new service changed the CLI's linked service | CLI behaviour | Name the service on every command |

## 7. Scaling and failure behaviour

| Topic | Today |
|---|---|
| Horizontal scaling | The app is stateless and could run several replicas, but this has **never been tried**; no load balancer configuration exists in the repository |
| Database scaling | One instance; the app pool is 10 connections per process |
| Background workers | None exist; retention, rollup and purge jobs would be new components |
| Failure recovery | On crash Railway restarts the process (`restartPolicyType: ON_FAILURE`); there is no standby database and no ingest buffer, so exporters must retry through an outage |
| Availability assumption | **None can be supported.** A single replica and a single database cannot support a high-availability target; the planned approach is in [../planning/roadmap-and-milestones.md](../planning/roadmap-and-milestones.md) |

## 8. Portability

| Aspect | Status |
|---|---|
| Runs on any host with Node 22 and PostgreSQL | Yes, by the steps in <https://docs.usepyxis.xyz/docs/guides/run-in-production>; the generic path was run against a local PostgreSQL |
| Container image | **MISSING**: no Dockerfile |
| `docker-compose.yml` | Starts PostgreSQL and Umami only; **no app service**; Umami tag is mutable; unverified because Docker was not available to the audit |
| Infrastructure-as-code | **MISSING** |
| Railway-specific files | `railway.json` only; the docs service has no config file in the repository |

## 9. Incident response

No incident-response procedure exists. The RFP requires one to be written and exercised (Tranche 3). A minimum viable procedure is proposed in [../planning/roadmap-and-milestones.md](../planning/roadmap-and-milestones.md) deliverable T2-2.

## 10. Cost and capacity

Not measured. The audit did not inspect Railway usage or billing. A cost model for the hosting obligation (RFP H6) is a planning input.
