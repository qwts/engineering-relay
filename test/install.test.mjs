import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { install } from '../lib/install.mjs';
import { PACKAGE_ROOT } from '../lib/files.mjs';

function project(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-install-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Existing project rules\n\nKeep the existing build system.\n');
  return root;
}
for (const adapter of ['generic', 'codex', 'copilot']) test(`${adapter} adapter installs a self-contained runtime and preserves project instructions`, t => {
  const root = project(t), result = install(root, adapter);
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /Keep the existing build system/);
  assert.equal(spawnSync(process.execPath, [result.entrypoint, '--version'], { encoding: 'utf8' }).stdout.trim(), '1.1.1');
  const initialized = spawnSync(process.execPath, [result.entrypoint, 'init', '--project', root, '--id', 'adoption'], { encoding: 'utf8' });
  assert.equal(initialized.status, 0, initialized.stderr);
  const run = JSON.parse(initialized.stdout).run;
  assert.equal(spawnSync(process.execPath, [result.entrypoint, 'next', '--run', run]).status, 0);
  const generated = spawnSync(process.execPath, [result.entrypoint, 'report', '--run', run], { encoding: 'utf8' });
  assert.equal(generated.status, 0, generated.stderr);
  const handoff = fs.readFileSync(path.join(run, 'handoff.md'), 'utf8');
  assert.match(handoff, /node '\.engineering\/relay\/bin\/engineering-relay\.mjs'/);
  if (adapter === 'codex') {
    const file = path.join(root, '.agents/skills/engineering-workflow/SKILL.md');
    const link = fs.readFileSync(file, 'utf8').match(/\]\(([^)]+)\)/)[1];
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), link)));
  }
  if (adapter === 'copilot') assert.ok(fs.existsSync(path.join(root, '.github/agents/engineering-relay.agent.md')));
  assert.throws(() => install(root, adapter), /already installed/);
});

test('conflicting native skills or malformed markers fail before modifying the project', t => {
  const root = project(t), before = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  fs.mkdirSync(path.join(root, '.agents/skills/engineering-workflow'), { recursive: true });
  fs.writeFileSync(path.join(root, '.agents/skills/engineering-workflow/SKILL.md'), 'User skill');
  assert.throws(() => install(root, 'codex'), /conflicts with existing file/);
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), before);
  assert.ok(!fs.existsSync(path.join(root, '.engineering/relay')));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), `${before}\n<!-- engineering-relay:start -->\n`);
  assert.throws(() => install(root, 'generic'), /Malformed/);
});

test('installation refuses symlinks that escape the target project', t => {
  const root = project(t);
  fs.symlinkSync(PACKAGE_ROOT, path.join(root, '.engineering'));
  assert.throws(() => install(root, 'generic'), /Symlink escapes/);
});

test('legacy runtimes and instructions remain pinned without creating a second installation', t => {
  const root = project(t), before = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  const legacy = path.join(root, '.engineering/playbook');
  fs.mkdirSync(legacy, { recursive: true });
  fs.writeFileSync(path.join(legacy, 'pinned.txt'), 'Existing runtime');
  assert.throws(() => install(root), /Legacy workflow already installed/);
  assert.equal(fs.readFileSync(path.join(legacy, 'pinned.txt'), 'utf8'), 'Existing runtime');
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), before);
  assert.ok(!fs.existsSync(path.join(root, '.engineering/relay')));

  fs.rmSync(legacy, { recursive: true });
  const instructions = `${before}\n<!-- engineering-playbook:start -->\nPinned coordinator\n<!-- engineering-playbook:end -->\n`;
  fs.writeFileSync(path.join(root, 'AGENTS.md'), instructions);
  assert.throws(() => install(root), /Legacy workflow instructions already installed/);
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), instructions);
  assert.ok(!fs.existsSync(path.join(root, '.engineering/relay')));
});

test('installed package can execute its full example with real child tests', t => {
  const root = project(t), result = install(root);
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const execution = spawnSync(process.execPath, [path.join(result.installed, 'examples/feature/run.mjs')], { env, encoding: 'utf8' });
  assert.equal(execution.status, 0, execution.stderr);
  const data = JSON.parse(execution.stdout); assert.equal(data.ready, true);
  const sampleProject = path.resolve(path.dirname(data.report), '../../..');
  t.after(() => fs.rmSync(sampleProject, { recursive: true, force: true }));
});
