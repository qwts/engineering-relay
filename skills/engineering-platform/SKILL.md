---
name: engineering-platform
description: Plan the applicable repository, infrastructure, compute, networking, delivery, and cost changes for a service or infrastructure change in Engineering Relay.
---

# Platform procedure

Input: confirmed requirements, design decisions, current infrastructure and delivery configuration. Output: platform domain plan with implementation tasks and checks.

1. Inspect the supported stack, repository conventions, environments, ownership, workload, deployment constraints, and cost assumptions. Extend existing practices when they satisfy requirements.
2. Compare realistic compute/storage/networking choices using [decision rules](../../workflow/decision-rules.md). Record the required capacity, scaling boundary, environment isolation, failure behavior, maintenance effort, and dated cost estimate with units and assumptions. Treat an estimate as an estimate.
3. Plan repository/IaC changes, secrets references, build/test commands, promotion and rollback, health checks, and resource ownership. Reference secrets by provider/key identity; do not write credentials into Engineering Relay artifacts.
4. Specify appropriate checks: configuration validation, plan/diff review, build reproducibility, contract tests, health probes, load/scale measurements, or cost review. A valid IaC plan is evidence of the proposed configuration, not proof that production has that configuration.
5. Implement only the authorized changes. Capture actual results during verification, including target and limitations. Stop before an unapproved external mutation; prepare its concrete plan and expected effects first.

Load only relevant guides: [Project Structure](../../docs/07-project_structure_planning.md), [Infrastructure](../../docs/08-infrastructure_guidelines.md), [Compute](../../docs/09-compute_selection.md), [Networking](../../docs/11-networking_and_load_balancing.md), [CI/CD](../../docs/13-cicd_planning.md), [FinOps](../../docs/15-cost_optimization_and_finops.md), [Performance](../../docs/16-performance_and_optimization_planning.md). Coordinate reliability with [operations](../engineering-operations/SKILL.md).
