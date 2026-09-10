---
name: engineering-workflow
description: Run or resume Engineering Relay for a feature, service, operational change, or retirement, preserving project decisions and collecting verifiable completion evidence.
---

# Engineering workflow

Use this coordinator when the project adopts Engineering Relay or the user requests its engineering workflow. Preserve the user's scope, existing architecture, project instructions, and authorization. An Engineering Relay procedure is not permission to deploy, change access, delete data, or contact others.

1. Read [the execution guide](../../workflow/guide.md) for commands, artifact contracts, and evidence semantics. Inspect the project instructions and existing `.engineering/runs/` before creating a run. Resume a matching run using `status`, `adopt`, and `next`; do not reconstruct its history from memory.
2. For new work, inspect the repository and the brief. Select change, operate, or retire workflow and a provisional small, service, or critical profile. Initialize a run with the relevant requirement-source files and available agent/model provenance.
3. Follow the procedure returned by `next`. Read only the applicable domain references. Ask for missing decisions that materially affect scope or correctness, while continuing independent authorized work. Record facts with sources, assumptions with revisit conditions, and unresolved questions explicitly.
4. Populate and `record` the stage artifact. Run `complete` only when its actual inputs, outputs, and semantic conditions are satisfied. Requirements must trace through tasks, implementation, and checks. Use command evidence for measurable results and actual review receipts for judgment that requires a reviewer.
5. Inspect check definitions before invoking them. Run only checks within the authorized target and tool scope. Investigate a failed/interrupted attempt before an intentional retry. Stop the dependent action on a blocking question, failed gate, uncertain side effect, or exhausted retry budget; continue useful independent work.
6. Generate a report and handoff. Recompute status after source or requirements changes. Readiness describes current evidence and does not authorize the release.

## Routing

| Work | Procedure |
|---|---|
| Scope and impact | [intake](../engineering-intake/SKILL.md) |
| Requirements and uncertainty | [requirements](../engineering-requirements/SKILL.md) |
| Architecture, PoC, tasks, verification plan | [design](../engineering-design/SKILL.md) |
| Data, identity, security | [data and security](../engineering-data-security/SKILL.md) |
| Compute, networking, CI/CD, cost | [platform](../engineering-platform/SKILL.md) |
| Code and infrastructure changes | [implementation](../engineering-implementation/SKILL.md) |
| Tests, UAT, review, readiness | [verification](../engineering-verification/SKILL.md) |
| Observability, recovery, incidents | [operations](../engineering-operations/SKILL.md) |
| Decommissioning | [retirement](../engineering-retirement/SKILL.md) |

One agent can execute these procedures sequentially. Additional agents are an optional host capability, not a workflow dependency. Share recorded artifacts and explicit ownership if delegation is requested. Never treat a handoff sentence or another agent's summary as verification of a completed gate.
