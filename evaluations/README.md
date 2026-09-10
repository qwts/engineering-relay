# Recorded forward evaluation

The retained trial predates the Engineering Relay rename. Its original package names, commands, state fields, and fingerprints are preserved as recorded.

On 2026-09-10, two independent fresh agents used an installed prerelease snapshot of this package in an isolated project. They received the [duration utility brief](forward-trial/brief.md) and starter module, not a completed solution or intended workflow answers.

The first agent authored the [four workflow artifacts](forward-trial/artifacts), implemented [the utility](forward-trial/src/duration.mjs), and wrote [40 behavior tests](forward-trial/test/duration.test.mjs). Its recorded observations report that all 40 failed against the starter and passed against the implementation. The runner's retained [command evidence](forward-trial/evidence) establishes the final 40/40 pass with exit 0.

The second agent read current files, inspected artifacts and evidence, adopted the run, and completed verification/readiness. The root agent independently invoked the installed CLI's `verify` command and observed exit 0 with all six stages complete and the same evidence identifier. No behavior test was rerun during the handoff.

| Measure | Observed result |
|---|---|
| Technical completion | Final report ready; no release authorized |
| Behavior tests | 40 passed, zero failed/skipped |
| Runner evidence attempts | One |
| Handoff | Decisions and evidence preserved; two recorded agent identities |
| Unnecessary user questions | None reported by either agent |
| Usability findings | Handoff assumed a PATH executable; single-file source reference semantics needed clearer wording |
| Artifact clarity finding | Temporary stop/resume instructions should remain in phase notes instead of product constraints |
| Cost/model identity | Not available; no invented usage or model value |

The generated handoff now uses the actual Node CLI path. The requirements procedure now explains exact file references and separates temporary phase instructions from product constraints. These changes are regression-tested. The current runner also replays the agent-authored artifacts and executes the real 40-test check in the automated suite.

The retained [report](forward-trial/report.json), [state](forward-trial/state.json), [first-agent notes](forward-trial/forward-trial-notes.json), and [second-agent notes](forward-trial/forward-trial-b-notes.json) identify the evaluated package content fingerprint and actual timestamps. They are historical evidence, not a resumable run at this archive path. The current package has subsequent fixes and a different fingerprint. The replay test uses current code with a new run, preserving the distinction between historical live-agent observations and current deterministic verification.

This is one behavioral trial plus a handoff, not a broad benchmark of architecture quality or all supported hosts. [Evaluation guidance](../workflow/evaluation.md) describes additional scenarios and how to compare repeated runs.
