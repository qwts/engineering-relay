---
name: engineering-data-security
description: Plan and verify the data, migration, identity, and security aspects of an Engineering Relay change when it affects persistent data, access boundaries, or applicable protection requirements.
---

# Data and security procedure

Input: intake impact, confirmed requirements, existing schemas/configuration, applicable policies. Output: data/security domain plans, linked tasks/checks, and supporting evidence in the same run; this is not a separate interview state.

1. Identify actual data classes, owners, stores, consumers, trust boundaries, and relevant access paths. Obtain applicability and retention/hold requirements from project sources rather than treating every named regulation in the reference docs as applicable.
2. For data changes, specify invariants, migration ordering, compatibility, reconciliation, backup/restore, retention/deletion, and rollback constraints. Identify irreversible transformations and require a reviewed recovery/cutover plan before executing them.
3. For identity/security changes, identify who may perform each action on which objects. Plan denial tests across roles/tenants, credential/secret handling, encryption configuration, and relevant audit evidence. A control being selected is distinct from being configured and verified.
4. Add concrete tasks and checks to design. A scan checks its configured scope, not universal security. Record limitations and findings with owners; use review for threat-model or policy conclusions that a command cannot establish.
5. During implementation and verification, inspect the actual configuration and behavior. Collect negative-test, migration, reconciliation, and recovery evidence as applicable. Stop an action when its authorized target, retention decision, or recovery path is unresolved.

References to load by topic: [Data Governance](../../docs/03-data_governance_and_strategy.md), [Security Planning](../../docs/04-security_and_compliance_planning.md), [Database and Storage](../../docs/10-database_and_storage_planning.md), [Recovery](../../docs/14-disaster_recovery_planning.md). Use [decision rules](../../workflow/decision-rules.md) to evaluate alternatives. This procedure prepares engineering evidence; legal/compliance determinations and reviewer identity remain with the project's qualified authorities.
