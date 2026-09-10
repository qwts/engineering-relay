---
name: engineering-requirements
description: Convert a project brief and repository evidence into traceable requirements, acceptance criteria, constraints, assumptions, and unresolved questions for an Engineering Relay run.
---

# Requirements

Input: completed intake and authoritative project sources. Output: [requirements.schema.json](../../schemas/requirements.schema.json).

1. Read intake and existing records. Extract requested behavior and constraints from the brief, issue, or project docs; record the specific file or user-message reference. A file-kind source is one exact project-relative file path, optionally followed by a heading fragment. Do not concatenate multiple files or prose into that path. Reuse established answers.
2. Give each requirement a stable ID and an observable acceptance criterion. For behavior, include the trigger and expected result. For performance/recovery, record the agreed metric, load/data conditions, and threshold. Do not invent those targets.
3. Separate confirmed requirements, constraints, assumptions with basis/revisit conditions, and questions with an owner and blocking flag. An inferred requirement remains an assumption or question until confirmed. Identify conflicting requirements and ask the owner to resolve the conflict; recording both without recognizing the conflict is insufficient. Keep temporary agent stop/resume instructions in handoff notes rather than durable product constraints, unless they express an ongoing project requirement.
4. Ask only material unanswered questions. Interactive interview prompts can help elicit answers, but persist them in the same run. If a requirement source changes, update the record and reassess dependent decisions.
5. Record the artifact. Complete only when acceptance is testable and no blocking questions or unconfirmed inferred requirements remain. Continue independent work while a blocking answer is pending.

Use [Requirements Gathering](../../docs/01-requirements_gathering.md), and load [Data Governance](../../docs/03-data_governance_and_strategy.md) or [Security Planning](../../docs/04-security_and_compliance_planning.md) only when applicable. The [execution guide](../../workflow/guide.md) explains recording and gates.

Example: “CSV export supports embedded quotes” becomes an acceptance example with independently specified input/output. “Fast export” requires an agreed workload and threshold before it can become a measured performance gate.
