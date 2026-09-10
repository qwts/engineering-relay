import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { init, record, complete } from '../lib/runner.mjs';
import { readJSON, writeJSON } from '../lib/files.mjs';
import { prepare, implement, exampleRoot } from '../examples/feature/run.mjs';

export function fixture(t, options = {}) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-test-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  prepare(project);
  const { run } = init({ project, id: 'feature', inputs: ['brief.md'], agent: 'test-agent-a', model: 'test-model', ...options });
  return { project, run };
}
export const sample = stage => readJSON(path.join(exampleRoot, 'artifacts', `${stage}.json`));
export function put(run, stage, data = sample(stage)) {
  const file = path.join(run, 'drafts', `${stage}.json`);
  writeJSON(file, data);
  record(run, stage, file);
}
export function throughImplementation(f, mutateDesign = () => {}) {
  for (const stage of ['intake', 'requirements', 'design']) {
    const data = sample(stage);
    if (stage === 'design') mutateDesign(data);
    put(f.run, stage, data); complete(f.run, stage);
  }
  implement(f.project); put(f.run, 'implementation'); complete(f.run, 'implementation');
}
export function latest(run) {
  const directory = path.join(run, 'evidence');
  const entries = fs.readdirSync(directory).filter(x => x.endsWith('.json') && !x.endsWith('.review.json')).map(x => ({ file: path.join(directory, x), data: readJSON(path.join(directory, x)) }));
  return entries.sort((a, b) => a.data.sequence - b.data.sequence).at(-1);
}
