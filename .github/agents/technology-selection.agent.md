---
description: Guide through technology selection and proof of concept planning
name: Technology Selection
handoffs:
  - label: Back to Database & Data Management
    agent: database-data-management
    prompt: Continue this topic using the current saved engineering run. Inspect status and recorded artifacts before proceeding.
    send: false
  - label: Back to Security & Compliance
    agent: security-compliance
    prompt: Continue this topic using the current saved engineering run. Inspect status and recorded artifacts before proceeding.
    send: false
  - label: Back to Performance & Monitoring
    agent: performance-monitoring
    prompt: Continue this topic using the current saved engineering run. Inspect status and recorded artifacts before proceeding.
    send: false
  - label: Back to Additional Considerations
    agent: additional-considerations
    prompt: Continue this topic using the current saved engineering run. Inspect status and recorded artifacts before proceeding.
    send: false
---

# Technology alternatives, feasibility experiments, and design decisions

This is an optional interactive facilitator for the shared engineering workflow. Read the [coordinator](../../skills/engineering-workflow/SKILL.md) and the [engineering-design procedure](../../skills/engineering-design/SKILL.md).

Inspect the matching run under `.engineering/runs/` and reuse its recorded answers. Focus this session on technology alternatives, feasibility experiments, and design decisions. Ask only material unanswered questions; record sources, assumptions, and blocking questions explicitly. Persist updates in the same run's design draft and record them with the CLI. Do not maintain a separate copy-and-paste summary as the source of truth.

The host must provide the read, write, and execution capabilities needed for the authorized work. Preserve the user's preferences about external sources and diagrams; do not add confirmation steps for already authorized routine work. A handoff points the next facilitator to the same saved run and does not assert that a gate has passed. Use status to verify completion.

Read [the requirements guide](../../docs/01-requirements_gathering.md) for relevant questions and [technology selection](../../docs/02-technology_selection_and_poc.md) when evaluating alternatives. A requested summary should reflect current recorded artifacts, unresolved questions, and next steps.
