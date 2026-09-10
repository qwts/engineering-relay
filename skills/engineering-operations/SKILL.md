---
name: engineering-operations
description: Plan and verify observability, recovery, performance, or operational remediation for an Engineering Relay change, including bounded incident work and post-launch improvement.
---

# Operations and recovery

Input: operational objective, ownership, service topology, agreed SLO/RTO/RPO, current signals and incident evidence. Output: reliability domain plan, authorized changes or exercise, measured results, and updated runbook.

1. Establish the actual observed state, target, time window, affected users, and known uncertainty. Distinguish an active incident from a planning exercise. For urgent work, keep artifacts concise enough to support the incident without delaying authorized mitigation.
2. Define a bounded action or exercise, owner, success metric, stop conditions, rollback/recovery path, and communication authority. Prepare external communications for review unless the user has authorized sending them.
3. Verify telemetry measures user-relevant behavior and alerts reach the intended responder. Define realistic performance/load conditions. A dashboard existing is distinct from alert delivery or service-objective compliance.
4. For recovery, verify backup configuration, perform an authorized restore to an appropriate isolated target, reconcile data, and measure against agreed targets. If targets or access are missing, record the gap and stop the dependent exercise. Never label a backup job success as proof that restore meets RTO/RPO.
5. Capture runbook steps, actual command/review evidence, limitations, follow-up risks, and lessons. Link improvements back to requirements and checks. Use `operate` for a dedicated operational run or contribute a reliability domain plan to a change run.

Read [Observability](../../docs/12-observability_stack_planning.md), [Disaster Recovery](../../docs/14-disaster_recovery_planning.md), [Performance](../../docs/16-performance_and_optimization_planning.md), and [Post-Launch Operations](../../docs/21-post_launch_operations.md) as applicable. Apply [decision rules](../../workflow/decision-rules.md) and [execution limits](../../workflow/guide.md). An uncertain effect or live process requires inspection, not an automatic second execution.
