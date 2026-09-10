import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { init, record, complete, runCheck, adopt, report } from '../lib/runner.mjs';
import { PACKAGE_ROOT } from '../lib/files.mjs';
import { latest } from './helpers.mjs';

test('current runner replays the independently authored trial and executes all 40 behavior tests', t => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-forward-replay-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const trial = path.join(PACKAGE_ROOT, 'evaluations/forward-trial');
  fs.copyFileSync(path.join(trial, 'brief.md'), path.join(project, 'brief.md'));
  fs.mkdirSync(path.join(project, 'src'));
  fs.writeFileSync(path.join(project, 'src/duration.mjs'), 'export function formatDuration() { throw new Error("Not implemented"); }\n');
  const { run } = init({ project, id: 'replay', inputs: ['brief.md'], agent: 'scripted-replay-a', model: 'not-a-model' });
  for (const stage of ['intake', 'requirements', 'design']) { record(run, stage, path.join(trial, 'artifacts', `${stage}.json`)); complete(run, stage); }
  for (const directory of ['src', 'test']) fs.cpSync(path.join(trial, directory), path.join(project, directory), { recursive: true });
  record(run, 'implementation', path.join(trial, 'artifacts/implementation.json')); complete(run, 'implementation');
  assert.equal(runCheck(run, 'CHECK-BEHAVIOR').status, 'pass');
  const evidence = latest(run).data;
  assert.match(fs.readFileSync(path.join(run, Object.keys(evidence.files)[0]), 'utf8'), /pass 40/);
  adopt(run, 'scripted-replay-b', 'not-a-model');
  assert.equal(runCheck(run, 'CHECK-BEHAVIOR').reused, true);
  complete(run, 'verification'); complete(run, 'readiness');
  const result = report(run);
  assert.equal(result.ready, true); assert.equal(result.traceability.length, 5);
});
