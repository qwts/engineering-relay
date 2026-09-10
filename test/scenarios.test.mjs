import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { status, complete, runCheck, report, adopt, configure, recover, init, record } from '../lib/runner.mjs';
import { readJSON, writeJSON, PACKAGE_ROOT } from '../lib/files.mjs';
import { fixture, sample, put, throughImplementation, latest } from './helpers.mjs';

test('golden path produces real evidence, traceability, and a reusable handoff', t => {
  const f = fixture(t); throughImplementation(f);
  assert.equal(runCheck(f.run, 'TEST-CSV').status, 'pass');
  const evidence = latest(f.run);
  assert.match(fs.readFileSync(path.join(f.run, Object.keys(evidence.data.files)[0]), 'utf8'), /pass 3/);
  adopt(f.run, 'test-agent-b', 'another-model');
  assert.equal(runCheck(f.run, 'TEST-CSV').reused, true);
  complete(f.run, 'verification'); complete(f.run, 'readiness');
  const result = report(f.run);
  assert.equal(result.ready, true); assert.equal(result.releaseAuthorized, false);
  assert.equal(result.actors.length, 2); assert.equal(result.traceability.length, 3);
  assert.deepEqual(result.traceability[1].checks, ['TEST-CSV']);
  assert.ok(fs.existsSync(result.handoff));
  const before = fs.readFileSync(path.join(f.run, 'state.json'), 'utf8');
  complete(f.run, 'readiness');
  assert.equal(fs.readFileSync(path.join(f.run, 'state.json'), 'utf8'), before);
});

test('missing, inferred, and conflicting requirements cannot complete the requirements gate', t => {
  const f = fixture(t); put(f.run, 'intake'); complete(f.run, 'intake');
  assert.throws(() => complete(f.run, 'requirements'), /No requirements artifact/);
  const data = sample('requirements');
  data.requirements[0].source = { kind: 'inference', reference: 'Agent guess' };
  put(f.run, 'requirements', data);
  assert.throws(() => complete(f.run, 'requirements'), /confirm inferred requirements/);
  data.requirements[0].source = { kind: 'file', reference: 'brief.md' };
  // The agent identifies a conflict and records the unresolved owner decision.
  data.questions.push({ id: 'Q-1', question: 'The brief asks for CRLF but the customer message asks for LF; which is authoritative?', blocking: true, owner: 'requester' });
  put(f.run, 'requirements', data);
  assert.throws(() => complete(f.run, 'requirements'), /Blocking requirements questions/);
  assert.equal(status(f.run).next.stage, 'requirements');
});

test('schemas reject empty acceptance, unexpected completion flags, and wrong-stage artifacts', t => {
  const f = fixture(t), data = sample('requirements');
  data.requirements[0].acceptance = '';
  assert.throws(() => put(f.run, 'requirements', data), /requirements:/);
  const intake = sample('intake'); intake.passed = true;
  assert.throws(() => put(f.run, 'intake', intake), /additional properties/);
  const file = path.join(f.run, 'drafts/requirements.json'); writeJSON(file, sample('requirements'));
  assert.throws(() => record(f.run, 'intake', file), /intake:/);
  assert.throws(() => record(f.run, 'verification', file), /are derived/);
});

test('impact overrides omissions, new services need a suitable profile, and profile changes invalidate receipts', t => {
  const f = fixture(t), data = sample('intake');
  data.impact.identity = true; put(f.run, 'intake', data);
  assert.throws(() => complete(f.run, 'intake'), /security is required/);
  data.impact.identity = false; data.impact.newService = true;
  data.applicability.find(x => x.domain === 'platform').disposition = 'required';
  put(f.run, 'intake', data); assert.throws(() => complete(f.run, 'intake'), /new service requires/);
  data.impact.newService = false; put(f.run, 'intake', data); complete(f.run, 'intake');
  configure(f.run, 'service', 'The scope now includes a new service');
  assert.equal(status(f.run).stages[0].status, 'stale');
});

test('design rejects missing requirement coverage, invalid references, and missing required domain plans', t => {
  const f = fixture(t);
  for (const stage of ['intake', 'requirements']) { put(f.run, stage); complete(f.run, stage); }
  const data = sample('design'); data.checks[0].requirementIds = ['REQ-1'];
  put(f.run, 'design', data); assert.throws(() => complete(f.run, 'design'), /REQ-2 has no/);
  data.checks[0].requirementIds = ['REQ-1', 'REQ-2', 'REQ-3', 'REQ-UNKNOWN'];
  put(f.run, 'design', data); assert.throws(() => complete(f.run, 'design'), /Unknown requirement/);
  data.checks[0].requirementIds.pop(); data.domainPlans[1].domain = 'data';
  put(f.run, 'design', data); assert.throws(() => complete(f.run, 'design'), /Missing required domain plan: quality/);
});

