# Worked feature example

The [brief](brief.md) requests a CSV export utility with concrete acceptance criteria. The [implementation](src/csv.mjs) and [tests](test/csv.test.mjs) implement and verify those criteria. The [artifacts](artifacts) show scope, decisions, traceability, and the check definition.

From the package repository after `npm ci`:

```sh
npm run example
```

The demo creates an isolated temporary project with an unimplemented CSV utility, initializes a run, records intake/requirements/design, applies the implementation, executes the real test command, records a simulated actor handoff, reuses the existing valid evidence, and produces readiness and handoff reports. It prints the report paths and keeps the temporary project for inspection. It does not modify this repository or invoke a model API. The actor change is a deterministic handoff simulation, not a claim of two live agent evaluations.

For a fresh-agent evaluation, provide only the starter project and brief to the agent, plus the coordinator. Do not provide these completed artifacts or solution. See [evaluation guidance](../../workflow/evaluation.md).

To inspect or resume the generated run, use its printed location:

```sh
node bin/engineering-relay.mjs status --run /tmp/engineering-example-REPLACE/.engineering/runs/csv-export
node bin/engineering-relay.mjs report --run /tmp/engineering-example-REPLACE/.engineering/runs/csv-export
```

Changing the utility or test after completion makes implementation and downstream evidence stale. Changing the brief reopens intake and its dependent stages. Neither action erases previous evidence. Restore or update the affected artifacts, complete the applicable stages again, and execute the check for the changed context.
