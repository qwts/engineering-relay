---
name: engineering-verification
description: Verify an implemented Engineering Relay change against its requirements, collect current command and review evidence, and produce a readiness and handoff report.
---

# Verification and readiness

Input: completed implementation, agreed checks, requirements, and current source. Output: runner-created evidence and derived readiness/handoff reports.

1. Recompute status. Review the diff and requirement/task/check traceability. Assess whether the planned tests actually establish the acceptance criteria, including failure modes. If coverage is insufficient, update design and affected stages before claiming verification.
2. Inspect each command, inputs, target, timeout, and expected result. Run within the host's existing authorization using `check`. Pass/fail must come from real execution; do not replace a failed command with an easier check to make a gate green.
3. For a planned review, obtain the actual reviewer conclusion and reference, then import its schema-valid receipt. Do not impersonate a stakeholder or treat an agent's own assertion as an authenticated approval. Record limitations of automated accessibility, security, performance, and usability checks.
4. Investigate failures; revise implementation and rerun affected checks intentionally. Preserve prior evidence. An expired, changed, missing, interrupted, or wrong-target result cannot satisfy a gate. Resolve high/critical risks with evidence and an owner.
5. Complete verification, then readiness. Generate the report. Launch readiness consumes existing decisions and evidence; ask again only when a material answer is missing, inconsistent, or has changed.
6. Provide the current result, evidence paths, unresolved questions/risks, limitations, and next action. Follow the project's release authority separately. A ready report does not perform or authorize deployment.

Use [Testing Strategy](../../docs/05-testing_strategy.md), [UAT and Pilot](../../docs/17-uat_and_pilot.md), [Final Validations](../../docs/18-final_validations.md), [Training and Change Management](../../docs/19-end_user_training_and_change_management.md), [Launch Checklist](../../docs/20-launch_checklist.md), and [Documentation Style](../../docs/23-documentation_style_guide.md) according to applicability. Technical readiness does not substitute for user acceptance or required stakeholder review. See [the execution guide](../../workflow/guide.md) for command and review receipt schemas.
