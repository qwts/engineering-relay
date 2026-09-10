---
name: engineering-design
description: Translate confirmed requirements into justified architecture decisions, a bounded implementation plan, applicable domain plans, and executable or review-based verification checks.
---

# Design and plan

Input: completed intake and requirements. Output: [design.schema.json](../../schemas/design.schema.json), plus referenced plan files when useful.

1. Inspect the current architecture, supported dependencies, and requirement constraints. Apply [decision rules](../../workflow/decision-rules.md); preserve explicit user choices and explain tradeoffs.
2. Record meaningful alternatives, chosen option, rationale, consequences, and revisit conditions. A small change may retain the existing architecture with a short rationale. A risky new technology needs an experiment that tests the actual uncertain constraint; record observed results rather than a proposed PoC as completed work.
3. Define small implementation tasks with stable IDs, affected paths, requirement links, and acceptance. Cover all requirements. Keep the tasks small enough to implement and verify without reopening the entire project plan.
4. Define checks before implementation completion. Each check links requirements, describes what it verifies, identifies inputs, and specifies either command argv plus timeout or a reviewer role. Choose evidence lifetimes from target volatility. Include failure cases; define an actual rollback/recovery check and role-based review for critical work.
5. Add a domain plan for every domain marked required by intake. Use the applicable data/security, platform, operations, or retirement procedure. Shared checks are acceptable only when their behavior verifies each linked claim.
6. Verify consistency across requirements, decisions, tasks, checks, and domain plans, then record and complete design. Missing feasibility evidence or contradictory constraints should remain a blocker or explicit unresolved assumption, not an invented conclusion.

Primary references: [Technology Selection and PoC](../../docs/02-technology_selection_and_poc.md), [Architecture Planning](../../docs/06-architecture_planning.md), and [Testing Strategy](../../docs/05-testing_strategy.md). Read domain-specific references as needed. Use [the execution guide](../../workflow/guide.md) for command/review contracts.
