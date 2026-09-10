---
name: engineering-implementation
description: Implement a planned engineering change in small verifiable increments, keeping requirement traceability, documentation, risks, and rollback behavior current.
---

# Implementation

Input: completed current design and its tasks/checks. Output: actual code/configuration/documentation changes and [implementation.schema.json](../../schemas/implementation.schema.json).

1. Recompute run status and inspect the current worktree. Preserve existing user changes. Select a planned task and verify that its requirements and design are still applicable.
2. Implement the smallest coherent increment that satisfies its acceptance criteria. Add or update tests for meaningful behavior and failure modes. Use existing build/test conventions. Avoid tests that merely mirror the implementation or assert generated wording.
3. Run focused development checks through the host while iterating. Fix failures based on observed output. If the implementation changes a requirement or invalidates a decision, update the upstream artifact and complete affected stages again.
4. Record changed paths and linked requirements. Document behavior users/operators need, relevant unresolved risks, and an actionable rollback or recovery procedure. A baseline file that was deleted can be listed as a change; explain the deletion. Critical work must reference a planned recovery/rollback check.
5. Inspect the final diff against the plan and acceptance criteria. Record and complete implementation against the final source snapshot. Then collect the planned check evidence with the runner; earlier development test output is not automatically evidence for the final snapshot.

Stop dependent execution if a target or side effect is uncertain. Preserve a failed or interrupted attempt and investigate before retrying. The [execution guide](../../workflow/guide.md) defines evidence, retry limits, and resume behavior. Use [Project Structure](../../docs/07-project_structure_planning.md), [Testing Strategy](../../docs/05-testing_strategy.md), and [Documentation Style](../../docs/23-documentation_style_guide.md) where relevant.
