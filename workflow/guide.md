# Executing Engineering Relay

This package turns the SDLC guides into procedures, structured project records, and executable gates. It supports a bounded feature, a new service, an operational change, or a retirement. The agent supplies engineering judgment and uses its host's tools; the CLI stores progress and verifies evidence. No model API or particular agent framework is required.

## Start or resume

Use Node.js 22 or later. From this repository run `npm ci`, then invoke `node bin/engineering-relay.mjs`. A consuming project can install the package with one command:

```sh
node /path/to/engineering-relay/bin/engineering-relay.mjs install --target /path/to/project --adapter codex
```

The installer copies a pinned runtime, docs, schemas, and skills into `.engineering/relay/`, including its runtime dependencies. It merges a marked block into existing instructions and refuses conflicting skill files. It does not change global agent settings. Available adapters are `generic` (AGENTS.md), `codex` (AGENTS.md and repository skill entry points), and `copilot` (AGENTS.md, a custom agent, and a shared-instructions pointer).

In the consuming project:

```sh
node .engineering/relay/bin/engineering-relay.mjs init --project . --id export-feature --profile small --input brief.md --agent coding-agent --model supplied-by-host
node .engineering/relay/bin/engineering-relay.mjs next --run .engineering/runs/export-feature
```

`--input` is repeatable. Include requirement sources such as the brief, constraints, or agreed targets. Do not list a source file that the implementation is expected to change unless a change to it should reopen the requirements. Source code is independently fingerprinted at implementation and verification. Record the actual model version if the host exposes it; otherwise use `unspecified` rather than guessing.

The runner writes blank templates into the run's `drafts/`. Empty fields deliberately fail validation. Populate each draft using repository evidence and user instructions, then record and complete it:

```sh
node .engineering/relay/bin/engineering-relay.mjs record --run .engineering/runs/export-feature --stage intake --file .engineering/runs/export-feature/drafts/intake.json
node .engineering/relay/bin/engineering-relay.mjs complete --run .engineering/runs/export-feature --stage intake
```

Repeat for requirements, design, and implementation. Record persists schema-valid work even if semantic questions still block completion. `complete` validates the stage and its dependencies; it never runs tools on the agent's behalf. `status` and `next` re-read current files instead of trusting a saved completed flag.

## Choose scope and applicability

The profiles in [catalog.json](catalog.json) are defaults, not substitutes for explicit project requirements:

| Profile | Use | Additional expectations |
|---|---|---|
| small | Bounded change in an existing system | Relevant requirements, design rationale, implementation, and checks |
| service | New service or substantial feature | Platform, security, and reliability plans |
| critical | Elevated data, identity, availability, or retirement impact | Role-based review and verified rollback/recovery |

The agent must assess the actual impact. A profile name cannot override an applicable control. Intake marks each of eight domains required or not applicable with a reason. Product and quality are always required. Data, identity, infrastructure, public APIs, production, and retirement activate additional domains; a new service cannot use `small`. The agent may require more domains than these minimum rules. It must also add any explicit customer or organization requirements regardless of profile.

Use `configure --run RUN --profile critical --reason "..."` if the assessed impact changes. This invalidates prior receipts. Then update intake and revisit affected decisions. Unclear impact belongs in questions, not a guessed low-risk classification.

`--workflow operate` uses the same gates for operational work and requires reliability. `--workflow retire` requires the critical profile, retirement impact, data handling, and recovery/review checks. These workflows prepare and verify the authorized work; they do not automatically perform production changes, failover, or deletion.

## Stage contracts

| Stage | Procedure | Required output | Completion evidence |
|---|---|---|---|
| intake | engineering-intake | Scope, exclusions, impact, profile reason, applicability | Every domain considered; profile and impact consistent |
| requirements | engineering-requirements | Identified requirements with measurable acceptance, constraints, assumptions, questions | Sources recorded; no blocking question or unconfirmed inferred requirement |
| design | engineering-design plus applicable domain procedures | Options and decisions, implementation tasks, command/review checks, domain plans | Valid references; every requirement covered by tasks and checks; every required domain planned |
| implementation | engineering-implementation | Actual changes, documentation, risks, rollback procedure | Referenced files exist or are recorded baseline deletions; requirement coverage; critical rollback checks defined |
| verification | engineering-verification | Runner-created command logs or imported review receipts | Every planned check passes for the current source and inputs; no unresolved high/critical risk |
| readiness | engineering-verification | Derived readiness report and handoff | All earlier gates and evidence still valid |

The four authored artifacts use the JSON schemas in [schemas](../schemas). Templates live in [templates](templates). A file-kind requirement source is one exact project-relative path with an optional heading fragment; give separate records separate sources rather than putting multiple paths in one string. Verification and readiness cannot be marked complete by submitting an artifact with `passed: true`.

Decisions must list at least two alternatives, the chosen option, rationale, consequences, and conditions for revisiting the choice. A small change can record the existing design and one considered alternative in a few sentences. Domain plans may share checks when the same test actually covers their claims; use a dedicated plan file only when it adds useful detail. Larger plans belong in project docs and are referenced by path. All 23 reference guides map to domains in the catalog, including the documentation style guide.

## Evidence collection

Define checks in the design before completing implementation. A command check contains an argv array, description, requirement IDs, explicit input files, timeout (1–300 seconds), and evidence lifetime (`maxAgeHours`). A review check names the reviewer role and the same traceability/input/lifetime fields. Select expiration and thresholds from the project requirements, not a universal coverage percentage or arbitrary performance target.

