# Maintenance and governance

**Status:** what exists today (verified on 2026-11-20 through the GitHub API and the repository), and what must be added. Items marked **[TEAM INPUT]** cannot be known from the repository.
**Evidence basis:** the GitHub repository settings for `Pyxis-Hq/pyxis`, `CONTRIBUTING.md`, `SECURITY.md`, `.github/`, `LICENSE`.
**Related:** [roadmap-and-milestones.md](roadmap-and-milestones.md) (T3-1, T3-3), [../operations/deployment-and-handover.md](../operations/deployment-and-handover.md), RFP rows H3-H7.

## 1. Open-source governance

| Item | Today | Gap |
|---|---|---|
| Licence | Apache-2.0 (`LICENSE`, root `package.json`, SDK package); the repository reports SPDX `Apache-2.0` | none |
| Visibility | Public | none |
| Ownership | GitHub organization `Pyxis-Hq`; npm organization `pyxis-hq` | A transfer procedure for a community operator (T3-3) |
| Maintainers list | **None written** | Name maintainers and their roles **[TEAM INPUT]**; add `CODEOWNERS` |
| Decision making | Not documented | A short governance note: who merges, who decides scope, how disputes are settled **[TEAM INPUT]** |
| Code of conduct | **None** | Add one |
| Contribution process | `CONTRIBUTING.md` (304 lines): setup, branching, commit style, design rules, review | none |
| Pull request and issue templates | Present (bug and feature issue forms, pull request template) | none |

## 2. Branch protection (verified)

`main` requires: a pull request with **1 approving review**, the CI check named `test`, linear history; force pushes are disabled. **Administrators are not forced to follow the rules** (`enforce_admins: false`), so a maintainer can bypass them. For a project that will be handed over, enable enforcement for admins once there is more than one maintainer.

## 3. Issue handling and support

| Item | Today |
|---|---|
| Public issue tracker | Enabled with forms |
| Labels | Present |
| Response and resolution targets | **None published.** The RFP requires tickets answered within 5 business days and resolved within 10 (H4) |
| Triage owner | Not named **[TEAM INPUT]** |

Proposed policy (T3-1): acknowledge within 5 business days, label by severity, publish a response log, and state clearly that the **resolution** commitment applies to defects in the service, not to feature requests.

## 4. Release policy

| Item | Today | Proposed |
|---|---|---|
| App releases | No tags, no changelog, no versioned releases; deployment is a manual upload of the working tree | Tag every release; keep a `CHANGELOG.md`; deploy only tagged builds from CI |
| SDK releases | `@pyxis-hq/wallets-kit` published manually from a personal npm account; versions `0.0.0-stage`, `0.1.0-beta.0`, `0.1.0-beta.1`; **no provenance, no CI publishing** | Publish from GitHub Actions with provenance; semantic versioning; migration notes for breaking changes |
| Database migrations | Forward-only, checksummed, one transaction each; applied files are frozen | Keep; add a rollback note to every migration pull request |

## 5. Security disclosure and vulnerability patching

| Item | Today |
|---|---|
| Private reporting | GitHub private vulnerability reporting is enabled; `SECURITY.md` explains how to use it |
| Report handling targets | Acknowledge within 3 business days; first assessment within 10 business days (`SECURITY.md`) |
| Patch commitment | **None.** The RFP requires critical and high vulnerabilities patched within 24 hours (H3) |
| Dependency monitoring | Dependabot alerts and weekly update pull requests; secret scanning with push protection |
| Known unresolved advisories | 22 production advisories (10 high) in the wallet-kit and `shadcn` trees; no upstream fix |

A 24-hour commitment needs: an on-duty rotation for security issues **[TEAM INPUT]**, an automatic alert to that rotation, a documented triage procedure, and a policy for advisories with no upstream fix (isolate, replace or accept with a written reason). This is deliverable T3-1.

## 6. Dependency updates

Dependabot proposes updates weekly (minor and patch grouped, limit of 5 open pull requests) and monthly for GitHub Actions; selected major versions are deliberately ignored with reasons recorded in `.github/dependabot.yml`. Updates are merged only with the CI check passing. **Gap:** CI does not scan, so a vulnerable transitive dependency is found only by Dependabot or a manual `npm audit` (T1-4).

## 7. Community contributions

Anyone may open an issue or pull request under the Apache-2.0 terms stated in `CONTRIBUTING.md`. The review rule is one approving review. **Gap:** no contributor roster exists, so the "one review" rule currently depends on a second maintainer being available **[TEAM INPUT]**.

## 8. Long-term maintenance and operator transition

The RFP expects the project to hand stewardship to a community-appointed operator between months 6 and 12. What must be true by then:

1. The system can be rebuilt from the monorepo by someone outside the team (T3-3).
2. Repository and package ownership can be transferred without breaking protection or publishing (GitHub organization and npm organization owners).
3. A named overlap period exists in which the original maintainers answer questions and fix defects.
4. Hosting costs and credentials are documented so the operator can take them over.
5. The maintainers' continued responsibilities after handover are written down **[TEAM INPUT]**.

## 9. Questions only the team can answer

Who are the maintainers and how many are active? Who triages issues and security reports? Who holds the GitHub and npm organization owner accounts? Is there a legal entity that will sign the SCF agreement and own the infrastructure accounts? What happens to the project if the lead maintainer becomes unavailable?
