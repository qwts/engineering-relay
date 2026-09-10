# Engineering decision rules

These are proposed, adaptable defaults. Examples are illustrative and are not represented as incidents at Apple or any other employer. Add reviewed, anonymized experience as Engineering Relay evolves. Record the context and exception whenever a project chooses differently.

## Architecture and technology

Start from the existing supported architecture for a bounded feature. For a new service, consider a cohesive deployable unit while examining operational ownership and failure boundaries. Separate services when independent ownership, release cadence, scaling, or isolation provides enough benefit to justify distributed failure handling. Validate the riskiest unknown with a small executable experiment before committing to a platform.

- Evidence: domain boundaries, measured bottleneck or scaling forecast, ownership, deployment independence, failure behavior, operating cost.
- Revisit: ownership boundaries change, the measured workload outgrows the design, or failure coupling violates the agreed objectives.
- Sound example: an independently owned ingestion workload needs isolated scaling and a separate availability objective; the decision includes queue behavior and failure recovery.
- Weak example: use six services because microservices are the company standard, with no ownership or operational plan.

Build versus buy should compare the required behavior, customization constraints, integration risk, support model, ongoing costs, exit path, and strategic value. An existing product meeting most features can still fail a mandatory residency or integration requirement. A small PoC should prove that mandatory constraint rather than a generic happy-path demo.

## Data and security

Classify the actual data and identify trust boundaries before selecting controls. Separate a proposed policy from its implemented configuration and verified behavior. Data changes need invariants, migration reconciliation, failure handling, and an explicit retention/deletion decision. Existing identity integrations should usually be extended before introducing another identity system.

- Evidence: inventory and ownership, access matrix, threat scenarios, negative authorization tests, migration reconciliation, encryption configuration, retention rules.
- Revisit: a new data class, consumer, trust boundary, jurisdiction, or permission model appears.
- Sound example: an export filters by authenticated tenant and has cross-tenant denial tests and recorded retention behavior.
- Weak example: the service uses HTTPS, therefore all privacy and authorization requirements are met.

Regulatory and contractual applicability must come from qualified project sources. Engineering Relay is a collection of engineering procedures, not a declaration that a system is legally compliant.

## Platform and cost

Prefer a supported platform compatible with existing deployment and operational practices. Introduce orchestration, a new database, or another region when workload, reliability, isolation, or explicit constraints justify it. Include operational effort and steady-state costs as well as runtime prices. Estimates must name assumptions, traffic, units, and date.

- Evidence: representative workload, capacity headroom, scaling limits, environment differences, cost model, operational skills, rollback path.
- Revisit: observed cost or demand diverges from the recorded assumptions.
- Sound example: bursty asynchronous work uses an existing managed queue and workers with bounded concurrency, measured backlog recovery, and a budget alert.
- Weak example: add Kubernetes for future scale before identifying a workload requirement or an owner.

## Testing and release

Select checks from acceptance criteria and likely failure modes. A coverage percentage measures exercised lines, not acceptance or correctness. Prefer checks that would fail for the targeted bug, broken authorization, incompatible contract, or violated performance requirement. Use human review for behavior automated tools cannot adequately assess.

- Evidence: requirement-to-check links, representative fixtures, negative cases, measured thresholds, actual output, limitations, reviewer conclusions.
- Revisit: behavior or deployment target changes, new failure modes appear, or evidence expires.
- Sound example: a CSV feature tests embedded quotes, commas, line breaks, and empty input against independently specified expected output.
- Weak example: a test recreates the implementation algorithm and compares the two results.

Readiness consumes established requirements and decisions. Do not restart a requirements interview at launch. Resolve contradictions or changed assumptions, verify relevant evidence, and retain the project's existing release authority.

## Operations, recovery, and retirement

Distinguish backup configured, restore executed, and recovery target achieved. Measure recovery against a representative dataset and known target. Remediation should have bounded scope, stop conditions, and a reversible path where feasible. A retirement requires known consumers, retention/hold decisions, an archive restore exercise when applicable, and an ordered cutover and termination plan.

- Evidence: agreed recovery objectives, timed restore/reconciliation results, alert delivery, runbook exercise, consumer acknowledgments, authorized retention decisions, resource inventory before/after.
- Revisit: topology, stored data, dependencies, operating ownership, or legal hold status changes.
- Sound example: restore to an isolated target, reconcile records, measure elapsed time, and only then conclude that the recovery objective is satisfied.
- Weak example: a successful backup job is treated as proof of recoverability, or resources are deleted because a replacement deploy succeeded without checking consumers.
