# Budget assumptions

**Status:** a method for building a defensible budget. **No dollar amount is proposed here.** The auditor does not know the team's rates, size or the vendor quotes, and the instructions forbid inventing a figure. Every amount below is a **team input** (marked `[TEAM INPUT]`) or a formula over team inputs.
**Evidence basis:** the effort estimates in [roadmap-and-milestones.md](roadmap-and-milestones.md); the SCF budget rules summarised in the Build Application Guide (budget capped at $150,000 in XLM; no marketing, audits, bounties, giveaways or legal fees; costs for future development only).
**Related:** [../form-answers.md](../form-answers.md) section B.

## 1. Rules that shape the budget

| Rule | Consequence |
|---|---|
| Maximum award is $150,000 paid in XLM; requesting the maximum is **not** expected and overreach performs poorly in review | Derive the figure from effort; do not default to the cap |
| The budget covers future development of the product only | No past work, no general operations or overhead |
| No marketing or promotion, bounties, giveaways | Adoption outreach cost is **excluded**; engineering effort for instrumenting pilot projects is allowed |
| Audit costs are not in the budget; audit credits come through SCF's Audit Bank | Do **not** budget an external security audit |
| Legal fees and entity registration are not fundable | The legal review required by the privacy deliverable (T2-3) **cannot be paid from the award** under this rule unless SCF confirms otherwise. **Ask SCF** before including it; otherwise the team funds it |
| Every item must relate to a deliverable with a cost | The mapping below ties each line to a deliverable |
| USD is converted to XLM at the CF Benchmarks XLMUSD_RR price on each payment day | Price risk sits with the team |
| Payment profile: 10, 20, 30, 40 percent over Tranches 0 to 3 **(verify on the live form)** | The engineering effort is front-loaded; see section 5 |

## 2. Cost model

```
Engineering cost of deliverable d  =  effort_pw(d)  x  BLENDED_WEEKLY_RATE        [TEAM INPUT: rate]
Direct cost of deliverable d       =  sum of the vendor lines assigned to d         [TEAM INPUT: quotes]
Budget(d)                          =  Engineering(d) + Direct(d)
Award request                      =  sum over all funded deliverables, <= 150,000, rounded by the team
```

`BLENDED_WEEKLY_RATE` is a single input so the team can justify it once (for example from payroll or contractor invoices) and the SCF reviewer can check it. The same rate should apply to every deliverable unless a specialist is hired for one (for example a database or SRE contractor), in which case state the specialist rate separately.

## 3. Engineering effort by deliverable (estimates, person-weeks)

| ID | Deliverable | Effort (pw) | Share of core engineering |
|---|---|---|---|
| T1-1 | Real, pinned Umami integration | 3.0 | 6.0% |
| T1-2 | Ingestion hardening and protocol support | 5.0 | 10.0% |
| T1-3 | Rollups and retention | 3.0 | 6.0% |
| T1-4 | Test and CI hardening | 3.0 | 6.0% |
| T1-5 | Read API and operator-issued keys | 2.5 | 5.0% |
| T1-6 | Containers and IaC baseline | 3.5 | 7.0% |
| T2-1 | Threat model and launch-gate security fixes | 2.5 | 5.0% |
| T2-2 | Monitoring, operations baseline, backup and restore | 4.0 | 8.0% |
| T2-3 | Privacy and compliance (engineering part) | 4.0 | 8.0% |
| T2-4 | Enrollment and removal controls | 2.5 | 5.0% |
| T2-5 | Operator dashboards | 3.0 | 6.0% |
| T2-6 | Published load test | 3.0 | 6.0% |
| T3-1 | Production launch with measured service levels | 3.0 | 6.0% |
| T3-2 | Adoption proof (engineering support) | 3.0 | 6.0% |
| T3-3 | Handover package and dry run | 3.0 | 6.0% |
| T3-5 | Final report and remediation | 2.0 | 4.0% |
| **Core total** | | **50.0** | **100%** |
| T3-4 | SDK and release engineering (**stretch**, not in the core request) | 3.0 | n/a |

**Allocation of the engineering budget** to a deliverable is its share above times the engineering subtotal. Example of the arithmetic only: if the engineering subtotal were `E`, deliverable T1-2 would carry `0.10 × E`. The team sets `E` from its own rate: `E = 50 × BLENDED_WEEKLY_RATE`.

## 4. Direct costs (team inputs, all to be quoted)

| Line | Deliverable | Notes | Amount |
|---|---|---|---|
| Staging and production hosting for the funded period | T1-6, T2-x, T3-1 | Application, PostgreSQL, Umami, docs site; quote from the provider | `[TEAM INPUT]` |
| Managed PostgreSQL with backups and failover (if the availability option in the gap analysis B-4 is chosen) | T2-2, T3-1 | Drives most of the infrastructure cost | `[TEAM INPUT]` |
| Monitoring, alerting and log retention service | T2-2 | Or self-hosted at engineering cost | `[TEAM INPUT]` |
| Load-test infrastructure (generators, a staging database) | T2-6 | Short-lived | `[TEAM INPUT]` |
| Domain and TLS | T3-1 | Domain already owned; renewal about the registrar's price | `[TEAM INPUT]` |
| Email or notification service for alerts | T2-2 | If needed | `[TEAM INPUT]` |
| Legal review of privacy statements | T2-3 | **May not be fundable; ask SCF** | `[TEAM INPUT / may be excluded]` |

## 5. Cash-flow check

| Payment | Share | Engineering effort delivered by then |
|---|---|---|
| Tranche 0 | 10% | none |
| Tranche 1 | 20% | about 40% of core effort (T1) |
| Tranche 2 | 30% | about 78% cumulative (T1 + T2) |
| Tranche 3 | 40% | 100% |

The team funds roughly 40% of the work (Tranche 1) with only the Tranche 0 payment in hand, and 78% before the Tranche 3 payment. If that is not possible, shift effort later (move T2-5 and part of T2-6 into Tranche 3) or reduce the Tranche 1 scope. **This is a decision for the team**, not an assumption.

## 6. Obligations outside the award

The RFP requires hosting and support for **12 months after the final tranche is approved** (rows H5, H6). The award pays for development; it is unclear that it also pays for that period. The team must either price the hosting period into the request (if SCF allows it) or commit to funding it separately. **Obtain SCF's answer in writing.**

## 7. What must not be in the request

Marketing and outreach to find pilots; token or XLM incentives; an external security audit; past work (everything built before the award, including this audit); general overhead; legal fees (unless SCF confirms).
