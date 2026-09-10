import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { init, record, complete, runCheck, adopt, report } from '../../lib/runner.mjs';

export const exampleRoot = fileURLToPath(new URL('./', import.meta.url));
export function prepare(directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-example-'))) {
  fs.mkdirSync(path.join(directory, 'src'), { recursive: true });
  fs.copyFileSync(path.join(exampleRoot, 'brief.md'), path.join(directory, 'brief.md'));
  fs.writeFileSync(path.join(directory, 'src/csv.mjs'), 'export function toCsv() { throw new Error("CSV export is not implemented"); }\n');
  return directory;
}
export function implement(directory) {
  for (const name of ['src', 'test']) fs.cpSync(path.join(exampleRoot, name), path.join(directory, name), { recursive: true });
}
export function demo() {
  const project = prepare();
  const { run } = init({ project, id: 'csv-export', inputs: ['brief.md'], agent: 'scripted-agent-a', model: 'not-a-model' });
  for (const stage of ['intake', 'requirements', 'design']) {
    record(run, stage, path.join(exampleRoot, 'artifacts', `${stage}.json`));
    complete(run, stage);
  }
  implement(project);
  record(run, 'implementation', path.join(exampleRoot, 'artifacts/implementation.json'));
  complete(run, 'implementation');
  const check = runCheck(run, 'TEST-CSV');
  if (check.status !== 'pass') throw new Error(`CSV example failed: ${check.reason}`);
  // Simulate a different actor using persisted state. Live agent trials are separate evaluations.
  adopt(run, 'scripted-agent-b', 'not-a-model');
  const reused = runCheck(run, 'TEST-CSV');
  if (!reused.reused) throw new Error('Handoff repeated a completed check');
  complete(run, 'verification');
  complete(run, 'readiness');
  return report(run);
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = demo();
  console.log(JSON.stringify({ ready: result.ready, report: result.report, handoff: result.handoff, actors: result.actors }, null, 2));
}
