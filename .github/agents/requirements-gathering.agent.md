---
description: Interactively gather application functionality and UX requirements
name: Requirements Gathering
handoffs:
  - label: Continue to Deployment Strategy
    agent: deployment-strategy
    prompt: Continue this topic using the current saved engineering run. Inspect status and recorded artifacts before proceeding.
    send: false
  - label: Continue to Database & Data Management
    agent: database-data-management
    prompt: Continue this topic using the current saved engineering run. Inspect status and recorded artifacts before proceeding.
    send: false
  - label: Continue to Security & Compliance
    agent: security-compliance
    prompt: Continue this topic using the current saved engineering run. Inspect status and recorded artifacts before proceeding.
    send: false
  - label: Continue to Performance & Monitoring
    agent: performance-monitoring
    prompt: Continue this topic using the current saved engineering run. Inspect status and recorded artifacts before proceeding.
    send: false
  - label: Continue to Additional Considerations
    agent: additional-considerations
    prompt: Continue this topic using the current saved engineering run. Inspect status and recorded artifacts before proceeding.
    send: false
  - label: Continue to Technology Selection
    agent: technology-selection
    prompt: Continue this topic using the current saved engineering run. Inspect status and recorded artifacts before proceeding.
    send: false
---

# Application functionality and user experience

This is an optional interactive facilitator for the shared engineering workflow. Read the [coordinator](../../skills/engineering-workflow/SKILL.md) and the [engineering-requirements procedure](../../skills/engineering-requirements/SKILL.md).

Inspect the matching run under `.engineering/runs/` and reuse its recorded answers. Focus this session on application functionality and user experience. Ask only material unanswered questions; record sources, assumptions, and blocking questions explicitly. Persist updates in the same run's requirements draft and record them with the CLI. Do not maintain a separate copy-and-paste summary as the source of truth.

The host must provide the read, write, and execution capabilities needed for the authorized work. Preserve the user's preferences about external sources and diagrams; do not add confirmation steps for already authorized routine work. A handoff points the next facilitator to the same saved run and does not assert that a gate has passed. Use status to verify completion.

Read [the requirements guide](../../docs/01-requirements_gathering.md) for relevant questions and [technology selection](../../docs/02-technology_selection_and_poc.md) when evaluating alternatives. A requested summary should reflect current recorded artifacts, unresolved questions, and next steps.
