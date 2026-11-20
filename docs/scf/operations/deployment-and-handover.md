# Deployment and handover plan

**Status:** how a qualified community operator could deploy and run Pyxis, and how the project would be handed over. Sections marked **TESTED** were run during this work; **UNTESTED** sections are standard practice or proposals that have not been exercised; **PLANNED** sections do not exist yet. **Nobody outside the team has followed this plan.**
**Evidence basis:** the public guide <https://docs.usepyxis.xyz/docs/guides/run-in-production> (source `apps/docs/content/docs/guides/run-in-production.mdx`), `docs/handover-build-plan.md`, and the deployment performed on 2026-11-20.
**Related:** [infrastructure-and-operations.md](infrastructure-and-operations.md).

The RFP defines handover as complete only when **a community-appointed operator runs a working system**: repository ownership transferred, all data migrated, and the domain transferred or permanently redirected. Today that cannot be demonstrated.

## 1. Fresh installation (TESTED on a local PostgreSQL and on Railway)

| Step | Command or action | Result seen |
|---|---|---|
| 1. Provision PostgreSQL 17 or 18 | Create an empty database; note the owner connection | Local embedded and Railway PostgreSQL both worked |
| 2. Get the code | `git clone https://github.com/Pyxis-Hq/pyxis.git`, `npm install --legacy-peer-deps` | Passed in a clean clone |
| 3. Migrate | `ADMIN_DATABASE_URL=... npm run db:migrate` | Migrations 001 and 002 applied; checksums recorded |
| 4. Set the runtime role password | `PYXIS_APP_PASSWORD=... npm run db:role` | "pyxis_app password updated" |
| 5. Configure | `DATABASE_URL` (as `pyxis_app`), `OPERATOR_ACCOUNTS` | |
| 6. Build and start | `npm run build`, `npm start`, behind HTTPS | Home 200, sign-in challenge 200, bad ingest key 401 |
| 7. Verify | the three `curl` checks in the guide; `scripts/e2e-smoke.mts` | Checks passed; the smoke script was **not** run for this package |

**Prerequisites an operator needs:** Node.js 22, PostgreSQL, HTTPS in front of the app (the session cookie is `secure` in production), and a domain.

## 2. Umami setup (UNTESTED, PLANNED to verify)

Run Umami as its own service with its own database and credentials; set `UMAMI_URL`, `UMAMI_USER`, `UMAMI_PASSWORD` (and `UMAMI_PUBLIC_URL` if the tracker should load from another origin). **Pin the Umami release by digest**; the repository's compose file uses the mutable `postgresql-latest` tag and must not be copied into production. The integration has never been run against a real Umami.

## 3. Credential rotation

| Credential | Procedure | Status |
|---|---|---|
| `pyxis_app` password | Change `PYXIS_APP_PASSWORD` and `DATABASE_URL` together, run `npm run db:role`, restart | TESTED for the initial set; rotation not rehearsed |
| Ingest key | Create a new key, update the exporter, revoke the old key (immediate) | TESTED (`tests/db.test.ts`, smoke script) |
| Operator list | Edit `OPERATOR_ACCOUNTS`; **existing operators keep the flag until they next sign in, up to 7 days** | UNTESTED |
| Umami credentials | Change in Umami and in the variables | UNTESTED |
| Session invalidation | Delete rows from `sessions` | UNTESTED; no admin tool |

## 4. Project administration

Roles are set in the app: owners and admins manage members, developers manage keys, admins manage sites. Operators can set a project `active`, `suspended` or `archived`; suspension stops ingest immediately. **There is no project deletion, no data export and no ownership transfer**.

## 5. Monitoring, backup, restore, upgrade, incident response

| Area | Today | Required |
|---|---|---|
| Monitoring | None | T2-2: probes, metrics, alerts, a DB-aware health endpoint |
| Backup | Manual `pg_dump` described; not exercised | T2-2: scheduled backups and a demonstrated restore |
| Restore | None performed | T2-2: restore into a scratch database, verified with the test suite and the smoke script |
| Upgrade | Pull, build, `db:migrate` then `db:role`, restart (in the guide; **CLI deploys need the migration run by hand**) | T1-6: automated, with rollback notes |
| Incident response | None | T2-2: written procedure, exercised once |

## 6. Data export and migration (PLANNED)

To hand the system to another operator, all tenant data must move. The data is PostgreSQL rows plus Umami's database. A proposed method, **untested**: stop ingest (suspend all projects or put the app in maintenance), `pg_dump` the Pyxis database with the owner role, restore it into the new instance, run `db:migrate` (a no-op), run `db:role`, point exporters at the new host, and move Umami with its own dump. Ingest keys keep working because only hashes are stored and they move with the data. **A rehearsal with a real dump has not been done.**

## 7. Operator transition (PLANNED)

| Step | Owner | Evidence required |
|---|---|---|
| Appoint the community operator | SCF | Written appointment |
| Transfer the GitHub repository (`Pyxis-Hq/pyxis`) and the npm organization `pyxis-hq` | Maintainers | New owners confirmed; branch protection preserved |
| Provision infrastructure from the monorepo | Operator | Clean-checkout rebuild passes the acceptance tests |
| Migrate data | Both | Row counts and a smoke run match before and after |
| Move the domain `usepyxis.xyz` or publish a permanent redirect | Maintainers (registrar: Namecheap) | New host serves HTTPS; old host redirects |
| Rotate every secret | Operator | Old credentials revoked |
| Maintainers stay available for a defined overlap | Both | Written overlap period |

## 8. What an outside operator will trip over today

No `.env.example`; no container image; the pre-deploy migration does not run on CLI deploys; the compose file has no app service; no runbooks beyond the guide; Umami is unverified. These are the reasons the matrix marks D3, D4 (not independently verified), D5 and H7 below DONE.

## 9. Acceptance for this plan

An operator who has not worked on Pyxis, using only the monorepo, deploys a working system, onboards a test project, ingests data, takes a backup, restores it into a second instance and completes a minor version upgrade, with each step timed and recorded. This is deliverable T3-3 in the roadmap.