test('a failed command blocks verification, requires explicit retry, and preserves all attempts', t => {
  const f = fixture(t, { maxAttempts: 2 });
  throughImplementation(f, design => { design.checks[0].argv = ['node', '-e', 'process.exit(3)']; });
  assert.equal(runCheck(f.run, 'TEST-CSV').status, 'fail');
  assert.throws(() => complete(f.run, 'verification'), /Checks not passing/);
  assert.throws(() => runCheck(f.run, 'TEST-CSV'), /intentional retry/);
  assert.equal(runCheck(f.run, 'TEST-CSV', { rerun: true }).status, 'fail');
  assert.equal(latest(f.run).data.sequence, 2);
  assert.throws(() => runCheck(f.run, 'TEST-CSV', { rerun: true }), /budget exhausted/);
});

test('a newer failure cannot be hidden by an older pass', t => {
  const f = fixture(t); throughImplementation(f, design => { design.checks[0].argv = ['node', '-e', 'process.exit(process.env.RELAY_SCENARIO_FAIL === "1" ? 1 : 0)']; });
  assert.equal(runCheck(f.run, 'TEST-CSV').status, 'pass');
  process.env.RELAY_SCENARIO_FAIL = '1';
  try { assert.equal(runCheck(f.run, 'TEST-CSV', { rerun: true }).status, 'fail'); }
  finally { delete process.env.RELAY_SCENARIO_FAIL; }
  assert.throws(() => complete(f.run, 'verification'), /fail/);
});

test('changed source, changed requirement input, and edited artifacts invalidate affected gates', t => {
  const f = fixture(t); throughImplementation(f); runCheck(f.run, 'TEST-CSV');
  complete(f.run, 'verification'); complete(f.run, 'readiness');
  fs.appendFileSync(path.join(f.project, 'src/csv.mjs'), '\n// source changed\n');
  let s = status(f.run); assert.equal(s.stages[2].status, 'complete'); assert.equal(s.stages[3].status, 'stale'); assert.equal(s.checks[0].status, 'stale');
  complete(f.run, 'implementation'); assert.equal(runCheck(f.run, 'TEST-CSV').status, 'pass');
  complete(f.run, 'verification'); complete(f.run, 'readiness');
  fs.appendFileSync(path.join(f.project, 'brief.md'), '\nA requirement source changed.\n');
  assert.equal(status(f.run).stages[0].status, 'stale');
  const data = readJSON(path.join(f.run, 'artifacts/design.json')); data.summary = 'Changed plan summary';
  writeJSON(path.join(f.run, 'artifacts/design.json'), data);
  assert.equal(status(f.run).ready, false);
});

test('expired evidence and missing or changed logs fail closed', t => {
  const f = fixture(t); throughImplementation(f); runCheck(f.run, 'TEST-CSV');
  const evidence = latest(f.run), original = structuredClone(evidence.data);
  evidence.data.finishedAt = '2000-01-01T00:00:00.000Z'; writeJSON(evidence.file, evidence.data);
  assert.equal(status(f.run).checks[0].status, 'stale');
  writeJSON(evidence.file, original);
  const log = path.join(f.run, Object.keys(original.files)[0]);
  fs.appendFileSync(log, 'edited'); assert.equal(status(f.run).checks[0].status, 'unverified');
  fs.unlinkSync(log); assert.throws(() => complete(f.run, 'verification'), /unverified/);
});

test('missing evidence and invented passing artifacts never complete verification', t => {
  const f = fixture(t); throughImplementation(f);
  assert.equal(status(f.run).checks[0].status, 'unverified');
  fs.mkdirSync(path.join(f.run, 'evidence'));
  writeJSON(path.join(f.run, 'evidence/fake.json'), { checkId: 'TEST-CSV', status: 'pass' });
  assert.equal(status(f.run).checks[0].status, 'unverified');
  assert.throws(() => complete(f.run, 'verification'), /evidence:/);
});

test('evidence from a different runtime cannot satisfy verification', t => {
  const f = fixture(t); throughImplementation(f); runCheck(f.run, 'TEST-CSV');
  const item = latest(f.run); item.data.environment.node = 'v0.0.0'; writeJSON(item.file, item.data);
  assert.equal(status(f.run).checks[0].status, 'stale');
  assert.match(status(f.run).checks[0].reason, /Runtime environment changed/);
  assert.throws(() => complete(f.run, 'verification'), /stale/);
});

test('review checks require an actual receipt with the planned role and preserve its contents', t => {
  const f = fixture(t);
  throughImplementation(f, design => { design.checks.push({ id: 'REVIEW-1', kind: 'review', description: 'Review acceptance and implementation', requirementIds: ['REQ-1', 'REQ-2', 'REQ-3'], inputPaths: [], reviewerRole: 'maintainer', maxAgeHours: 24 }); });
  runCheck(f.run, 'TEST-CSV');
  assert.throws(() => runCheck(f.run, 'REVIEW-1'), /requires --review-file/);
  const reviewFile = path.join(f.run, 'drafts/review.json');
  const review = { reviewer: 'Test fixture reviewer', role: 'wrong-role', result: 'pass', summary: 'Synthetic receipt for format/role testing only.', reference: 'test-fixture-review' };
  writeJSON(reviewFile, review); assert.throws(() => runCheck(f.run, 'REVIEW-1', { reviewFile }), /Expected reviewer role/);
  review.role = 'maintainer'; writeJSON(reviewFile, review);
  assert.equal(runCheck(f.run, 'REVIEW-1', { reviewFile }).status, 'pass');
  complete(f.run, 'verification');
  const imported = fs.readdirSync(path.join(f.run, 'evidence')).find(x => x.endsWith('.review.json'));
  fs.appendFileSync(path.join(f.run, 'evidence', imported), '\n');
  assert.equal(status(f.run).checks.find(x => x.id === 'REVIEW-1').status, 'unverified');
});