```sh
node .engineering/relay/bin/engineering-relay.mjs check --run .engineering/runs/export-feature --check TEST-1
node .engineering/relay/bin/engineering-relay.mjs complete --run .engineering/runs/export-feature --stage verification
node .engineering/relay/bin/engineering-relay.mjs complete --run .engineering/runs/export-feature --stage readiness
node .engineering/relay/bin/engineering-relay.mjs report --run .engineering/runs/export-feature
```

`check` explicitly executes the configured argv with the host's permissions in the project root. There is no implicit shell and no automatic retry. Inspect the command and follow existing authorization before invoking it. Use local or isolated test targets; the package does not authorize production load tests or destructive exercises. The runner captures stdout, stderr, exit status, tool environment, source fingerprint, timestamps, and actor. Output is bounded to 4 MiB and timeout is enforced on the direct child process. Checks should terminate their own subprocess trees; the runner is not a sandbox or process supervisor for background jobs. Avoid commands that print credentials or sensitive records because logs are retained locally.

For a review, obtain an actual receipt using [review.schema.json](../schemas/review.schema.json), then import it with `check --check REVIEW-1 --review-file review.json`. The receipt contains reviewer, role, pass/fail result, summary, and an authoritative reference (for example a reviewed PR or signed review artifact). Agents must not invent reviewers, approvals, measurements, or receipt references. The CLI validates format, required role, current context, and file integrity; it cannot authenticate reviewer identity. An organization that requires authenticated approvals should collect these through its existing CI/review system and restrict who can write/import receipts.

A fresh passing check is reused. A failed attempt requires inspection and an explicit `--rerun`; the default limit is three attempts per check/context. A source or plan change creates a new context. Retries do not erase previous results. The latest attempt wins, so an older pass cannot hide a subsequent failure. Evidence expiration, missing logs, edited review receipts, or changed source makes a gate unverified or stale.

Checks that generate build outputs should write to paths ignored by Git. In Git repositories the source snapshot includes tracked files and nonignored untracked files, including deletions. `.engineering/`, `.git/`, and `node_modules/` are excluded. Important ignored inputs must be listed in `inputPaths` (for example an environment-specific test configuration). Changes to those inputs still invalidate the relevant evidence. For non-Git directories, all ordinary files outside the same exclusions are fingerprinted. External infrastructure state is not observable through a source hash: use suitably short evidence lifetimes and rerun live verification when the target changes.

High or critical unresolved risks block verification. Acceptance and mitigation require an owner, concrete resolution, and a `check:ID` reference to a planned check. Acceptance must reference a review check. All those checks must pass before verification completes, while the engineering reviewer evaluates whether the resolution is justified.

## Resume, change, and handoff

New Engineering Relay installations use `.engineering/relay/`. Earlier installations under `.engineering/playbook/` remain pinned and are not upgraded in place. The serialized `playbook` field is retained for state/report compatibility. Evaluate the renamed package in a separate checkout and start a new run.

```sh
node .engineering/relay/bin/engineering-relay.mjs status --run .engineering/runs/export-feature
node .engineering/relay/bin/engineering-relay.mjs adopt --run .engineering/runs/export-feature --agent next-agent --model supplied-by-host
node .engineering/relay/bin/engineering-relay.mjs next --run .engineering/runs/export-feature
```

Authoritative records live in `state.json`, `artifacts/`, and `evidence/`. `report.json`, `report.md`, and `handoff.md` are regenerable views. Status distinguishes blocked, ready, complete, and stale stages; evidence can be unverified, stale, pass, or fail. After an upstream change, reevaluate downstream decisions, record corrections, and complete stages in dependency order. Repeating `complete` with unchanged inputs is a no-op. `adopt` records the new agent without discarding decisions or rerunning checks.

Mutations use a per-run lock with a PID and hostname. Read-only inspection is possible while work is running. After an interruption, inspect the lock owner and attempt logs. `recover` removes a lock only when its same-host owner process no longer exists. It never reruns the interrupted action. A live PID or foreign-host lock requires further inspection; elapsed time is not evidence of completion. An interrupted check remains unverified and requires `--rerun` after its effects are understood.

Engineering Relay version, content fingerprint, and runtime dependency versions are pinned per run. Changing a procedure, schema, runner, reference guide, or runtime dependency makes that package incompatible with existing receipts. A different Node version or platform invalidates check evidence. The npm archive bundles the locked runtime dependencies. For other toolchains, include their lockfiles/configuration in check inputs and capture their version output when relevant. Keep the original installed package for existing runs; evaluate a new version in a separate checkout/new run. The first release deliberately refuses in-place installation over an existing package. Commit reusable decisions and appropriate project records under your organization's data policy; logs and snapshots may contain sensitive details. Do not copy secrets into requirements or evidence. A local folder is an audit trail for cooperating agents, not tamper-resistant attestation against an actor who can rewrite its state and checks.

## CI and evaluation

Use `engineering-relay verify --run RUN` as a CI gate. It returns exit 1 when anything is incomplete, stale, invalid, or failed. `status` and `report` are inspection commands and return exit 0 for a well-formed incomplete run. Reporting readiness does not authorize a deployment; integrate existing release authority separately. The package's [CI workflow](../.github/workflows/validate.yml) validates the runner, adapters, package, and worked example. Consumers can run `verify` after producing their own evidence in a controlled workspace.

Run `npm test`, `npm run check`, and `npm run example` when changing this package. `npm run eval` runs seeded workflow scenarios. [Evaluation guidance](evaluation.md) covers behavioral testing and quality measures; deterministic gate tests alone do not establish the quality of engineering judgment. The worked [feature example](../examples/feature/README.md) exercises requirements through readiness and an agent handoff with a real implementation and test.
