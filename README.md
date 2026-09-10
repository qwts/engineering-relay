# Engineering Relay

Reproducible engineering workflows for agents.

An engineering reference library and executable workflow for agents. The 23 guides cover requirements through retirement; reusable skills turn that guidance into scoped procedures, project decisions, implementation tasks, and verifiable evidence.

The runner is a local Node.js CLI. Agents use their own host tools and judgment. The package tracks dependencies, validates artifacts, runs explicitly requested checks, detects stale results, and produces readiness and handoff reports. It does not require an LLM API or an orchestration service.

## Try the complete example

Requires Node.js 22 or later.

```sh
npm ci
npm run example
```

The example implements and tests a CSV utility in an isolated temporary project, saves real command evidence, simulates a handoff, and prints the report location. See the [worked example](examples/feature/README.md).

## Adopt in a project

From this checkout, install a pinned copy into a target project:

```sh
node bin/engineering-relay.mjs install --target /path/to/project --adapter codex
```

Choose `generic`, `codex`, or `copilot`. Existing project instructions are preserved; conflicting skill files cause installation to stop before changes. The runtime and its dependencies are copied into the target's `.engineering/relay/`. No global settings change. A second installation into the same destination is refused so existing runs retain their pinned version.

In the target project, ask the agent to use the engineering-workflow skill for your request, or start a run explicitly:

```sh
node .engineering/relay/bin/engineering-relay.mjs init --project . --id my-feature --profile small --input brief.md --agent my-agent --model unspecified
node .engineering/relay/bin/engineering-relay.mjs next --run .engineering/runs/my-feature
```

The agent follows **intake → requirements → design → implementation → verification → readiness**, loading applicable domain procedures. Choose `service` for a new service or major feature and `critical` for elevated impact. Dedicated `operate` and `retire` workflows share the same evidence and resume contracts.

Read the [usage guide](usage.md), [execution contracts](workflow/guide.md), and [coordinator skill](skills/engineering-workflow/SKILL.md).

## What is recorded

- Scope, impact, domain applicability, and profile rationale.
- Requirements with acceptance criteria and sources; explicit assumptions and questions.
- Architecture alternatives, decisions, tasks, domain plans, and verification checks.
- Implemented changes, documentation, risks, and rollback/recovery plans.
- Actual command or review evidence with source/input fingerprints and timestamps.
- Current readiness, requirement traceability, actor history, and handoff instructions.

`status` and `next` revalidate current state. `verify` is the CI gate and returns nonzero for incomplete or stale work. Valid check results can be reused; failures and interruptions require inspection before intentional retries. Readiness remains separate from release authorization. Review receipts are local records; authenticated reviewer identity must come from the project's review/CI system.

## Reference library

Browse the [complete documentation index](docs/00-documentation_index.md): planning (01–06), development and infrastructure (07–16), operations and retirement (17–22), and documentation style (23).

The [domain catalog](workflow/catalog.json) maps every guide to an executable procedure. The [decision rules](workflow/decision-rules.md) add adaptable defaults, evidence expectations, failure patterns, and illustrative examples. Original guides remain the human-readable reference; they are not all mandatory for every change.

## Maintain and evaluate

```sh
npm test
npm run check
npm run eval
npm run example
npm run lint:markdown
npm pack --dry-run
```

See [evaluation guidance](workflow/evaluation.md) for fresh-agent trials and quality measures. Regenerate native entry points after editing skill metadata with `node scripts/sync-adapters.mjs`. Runtime schemas are in `schemas/`, the runner is in `lib/`, and tests are in `test/`.

The [main branch ruleset](.github/rulesets/main.json) requires pull requests, resolved review conversations, and passing GitHub Actions checks on Node.js 22 and 24 with the branch up to date. Force pushes and deletion are blocked. No second reviewer or bypass actor is configured.

`npm pack` creates a versioned local npm archive that can be installed with `npm install /path/to/archive.tgz`; its executable is `engineering-relay`. This repository does not claim an npm or marketplace publication. Review distribution terms and release policy before external publication. Version history is in [CHANGELOG.md](CHANGELOG.md).

## Format references

Portable procedures follow the [Agent Skills specification](https://agentskills.io/specification). Repository instructions use [AGENTS.md](https://agents.md/). The Codex adapter follows the documented [repository skill discovery paths](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills). These formats provide discovery; the runner and host tools provide execution and verification.