test('high-severity open risks block readiness despite passing tests', t => {
  const f = fixture(t); throughImplementation(f);
  const data = sample('implementation');
  data.risks.push({ id: 'RISK-1', description: 'A required consumer behavior is still unresolved', severity: 'high', status: 'open', owner: 'maintainer', resolution: 'Resolve before release', reference: 'brief.md' });
  put(f.run, 'implementation', data); complete(f.run, 'implementation'); runCheck(f.run, 'TEST-CSV');
  assert.throws(() => complete(f.run, 'verification'), /Unresolved release risks/);
});

test('interrupted attempts stay unverified and resume requires inspecting live ownership', t => {
  const f = fixture(t); throughImplementation(f); runCheck(f.run, 'TEST-CSV');
  const item = latest(f.run); item.data.status = 'running'; item.data.finishedAt = null; writeJSON(item.file, item.data);
  assert.equal(status(f.run).checks[0].status, 'unverified');
  assert.throws(() => runCheck(f.run, 'TEST-CSV'), /interrupted\/running attempt/);
  writeJSON(path.join(f.run, '.lock'), { pid: process.pid, host: os.hostname() });
  assert.throws(() => recover(f.run), /still running/);
  assert.throws(() => adopt(f.run, 'agent-b'), /Run is locked/);
  fs.unlinkSync(path.join(f.run, '.lock'));
  // A short-lived process supplies a genuinely dead PID rather than assuming an arbitrary PID is absent.
  const child = spawnSync(process.execPath, ['-e', ''], { encoding: 'utf8' });
  writeJSON(path.join(f.run, '.lock'), { pid: child.pid, host: os.hostname() });
  assert.equal(recover(f.run).recovered, true);
  assert.equal(runCheck(f.run, 'TEST-CSV', { rerun: true }).status, 'pass');
});

test('timeouts, command start failures, and source changes during checks are not passes', t => {
  const f = fixture(t); throughImplementation(f, design => { design.checks[0].argv = ['node', '-e', 'setInterval(() => {}, 1000)']; design.checks[0].timeoutSeconds = 1; });
  assert.equal(runCheck(f.run, 'TEST-CSV').status, 'fail');
  const data = sample('design'); data.checks[0].argv = ['definitely-not-a-relay-command'];
  put(f.run, 'design', data); complete(f.run, 'design'); complete(f.run, 'implementation');
  assert.equal(runCheck(f.run, 'TEST-CSV').status, 'fail');
  data.checks[0].argv = ['node', '-e', 'require("node:fs").appendFileSync("src/csv.mjs", "\\n// mutation")'];
  put(f.run, 'design', data); complete(f.run, 'design'); complete(f.run, 'implementation');
  runCheck(f.run, 'TEST-CSV');
  assert.equal(latest(f.run).data.status, 'fail');
  assert.match(latest(f.run).data.error, /changed during the check/);
});

test('path escapes, symlink escapes, duplicate run ids, and incompatible package pins are rejected', t => {
  const f = fixture(t);
  assert.throws(() => init({ project: f.project, id: 'feature' }), /already exists/);
  assert.throws(() => init({ project: f.project, id: '../escape' }), /Run id/);
  assert.throws(() => init({ project: f.project, id: 'escape', inputs: ['../outside'] }), /project-relative/);
  fs.symlinkSync(PACKAGE_ROOT, path.join(f.project, 'external'));
  assert.throws(() => init({ project: f.project, id: 'symlink', inputs: ['external/package.json'] }), /Symlink escapes/);
  fs.unlinkSync(path.join(f.project, 'external'));
  const file = path.join(f.run, 'state.json'), data = readJSON(file);
  data.playbook.fingerprint = '0'.repeat(64); writeJSON(file, data);
  assert.match(status(f.run).next.reason, /Engineering Relay changed/);
});

test('CI verify returns nonzero for incomplete runs and zero only for current readiness', t => {
  const f = fixture(t), cli = path.join(PACKAGE_ROOT, 'bin/engineering-relay.mjs');
  assert.equal(spawnSync(process.execPath, [cli, 'verify', '--run', f.run]).status, 1);
  throughImplementation(f); runCheck(f.run, 'TEST-CSV'); complete(f.run, 'verification'); complete(f.run, 'readiness');
  assert.equal(spawnSync(process.execPath, [cli, 'verify', '--run', f.run]).status, 0);
  fs.appendFileSync(path.join(f.project, 'src/csv.mjs'), '\n');
  assert.equal(spawnSync(process.execPath, [cli, 'verify', '--run', f.run]).status, 1);
});
