# Usage

Start with the [coordinator](skills/engineering-workflow/SKILL.md). Detailed commands, schemas, profile rules, and evidence semantics are in the [execution guide](workflow/guide.md).

## Agent entry points

| Environment | Start |
|---|---|
| Generic coding agent | Read AGENTS.md and follow the linked coordinator |
| Codex | Invoke `$engineering-workflow`, or let the repository skill match an engineering workflow task |
| VS Code Copilot | Select Engineering Relay custom agent |
| CLI / CI | Run `engineering-relay --help`; use `verify --run RUN` for a completion gate |

Installed projects use `node .engineering/relay/bin/engineering-relay.mjs` if the executable is not on PATH. In this source repository use `node bin/engineering-relay.mjs`. The installer supplies native discovery files for the selected adapter and preserves existing instruction prose.

## Typical request

> Use the engineering workflow to implement the feature in brief.md. Inspect the current repository, choose an appropriate profile, record decisions and acceptance criteria, implement and verify the change, and leave a readiness report and handoff.

The agent should inspect available evidence before asking questions. It records missing information as questions, keeps assumptions distinct from confirmed requirements, and reads only relevant domain guides. The workflow does not require one agent per topic or a full enterprise launch checklist for a bounded feature.

## Run lifecycle

1. `init` creates the run and blank drafts.
2. `record` validates and saves intake, requirements, design, or implementation artifacts.
3. `complete` checks the stage contract and predecessor evidence.
4. `check` executes one planned command or imports one real review receipt.
5. `complete` verification/readiness verifies current results without executing more commands.
6. `report` writes Markdown/JSON readiness and handoff files.
7. `adopt`, `status`, and `next` resume with a new actor and current-state validation.

Use `configure` to change profile with a recorded reason; expect prior gates to become stale. Failed or interrupted checks require investigation and `--rerun` for an intentional retry. Use `recover` only after verifying that the lock's same-host process is stopped. A passing readiness result does not authorize release, production testing, or deletion.

## Existing Copilot interview commands

The existing Requirements Gathering, Deployment Strategy, Database & Data Management, Security & Compliance, Performance & Monitoring, Additional Considerations, and Technology Selection agents remain available as optional facilitators. Their handoffs use the same run records. They no longer define separate copies of workflow policy.

The `/requirements-*`, `/deployment-*`, `/database-*`, `/security-*`, `/performance-*`, and `/additional-*` prompts still provide focused interview entry points. Summary prompts should read saved facts, assumptions, and open questions. The host needs appropriate write/execute capabilities to persist artifacts and run authorized checks; an interview-only host can gather a draft but must not claim the execution workflow completed.

For a reproducible demonstration, run `npm run example` and inspect the printed paths. For behavioral evaluation, see [workflow/evaluation.md](workflow/evaluation.md).
