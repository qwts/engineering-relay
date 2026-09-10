import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { PACKAGE_ROOT, readJSON, writeJSON, atomicWrite, digest, hashJSON, now, inside, hashFiles, sourceSnapshot, packageFingerprint, runtimeEnvironment } from './files.mjs';
import { validate } from './validation.mjs';

export const catalog = readJSON(path.join(PACKAGE_ROOT, 'workflow/catalog.json'));
export const packageVersion = readJSON(path.join(PACKAGE_ROOT, 'package.json')).version;
const artifactStages = catalog.stages.slice(0, 4);
const ensure = (condition, message) => { if (!condition) throw new Error(message); };
const unique = (values, label) => ensure(new Set(values).size === values.length, `Duplicate ${label}`);

export function init({ project, id, profile = 'small', workflow = 'change', inputs = [], agent = 'unspecified', model = 'unspecified', maxAttempts = 3 }) {
  ensure(/^[a-z0-9][a-z0-9-]{0,63}$/.test(id ?? ''), 'Run id must be 1–64 lowercase letters, numbers, or hyphens');
  ensure(Object.hasOwn(catalog.profiles, profile), `Unknown profile: ${profile}`);
  ensure(catalog.workflows.includes(workflow), `Unknown workflow: ${workflow}`);
  ensure(Number.isInteger(maxAttempts) && maxAttempts > 0 && maxAttempts <= 20, 'maxAttempts must be 1–20');
  const root = fs.realpathSync(project);
  for (const input of inputs) inside(root, input);
  const run = inside(root, `.engineering/runs/${id}`, { missing: true });
  ensure(!fs.existsSync(run), `Run already exists: ${run}. Use status or next to resume.`);
  const state = {
    schemaVersion: 1, id, profile, workflow, inputs, createdAt: now(),
    playbook: { version: packageVersion, fingerprint: packageFingerprint() },
    environment: runtimeEnvironment(),
    actors: [{ agent, model, at: now() }], limits: { maxAttemptsPerCheck: maxAttempts },
    baseline: sourceSnapshot(root), receipts: {}, events: []
  };
  fs.mkdirSync(path.join(run, 'drafts'), { recursive: true });
  for (const stage of artifactStages) fs.copyFileSync(path.join(PACKAGE_ROOT, 'workflow/templates', `${stage}.json`), path.join(run, 'drafts', `${stage}.json`));
  writeJSON(path.join(run, 'state.json'), state);
  return { run, state };
}

