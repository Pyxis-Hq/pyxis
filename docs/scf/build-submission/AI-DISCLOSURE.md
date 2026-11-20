# AI usage disclosure (draft for team confirmation)

**Status:** draft. It records only what can be **substantiated from the repository and from the work sessions in which this package was produced**. Everything else is listed as unknown. **The team must confirm, correct and own every statement before it is submitted.** The SCF Build Application Guide says Open Track reviewers expect disclosure of AI-generated or AI-assisted artifacts; the RFP track page does not say the same, but disclosure is safer than silence.
**Evidence basis:** `AGENTS.md`, `skills-lock.json`, `.gitignore` (lines 49-53), the git history, and the audit session itself.
**Related:** [EVIDENCE-REGISTER.md](EVIDENCE-REGISTER.md), [SUBMISSION-READINESS.md](SUBMISSION-READINESS.md).

## 1. What the repository shows

| Evidence | What it shows | What it does not show |
|---|---|---|
| `AGENTS.md` | A block written by `next dev` for AI coding agents ("This is NOT the Next.js you know"); it is framework tooling output, not authorship | Who wrote any code |
| `skills-lock.json` | A lockfile pinning AI-assistant "skills" (design and animation guidance) from public repositories such as `emilkowalski/skills` | That any particular file was generated |
| `.gitignore` lines 49-53 | Local AI-assistant tooling folders (`.agents/`, `.claude/`, `.github/agents/`, `.github/skills/`) are deliberately not committed | The extent of use |
| Git history | 26 commits, one human author | Whether AI assisted. **The team's policy is to commit under the human maintainer's name with no AI co-author trailer, so the history cannot show AI involvement either way** |

## 2. What can be substantiated about this work

The following was done in working sessions with an AI coding assistant (Claude Code, Anthropic) operated by the maintainer, and is substantiated by the session record the team holds:

- Design-system documentation, the dark redesign of the web application, and the landing page.
- The wallet SDK package `@pyxis-hq/wallets-kit` (restructuring into a workspace package, the core client, React bindings, tests, build configuration, README) and its npm release.
- The Fumadocs documentation site (`apps/docs`) and its content, including "Run Pyxis in production".
- The documentation set (README, TECHNICAL, SECURITY, CONTRIBUTING, handover plan, SDK specification, RFP matrix and checklist) and this SCF audit package.
- Repository operations: renaming, dependency triage, continuous-integration fixes, the Railway deployment and domain setup.

In every case the maintainer directed the work, reviewed the output and approved each commit and deployment. The assistant executed commands in the maintainer's environment.

## 3. What is unknown (team must answer)

| Question | Why it matters |
|---|---|
| Who wrote the first version of the MVP code (the schema, ingest, authentication, dashboards), and with what tools? | The earliest commits predate this audit's evidence; the audit cannot attribute them |
| Were any third-party code snippets, templates or generated assets copied in, and under what licences? | Apache-2.0 compatibility; the repository started from `create-next-app` |
| Was any AI model used to generate tests, and were they reviewed line by line? | Reviewers weigh test quality |
| Which AI tools, models and versions, if any, were used by other team members? | Complete disclosure |
| Is there a policy on pasting private data into AI tools? | Privacy |

## 4. Proposed statement (to edit)

> Parts of this project's code, tests and documentation were produced with the assistance of an AI coding assistant (Claude Code, by Anthropic), used under the direction of the maintainers, who reviewed and approved every change before it was committed or deployed. The first version of the MVP was written by `[TEAM INPUT: who and with what tools]`. AI assistants were not given access to production secrets, and `[TEAM INPUT: confirm]`. The audit documents in `docs/scf/build-submission/` were prepared with an AI assistant from direct inspection of the repository and the execution of its test suite; their claims are tied to the files and logs cited in the evidence register.

## 5. Practices that make AI-assisted work verifiable here

Every factual claim in this package carries a file, line, test or log reference; statuses distinguish "implemented" from "implemented but not independently verified"; findings that contradict the project's own documents are reported, not hidden. A reviewer can therefore check the work without trusting its author, human or machine.
