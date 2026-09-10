---
name: engineering-retirement
description: Plan and verify an authorized service retirement with consumer migration, retention and hold decisions, archive recovery, and ordered resource termination.
---

# Retirement

Input: retirement decision and scope, consumer/resource inventory, replacement readiness, retention/hold requirements, and existing authorization. Output: critical retire workflow artifacts, ordered cutover plan, evidence of authorized actions, and remaining obligations.

1. Confirm what is retiring, why, who owns the decision, and which consumers and resources remain. Use critical profile and retirement impact; data and reliability plans are required.
2. Verify replacement readiness and consumer migration, including real usage signals and acknowledgments where needed. A replacement deployment alone does not prove consumers have moved.
3. Record authoritative retention, archive access, deletion, and legal-hold decisions. Plan and verify archive restoration where retained data must remain usable. An unresolved hold blocks dependent deletion regardless of a green deployment check.
4. Define ordered cutover, observation, rollback boundaries, resource termination, and final inventory/cost reconciliation. Separate reversible preparation from irreversible actions. Prepare concrete changes before seeking any missing authorization.
5. Execute only authorized actions and collect actual evidence; preserve remaining obligations and owners. Do not infer permission to delete backups, cancel services, or contact consumers from a general planning request.
6. Complete verification/readiness only for the work and outcomes actually achieved. A retirement plan can be ready while deletion remains unexecuted; its requirements and report must state that scope explicitly.

References: [Decommissioning](../../docs/22-decommissioning_and_retirement.md), [Data Governance](../../docs/03-data_governance_and_strategy.md), [Database and Storage](../../docs/10-database_and_storage_planning.md), [Post-Launch Operations](../../docs/21-post_launch_operations.md), and [decision rules](../../workflow/decision-rules.md).
