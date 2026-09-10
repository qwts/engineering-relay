import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture, sample, put, throughImplementation } from './helpers.mjs';
import { complete, runCheck, status } from '../lib/runner.mjs';
import { writeJSON } from '../lib/files.mjs';
import { implement } from '../examples/feature/run.mjs';

for (const workflow of ['change', 'operate', 'retire']) test(`${workflow} workflow applies critical domain, review, and recovery requirements`, t => {
  const f = fixture(t, { profile: 'critical', workflow });
  const intake = sample('intake'); intake.impact.retirement = workflow === 'retire';
  for (const row of intake.applicability) { row.disposition = 'required'; row.reason = 'This synthetic critical-profile scenario exercises every domain contract.'; }
  put(f.run, 'intake', intake); complete(f.run, 'intake');
  put(f.run, 'requirements'); complete(f.run, 'requirements');
  const design = sample('design');
  design.domainPlans = intake.applicability.map(x => ({ domain: x.domain, summary: 'Synthetic scenario plan for gate enforcement.', artifactPaths: [], checkIds: ['TEST-CSV'] }));
  put(f.run, 'design', design);
  assert.throws(() => complete(f.run, 'design'), /requires a review check/);
  design.checks.push({ id: 'REVIEW-1', kind: 'review', description: 'Synthetic review gate', requirementIds: ['REQ-1', 'REQ-2', 'REQ-3'], inputPaths: [], reviewerRole: 'owner', maxAgeHours: 24 });
  put(f.run, 'design', design); complete(f.run, 'design');
  implement(f.project); const implementation = sample('implementation'); put(f.run, 'implementation', implementation);
  assert.throws(() => complete(f.run, 'implementation'), /requires rollback\/recovery verification/);
  implementation.rollback.checkIds = ['TEST-CSV'];
  implementation.rollback.procedure = 'Synthetic gate fixture: TEST-CSV stands in for the project-specific recovery exercise; this test does not claim production recovery.';
  put(f.run, 'implementation', implementation); complete(f.run, 'implementation');
  runCheck(f.run, 'TEST-CSV'); assert.throws(() => complete(f.run, 'verification'), /REVIEW-1/);
  const reviewFile = path.join(f.run, 'drafts/review.json');
  writeJSON(reviewFile, { reviewer: 'Synthetic fixture', role: 'owner', result: 'pass', summary: 'Format and gate scenario only.', reference: 'synthetic-test' });
  runCheck(f.run, 'REVIEW-1', { reviewFile }); complete(f.run, 'verification'); complete(f.run, 'readiness');
  assert.equal(status(f.run).ready, true);
});

test('unresolved retirement/retention decision blocks its dependent workflow', t => {
  const f = fixture(t, { profile: 'critical', workflow: 'retire' });
  const data = sample('intake'); data.impact.retirement = true;
  for (const row of data.applicability) { row.disposition = 'required'; row.reason = 'Retirement scenario requires disposition for all domains.'; }
  put(f.run, 'intake', data); complete(f.run, 'intake');
  const requirements = sample('requirements'); requirements.questions.push({ id: 'Q-HOLD', question: 'The inventory reports a retention hold; its owner has not released it. Which reversible preparation is authorized?', blocking: true, owner: 'records-owner' });
  put(f.run, 'requirements', requirements);
  assert.throws(() => complete(f.run, 'requirements'), /Blocking requirements questions/);
  assert.throws(() => complete(f.run, 'design'), /Complete requirements first/);
});

test('a requirement source added after initialization and a plan artifact are tracked inputs', t => {
  const f = fixture(t); put(f.run, 'intake'); complete(f.run, 'intake');
  fs.writeFileSync(path.join(f.project, 'constraints.md'), 'Use the agreed behavior.\n');
  const requirements = sample('requirements'); requirements.constraints.push({ id: 'CON-1', description: 'Follow the project behavior constraint.', source: { kind: 'file', reference: 'constraints.md' } });
  put(f.run, 'requirements', requirements); complete(f.run, 'requirements');
  const design = sample('design'); design.domainPlans[0].artifactPaths = ['constraints.md'];
  put(f.run, 'design', design); complete(f.run, 'design');
  fs.appendFileSync(path.join(f.project, 'constraints.md'), 'The constraint has changed.\n');
  assert.equal(status(f.run).stages[0].status, 'complete');
  assert.equal(status(f.run).stages[1].status, 'stale');
});

test('changed acceptance criteria invalidate prior evidence even when code and check argv stay the same', t => {
  const f = fixture(t); throughImplementation(f); runCheck(f.run, 'TEST-CSV');
  const req = sample('requirements'); req.requirements[0].acceptance += ' This newly recorded acceptance needs reassessment.';
  put(f.run, 'requirements', req); complete(f.run, 'requirements'); complete(f.run, 'design'); complete(f.run, 'implementation');
  assert.equal(status(f.run).checks[0].status, 'stale');
  assert.equal(runCheck(f.run, 'TEST-CSV').reused, undefined);
});

test('high-risk acceptance cannot bypass a planned review check', t => {
  const f = fixture(t); throughImplementation(f);
  const implementation = sample('implementation'); implementation.risks = [{ id: 'RISK-1', description: 'Known limitation requires acceptance', severity: 'high', status: 'accepted', owner: 'maintainer', resolution: 'Accepted as a declared limitation', reference: 'check:TEST-CSV' }];
  put(f.run, 'implementation', implementation);
  assert.throws(() => complete(f.run, 'implementation'), /risk acceptance requires a review check/);
});

test('explicit ignored inputs invalidate check evidence and tracked deletions invalidate source', t => {
  const f = fixture(t);
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: f.project }).status, 0);
  fs.writeFileSync(path.join(f.project, '.gitignore'), 'local-settings.json\n.engineering/\n');
  fs.writeFileSync(path.join(f.project, 'local-settings.json'), '{"mode":1}');
  throughImplementation(f, design => { design.checks[0].inputPaths.push('local-settings.json'); });
  runCheck(f.run, 'TEST-CSV');
  fs.writeFileSync(path.join(f.project, 'local-settings.json'), '{"mode":2}');
  assert.equal(status(f.run).checks[0].status, 'stale');
  assert.equal(status(f.run).stages[3].status, 'complete');
  assert.equal(spawnSync('git', ['add', 'src/csv.mjs'], { cwd: f.project }).status, 0);
  fs.unlinkSync(path.join(f.project, 'src/csv.mjs'));
  assert.equal(status(f.run).stages[3].status, 'stale');
});