export function context(run) {
  const directory = fs.realpathSync(run);
  const state = validate('state', readJSON(path.join(directory, 'state.json')));
  const root = fs.realpathSync(path.resolve(directory, '../../..'));
  ensure(directory === path.join(root, '.engineering', 'runs', state.id), 'Run must be in PROJECT/.engineering/runs/ID');
  return { run: directory, root, state };
}
function event(ctx, action, details = {}) {
  ctx.state.events.push({ at: now(), actor: ctx.state.actors.at(-1), action, ...details });
  writeJSON(path.join(ctx.run, 'state.json'), ctx.state);
}
function lockFile(ctx) { return path.join(ctx.run, '.lock'); }
function withLock(ctx, action) {
  const file = lockFile(ctx);
  let fd;
  try { fd = fs.openSync(file, 'wx'); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Run is locked: ${file}. Inspect its owner; use recover only after the owner has stopped.`);
    throw error;
  }
  try {
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, host: os.hostname(), at: now() }));
    // Another process may have finished a mutation between context() and acquisition.
    ctx.state = validate('state', readJSON(path.join(ctx.run, 'state.json')));
    return action();
  } finally { fs.closeSync(fd); fs.unlinkSync(file); }
}
export function recover(run) {
  const ctx = context(run), file = lockFile(ctx);
  if (!fs.existsSync(file)) return { recovered: false, reason: 'No lock' };
  const owner = readJSON(file);
  ensure(owner.host === os.hostname(), `Lock belongs to another host (${owner.host}); verify it there before removing it manually.`);
  ensure(Number.isInteger(owner.pid) && owner.pid > 0, 'Malformed lock owner; inspect manually');
  let alive = true;
  try { process.kill(owner.pid, 0); } catch (error) { if (error.code === 'ESRCH') alive = false; else throw error; }
  ensure(!alive, `Lock owner ${owner.pid} is still running; do not restart its work.`);
  fs.unlinkSync(file);
  event(ctx, 'recover-lock', { owner });
  return { recovered: true, next: 'Inspect any interrupted check and its effects. Re-execution requires --rerun.' };
}
export function adopt(run, agent, model = 'unspecified') {
  const ctx = context(run);
  ensure(agent?.trim(), 'agent is required');
  return withLock(ctx, () => { ctx.state.actors.push({ agent, model, at: now() }); event(ctx, 'handoff'); return statusContext(ctx); });
}
export function configure(run, profile, reason) {
  const ctx = context(run);
  ensure(Object.hasOwn(catalog.profiles, profile), `Unknown profile: ${profile}`);
  ensure(reason?.trim(), 'A profile change requires a reason');
  return withLock(ctx, () => { ctx.state.profile = profile; event(ctx, 'profile', { profile, reason }); return statusContext(ctx); });
}
function artifact(ctx, stage) {
  const file = path.join(ctx.run, 'artifacts', `${stage}.json`);
  ensure(fs.existsSync(file), `No ${stage} artifact. Complete drafts/${stage}.json and record it.`);
  return validate(stage, readJSON(file));
}
export function record(run, stage, file) {
  ensure(artifactStages.includes(stage), `Only ${artifactStages.join(', ')} accept artifacts; verification and readiness are derived.`);
  const ctx = context(run), data = validate(stage, readJSON(file));
  return withLock(ctx, () => {
    writeJSON(path.join(ctx.run, 'artifacts', `${stage}.json`), data);
    event(ctx, 'record', { stage, digest: hashJSON(data) });
    return statusContext(ctx);
  });
}
function requiredDomains(ctx, intake) {
  const set = new Set(['product', 'quality']);
  const impact = intake.impact;
  if (impact.persistentData) set.add('data');
  if (impact.identity || impact.publicApi || impact.persistentData) set.add('security');
  if (impact.infrastructure || impact.newService) set.add('platform');
  if (impact.production || ctx.state.workflow !== 'change') set.add('reliability');
  if (impact.retirement || ctx.state.workflow === 'retire') { set.add('retirement'); set.add('data'); }
  if (ctx.state.profile !== 'small') for (const domain of ['platform', 'security', 'reliability']) set.add(domain);
  return set;
}
function semantic(ctx, stage, data) {
  if (stage === 'intake') {
    unique(data.applicability.map(x => x.domain), 'applicability domain');
    ensure(data.applicability.length === Object.keys(catalog.domains).length, 'Record applicability for every domain');
    const required = requiredDomains(ctx, data);
    for (const row of data.applicability) ensure(!required.has(row.domain) || row.disposition === 'required', `${row.domain} is required by the impact/profile`);
    ensure(!data.impact.newService || ctx.state.profile !== 'small', 'A new service requires service or critical profile');
    ensure(!data.impact.retirement || ctx.state.profile === 'critical', 'Retirement requires critical profile');
    ensure(ctx.state.workflow !== 'retire' || (data.impact.retirement && ctx.state.profile === 'critical'), 'Retire workflow requires retirement impact and critical profile');
  }
  if (stage === 'requirements') {
    unique([...data.requirements, ...data.constraints, ...data.assumptions, ...data.questions].map(x => x.id), 'requirement/constraint/assumption/question id');
    ensure(!data.questions.some(q => q.blocking), 'Blocking requirements questions remain unresolved');
    for (const row of [...data.requirements, ...data.constraints]) {
      ensure(row.source.kind !== 'inference', `${row.id}: confirm inferred requirements or record them as assumptions/questions`);
      if (row.source.kind === 'file') inside(ctx.root, row.source.reference.split('#')[0]);
    }
  }
  if (stage === 'design' || stage === 'implementation') {
    const requirements = artifact(ctx, 'requirements').requirements.map(x => x.id);
    const groups = stage === 'design' ? [data.decisions, data.tasks, data.checks] : [data.changes];
    for (const group of groups) for (const row of group) for (const id of row.requirementIds) ensure(requirements.includes(id), `Unknown requirement reference: ${id}`);
    for (const group of (stage === 'design' ? [data.tasks, data.checks] : [data.changes])) {
      for (const id of requirements) ensure(group.some(row => row.requirementIds.includes(id)), `${id} has no ${stage === 'design' ? 'task/check' : 'implementation'} coverage`);
    }
  }
  if (stage === 'design') {
    unique([...data.decisions, ...data.tasks, ...data.checks].map(x => x.id), 'decision/task/check id');
    unique(data.domainPlans.map(x => x.domain), 'domain plan');
    const checks = data.checks.map(x => x.id);
    for (const decision of data.decisions) ensure(decision.options.includes(decision.chosen), `${decision.id}: chosen option is not one of the evaluated options`);
    for (const row of artifact(ctx, 'intake').applicability.filter(x => x.disposition === 'required')) ensure(data.domainPlans.some(x => x.domain === row.domain), `Missing required domain plan: ${row.domain}`);
    for (const plan of data.domainPlans) {
      for (const id of plan.checkIds) ensure(checks.includes(id), `Unknown domain check: ${id}`);
      for (const file of plan.artifactPaths) inside(ctx.root, file);
    }
    for (const task of data.tasks) for (const file of task.paths) inside(ctx.root, file, { missing: true });
    for (const check of data.checks) for (const file of check.inputPaths) inside(ctx.root, file, { missing: true });
    if (ctx.state.profile === 'critical') ensure(data.checks.some(c => c.kind === 'review'), 'Critical profile requires a review check with a named reviewer role');
  }
  if (stage === 'implementation') {
    const checkIds = artifact(ctx, 'design').checks.map(c => c.id);
    unique(data.changes.map(x => x.path), 'changed path');
    unique(data.risks.map(x => x.id), 'risk id');
    for (const change of data.changes) {
      const file = inside(ctx.root, change.path, { missing: true });
      ensure(fs.existsSync(file) || ctx.state.baseline.files[change.path], `Change has no file or baseline deletion: ${change.path}`);
    }
    for (const file of data.documentationPaths) inside(ctx.root, file);
    for (const id of data.rollback.checkIds) ensure(checkIds.includes(id), `Unknown rollback check: ${id}`);
    if (ctx.state.profile === 'critical') ensure(data.rollback.checkIds.length > 0, 'Critical profile requires rollback/recovery verification');
    for (const risk of data.risks.filter(x => ['high', 'critical'].includes(x.severity) && x.status !== 'open')) {
      const check = artifact(ctx, 'design').checks.find(x => `check:${x.id}` === risk.reference);
      ensure(check, `${risk.id}: resolved high/critical risk must reference a planned check as check:ID`);
      ensure(risk.status !== 'accepted' || check.kind === 'review', `${risk.id}: risk acceptance requires a review check`);
    }
  }
}
function inputFingerprint(ctx) {
  const files = hashFiles(ctx.root, ctx.state.inputs);
  for (const [name, hash] of Object.entries(files)) ensure(hash, `Missing input: ${name}`);
  return hashJSON({ files, profile: ctx.state.profile, workflow: ctx.state.workflow, playbook: ctx.state.playbook });
}
function contextKey(ctx, check) {
  const inputs = hashFiles(ctx.root, check.inputPaths);
  for (const [file, hash] of Object.entries(inputs)) ensure(hash, `Missing check input: ${file}`);
  return hashJSON({ input: inputFingerprint(ctx), intake: artifact(ctx, 'intake'), requirements: artifact(ctx, 'requirements'), design: artifact(ctx, 'design'), implementation: artifact(ctx, 'implementation'), implementationReceipt: ctx.state.receipts.implementation?.fingerprint, source: sourceSnapshot(ctx.root), environment: runtimeEnvironment(), check, inputs });
}
function evidenceList(ctx, checkId) {
  const directory = path.join(ctx.run, 'evidence');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter(file => file.endsWith('.json') && !file.endsWith('.review.json')).map(file => {
    const data = validate('evidence', readJSON(path.join(directory, file)));
    return data;
  }).filter(data => data.checkId === checkId).sort((a, b) => a.sequence - b.sequence);
}
function evidenceStatus(ctx, check) {
  const entries = evidenceList(ctx, check.id), latest = entries.at(-1);
  if (!latest) return { id: check.id, status: 'unverified', reason: 'No evidence' };
  if (hashJSON(latest.environment) !== hashJSON(runtimeEnvironment())) return { id: check.id, status: 'stale', reason: 'Runtime environment changed', evidence: latest.id };
  if (latest.context !== contextKey(ctx, check)) return { id: check.id, status: 'stale', reason: 'Source, inputs, or plan changed', evidence: latest.id };
  if (latest.status === 'running') return { id: check.id, status: 'unverified', reason: 'Attempt is running or interrupted; inspect its owner and effects', evidence: latest.id };
  const age = Date.now() - Date.parse(latest.finishedAt);
  if (!Number.isFinite(age) || age < -60000 || age > check.maxAgeHours * 3600000) return { id: check.id, status: 'stale', reason: 'Evidence expired or has an invalid timestamp', evidence: latest.id };
  for (const [name, hash] of Object.entries(latest.files)) {
    const file = inside(ctx.run, name, { missing: true });
    if (!fs.existsSync(file) || digest(fs.readFileSync(file)) !== hash) return { id: check.id, status: 'unverified', reason: `Evidence file missing or changed: ${name}`, evidence: latest.id };
  }
  ensure(Object.keys(latest.files).length > 0, `Evidence ${latest.id} has no result files`);
  if (check.kind === 'command') {
    ensure(latest.kind === 'command' && hashJSON(latest.argv) === hashJSON(check.argv), `Command provenance mismatch for ${check.id}`);
    ensure(latest.status !== 'pass' || (latest.exitCode === 0 && !latest.error), `Invalid passing command evidence: ${check.id}`);
  } else {
    ensure(latest.kind === 'review', `Review evidence type mismatch for ${check.id}`);
    const reviewFile = Object.keys(latest.files).find(file => file.endsWith('.review.json'));
    ensure(reviewFile, `Missing review receipt for ${check.id}`);
    const review = validate('review', readJSON(inside(ctx.run, reviewFile)));
    ensure(review.role === check.reviewerRole && review.result === latest.status, `Review role/result mismatch for ${check.id}`);
  }
  return { id: check.id, status: latest.status, evidence: latest.id, reason: latest.error || latest.summary || '' };
}
function assess(ctx) {
  const results = [];
  const packageMatches = ctx.state.playbook.fingerprint === packageFingerprint();
  for (const stage of catalog.stages) {
    const receipt = ctx.state.receipts[stage];
    try {
      ensure(packageMatches, `Engineering Relay changed since run creation (${ctx.state.playbook.version}). Use the original pinned package or create a new run.`);
      const previous = results.at(-1);
      ensure(!previous || previous.status === 'complete', `Complete ${previous?.stage} first`);
      let content;
      if (artifactStages.includes(stage)) { content = artifact(ctx, stage); semantic(ctx, stage, content); }
      else {
        content = artifact(ctx, 'design').checks.map(check => evidenceStatus(ctx, check));
        const unresolved = content.filter(check => check.status !== 'pass');
        ensure(!unresolved.length, `Checks not passing: ${unresolved.map(x => `${x.id} (${x.status})`).join(', ')}`);
        const risks = artifact(ctx, 'implementation').risks.filter(x => x.status === 'open' && ['high', 'critical'].includes(x.severity));
        ensure(!risks.length, `Unresolved release risks: ${risks.map(x => x.id).join(', ')}`);
      }
      const source = catalog.stages.indexOf(stage) >= 3 ? sourceSnapshot(ctx.root) : null;
      const referencePaths = stage === 'requirements' ? [...content.requirements, ...content.constraints].filter(x => x.source.kind === 'file').map(x => x.source.reference.split('#')[0]) : stage === 'design' ? content.domainPlans.flatMap(x => x.artifactPaths) : [];
      const references = hashFiles(ctx.root, referencePaths);
      const fingerprint = hashJSON({ stage, input: inputFingerprint(ctx), previous: previous?.fingerprint ?? null, content, source, references });
      results.push({ stage, status: receipt ? (receipt.fingerprint === fingerprint ? 'complete' : 'stale') : 'ready', fingerprint, reason: receipt && receipt.fingerprint !== fingerprint ? 'Inputs, artifacts, source, or evidence changed' : '' });
    } catch (error) { results.push({ stage, status: receipt ? 'stale' : 'blocked', reason: error.message }); }
  }
  return results;
}
function statusContext(ctx) {
  const stages = assess(ctx);
  let checks = [];
  try { checks = artifact(ctx, 'design').checks.map(check => { try { return evidenceStatus(ctx, check); } catch (error) { return { id: check.id, status: 'unverified', reason: error.message }; } }); } catch { /* No plan yet. */ }
  const next = stages.find(stage => stage.status !== 'complete');
  return { id: ctx.state.id, profile: ctx.state.profile, workflow: ctx.state.workflow, ready: !next, stages, checks, next: next ? { ...next, skill: catalog.stageSkills[next.stage] } : null, actor: ctx.state.actors.at(-1), releaseAuthorized: false };
}
export function status(run) { return statusContext(context(run)); }
export function complete(run, stage) {
  ensure(catalog.stages.includes(stage), `Unknown stage: ${stage}`);
  const ctx = context(run);
  return withLock(ctx, () => {
    const result = assess(ctx).find(row => row.stage === stage);
    ensure(result.fingerprint, `${stage}: ${result.reason}`);
    if (result.status !== 'complete') {
      ctx.state.receipts[stage] = { fingerprint: result.fingerprint, completedAt: now(), actor: ctx.state.actors.at(-1) };
      event(ctx, 'complete', { stage, fingerprint: result.fingerprint });
    }
    return statusContext(ctx);
  });
}
export function runCheck(run, id, { rerun = false, reviewFile } = {}) {
  const ctx = context(run);
  return withLock(ctx, () => {
    ensure(assess(ctx).find(x => x.stage === 'implementation').status === 'complete', 'Complete the current implementation stage before collecting evidence');
    const check = artifact(ctx, 'design').checks.find(x => x.id === id);
    ensure(check, `Unknown check: ${id}`);
    const key = contextKey(ctx, check), current = evidenceStatus(ctx, check);
    if (current.status === 'pass' && !rerun) return { ...current, reused: true };
    const allEntries = evidenceList(ctx, id), attempts = allEntries.filter(x => x.context === key);
    ensure(!allEntries.some(x => x.status === 'running') || rerun, 'An interrupted/running attempt exists. Inspect its effects, then use --rerun if re-execution is appropriate.');
    ensure(!attempts.length || rerun, 'A check attempt already exists. Inspect the failure; use --rerun for an intentional retry.');
    ensure(attempts.length < ctx.state.limits.maxAttemptsPerCheck, 'Check attempt budget exhausted for these inputs. Investigate the failure and change the implementation/plan before retrying.');
    let review;
    if (check.kind === 'review') {
      ensure(reviewFile, 'Review check requires --review-file with an existing review receipt');
      review = validate('review', readJSON(reviewFile));
      ensure(review.role === check.reviewerRole, `Expected reviewer role: ${check.reviewerRole}`);
    } else ensure(!reviewFile, 'A command check cannot accept a review receipt');
    const evidence = {
      schemaVersion: 1, id: crypto.randomUUID(), checkId: id, sequence: allEntries.length + 1,
      kind: check.kind, context: key, status: 'running', startedAt: now(), finishedAt: null,
      actor: ctx.state.actors.at(-1), environment: runtimeEnvironment(),
      source: sourceSnapshot(ctx.root), argv: check.argv ?? null, exitCode: null, error: null, summary: '', files: {}
    };
    const evidenceFile = path.join(ctx.run, 'evidence', `${evidence.id}.json`);
    writeJSON(evidenceFile, evidence);
    if (check.kind === 'command') {
      const environment = { ...process.env };
      // Node's parent test harness sets this marker; inheriting it silently skips nested test commands.
      delete environment.NODE_TEST_CONTEXT;
      const result = spawnSync(check.argv[0], check.argv.slice(1), { cwd: ctx.root, env: environment, encoding: 'utf8', shell: false, timeout: check.timeoutSeconds * 1000, killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024 });
      const log = `Command: ${JSON.stringify(check.argv)}\nExit: ${result.status}\nSignal: ${result.signal ?? ''}\n\nSTDOUT\n${result.stdout ?? ''}\nSTDERR\n${result.stderr ?? ''}`;
      const relative = `evidence/${evidence.id}.log`;
      atomicWrite(path.join(ctx.run, relative), log);
      evidence.files[relative] = digest(log);
      evidence.exitCode = result.status;
      evidence.error = result.error?.message ?? (result.signal ? `Terminated by ${result.signal}` : null);
      evidence.status = result.status === 0 && !result.error ? 'pass' : 'fail';
    } else {
      const relative = `evidence/${evidence.id}.review.json`;
      writeJSON(path.join(ctx.run, relative), review);
      evidence.files[relative] = digest(fs.readFileSync(path.join(ctx.run, relative)));
      evidence.status = review.result;
      evidence.summary = `${review.reviewer} (${review.role}): ${review.summary}`;
    }
    try {
      if (contextKey(ctx, check) !== key) throw new Error('Project or inputs changed during the check; reconcile generated files and rerun against a stable source snapshot');
    } catch (error) { evidence.status = 'fail'; evidence.error = error.message; }
    evidence.finishedAt = now();
    writeJSON(evidenceFile, evidence);
    event(ctx, 'check', { check: id, evidence: evidence.id, result: evidence.status });
    return evidenceStatus(ctx, check);
  });
}
export function report(run) {
  const ctx = context(run);
  return withLock(ctx, () => {
    const result = statusContext(ctx);
    const safeArtifact = stage => { try { return artifact(ctx, stage); } catch { return null; } };
    const requirements = safeArtifact('requirements'), design = safeArtifact('design'), implementation = safeArtifact('implementation');
    const traceability = (requirements?.requirements ?? []).map(req => ({ id: req.id, acceptance: req.acceptance, decisions: (design?.decisions ?? []).filter(x => x.requirementIds.includes(req.id)).map(x => x.id), tasks: (design?.tasks ?? []).filter(x => x.requirementIds.includes(req.id)).map(x => x.id), changes: (implementation?.changes ?? []).filter(x => x.requirementIds.includes(req.id)).map(x => x.path), checks: (design?.checks ?? []).filter(x => x.requirementIds.includes(req.id)).map(x => x.id) }));
    const data = { ...result, generatedAt: now(), playbook: ctx.state.playbook, source: sourceSnapshot(ctx.root), traceability, questions: requirements?.questions ?? [], assumptions: requirements?.assumptions ?? [], risks: implementation?.risks ?? [], actors: ctx.state.actors };
    writeJSON(path.join(ctx.run, 'report.json'), data);
    const markdown = `# Engineering readiness: ${ctx.state.id}\n\nResult: **${data.ready ? 'ready' : 'not ready'}** for the ${ctx.state.workflow} workflow. This report does not authorize a release or external action.\n\nEngineering Relay: ${ctx.state.playbook.version}; source revision: ${data.source.revision ?? 'no Git commit'}.\n\n| Stage | Status | Detail |\n|---|---|---|\n${data.stages.map(x => `| ${x.stage} | ${x.status} | ${x.reason.replaceAll('|', '/').replaceAll('\n', ' ')} |`).join('\n')}\n\n## Evidence\n\n${data.checks.map(x => `- ${x.id}: ${x.status}${x.evidence ? ` ([receipt](evidence/${x.evidence}.json))` : ''}`).join('\n') || 'No checks recorded.'}\n\n## Requirement coverage\n\n${traceability.map(x => `- ${x.id}: ${x.acceptance}; checks: ${x.checks.join(', ')}`).join('\n') || 'No requirements recorded.'}\n\n## Next action\n\n${data.next ? `Use ${data.next.skill} for ${data.next.stage}. ${data.next.reason}` : 'Required evidence is current. Follow the project\'s existing release authority and procedures.'}\n\nFull assumptions, questions, risks, provenance, and traceability are in [report.json](report.json).\n`;
    atomicWrite(path.join(ctx.run, 'report.md'), markdown);
    const binary = path.join(PACKAGE_ROOT, 'bin/engineering-relay.mjs');
    const executable = binary.startsWith(`${ctx.root}${path.sep}`) ? path.relative(ctx.root, binary) : binary;
    const quote = text => `'${text.replaceAll("'", "'\\''")}'`;
    const command = `node ${quote(executable)} status --run ${quote(`.engineering/runs/${ctx.state.id}`)}`;
    atomicWrite(path.join(ctx.run, 'handoff.md'), `# Resume ${ctx.state.id}\n\nRun directory: .engineering/runs/${ctx.state.id}\n\n1. Read state.json and the recorded artifacts; inspect existing evidence before executing checks.\n2. From the project root, run \`${command}\` to revalidate current files.\n3. Using the same CLI, record your agent/model with adopt, then use next to select the procedure.\n\n${data.next ? `Next stage: ${data.next.stage}; procedure: ${data.next.skill}.` : 'All stages currently complete.'}\n\nSee [report.md](report.md) and [report.json](report.json). Status in a saved report may become stale; recompute it after handoff.\n`);
    return { ...data, report: path.join(ctx.run, 'report.md'), handoff: path.join(ctx.run, 'handoff.md') };
  });
}
