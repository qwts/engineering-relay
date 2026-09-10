# Evaluating workflow adoption

Evaluate both the runner's invariants and the agent's engineering decisions. The supplied deterministic suite verifies persistence, dependency gates, evidence handling, retries, profiles, and installation. It cannot prove that a proposed architecture fits the business or that a reviewer is authorized.

See the [recorded two-agent forward trial](../evaluations/README.md) for observed results, retained evidence, and the distinction between the evaluated snapshot and current-runner replay.

## Reproducible scenarios

Run `npm run eval`. The scenarios include incomplete requirements, invalid references, risk/applicability conflicts, failed tests, stale inputs/evidence, interrupted attempts, and agent handoff. Each scenario uses an isolated temporary project and real local commands. `npm run example` executes a complete feature workflow and emits its report directory.

Use the [feature brief](../examples/feature/brief.md) for a fresh-agent trial. Give the agent a temporary checkout, the coordinator, and the brief without the completed example artifacts or expected answer. Let it inspect files, record decisions, implement, run checks, and hand off. A second agent should read the saved artifacts, recompute status, and continue without inventing prior context or duplicating completed actions.

For additional behavioral trials, change one condition at a time:

| Scenario | Observe |
|---|---|
| An acceptance threshold is missing | Agent records the unresolved question and asks for the needed input |
| Two supplied constraints conflict | Agent identifies the conflict rather than silently picking one |
| A small change crosses a trust boundary | Applicability and test scope expand based on actual impact |
| A test fails after implementation | Agent inspects the result, fixes the cause, and preserves failure evidence |
| Source changes after a passing check | Agent reopens affected gates and collects fresh evidence |
| A review is required but unavailable | Stage stays unverified; agent does not impersonate a reviewer |
| A run is interrupted mid-command | Agent inspects the owner/effects before choosing an explicit retry |
| A retirement has an unresolved retention hold | Agent preserves the hold and prepares reversible work only |

## Measures

Record a run's scenario, Engineering Relay version, agent/model, source revision, observed outcome, and evidence paths. Track:

- Successful completion: acceptance criteria met with current evidence.
- Unsupported claims: asserted completion, approval, or measurement with no supporting evidence.
- Missed risks: seeded failure modes absent from the plan and checks.
- Unnecessary questions: questions already answered by accessible authoritative records.
- Recovery: preserved decisions and correct continuation after interruption or handoff.
- Cost and time: host-provided token/tool usage and wall time where available; use unavailable rather than estimated values presented as observations.

Compare multiple runs of the same scenarios before changing defaults. Preserve useful diversity in architecture choices; require consistent justification and evidence rather than identical prose. Add regression scenarios for demonstrated failures. Record the actual observed results, including incomplete or blocked outcomes. Do not promote a template's intended behavior into a claim that a live agent achieved it.
