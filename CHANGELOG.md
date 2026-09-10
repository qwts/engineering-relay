# Changelog

## 1.1.1

- Renamed the project, npm package, executable, and generated agent entry points to Engineering Relay (`engineering-relay`).
- New installations use `.engineering/relay/bin/engineering-relay.mjs`. Existing installations remain pinned; adopt the renamed package in a separate checkout.
- Retained the `playbook` state/report field for schema compatibility and preserved historical evaluation records under their original names.

## 1.1.0

- Added portable engineering procedures covering the 23 reference guides, with a coordinator and contextual domain routing.
- Added JSON artifact schemas, applicability profiles, requirement traceability, durable run state, evidence checks, retry limits, and handoff reports.
- Added generic, Codex, and Copilot installation adapters, a complete feature example, and scenario evaluations.
- Preserved the original reference guides and retained the Copilot interview entry points as optional facilitators of the shared workflow.

This release provides local workflow evidence. It does not authenticate reviewer identity, attest against malicious workspace edits, or authorize production actions. Published package or marketplace distribution remains a maintainer action; the repository supports local installation and npm packaging.
