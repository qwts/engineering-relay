import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { PACKAGE_ROOT, readJSON, writeJSON, atomicWrite, inside, digest } from './files.mjs';

const markerStart = '<!-- engineering-relay:start -->';
const markerEnd = '<!-- engineering-relay:end -->';
function mergeBlock(original, block) {
  if (/<!-- engineering-playbook:(?:start|end) -->/.test(original)) throw new Error('Legacy workflow instructions already installed. Keep the original runtime pinned; adopt Engineering Relay in a separate checkout.');
  const start = original.indexOf(markerStart), end = original.indexOf(markerEnd);
  if ((start >= 0) !== (end >= 0) || (start >= 0 && end < start)) throw new Error('Malformed Engineering Relay markers; reconcile the instruction file first');
  if (start >= 0) return original.slice(0, start) + block + original.slice(end + markerEnd.length);
  return `${original}${original && !original.endsWith('\n') ? '\n' : ''}\n${block}\n`;
}
export function adapterFiles(target, adapter, packagePath = '.engineering/relay') {
  if (!['generic', 'codex', 'copilot'].includes(adapter)) throw new Error(`Unknown adapter: ${adapter}`);
  const relativePackage = packagePath === '.' ? '' : `${packagePath}/`;
  const block = `${markerStart}\n## Engineering Relay\n\nFor engineering workflow tasks, read [the coordinator](${relativePackage}skills/engineering-workflow/SKILL.md). Use the existing project instructions and user scope to choose applicable work.\n\nResume from .engineering/runs/ using \`node ${relativePackage}bin/engineering-relay.mjs next --run .engineering/runs/RUN_ID\`. Preserve decisions and inspect prior evidence before repeating actions. Engineering Relay does not grant release authority.\n${markerEnd}`;
  const existing = file => { const full = inside(target, file, { missing: true }); return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : ''; };
  const files = new Map([['AGENTS.md', mergeBlock(existing('AGENTS.md'), block)]]);
  if (adapter === 'codex') {
    for (const entry of fs.readdirSync(path.join(PACKAGE_ROOT, 'skills'))) {
      const skill = fs.readFileSync(path.join(PACKAGE_ROOT, 'skills', entry, 'SKILL.md'), 'utf8');
      const metadata = skill.split('---')[1].trim();
      const reference = `../../../${relativePackage}skills/${entry}/SKILL.md`;
      files.set(`.agents/skills/${entry}/SKILL.md`, `---\n${metadata}\n---\n\nRead and follow the [canonical ${entry} procedure](${reference}). Load only the references needed for the current task.\n`);
    }
  }
  if (adapter === 'copilot') {
    files.set('.github/agents/engineering-relay.agent.md', `---\nname: Engineering Relay\ndescription: Run or resume the engineering workflow with persistent decisions and verified evidence\n---\n\nRead the [coordinator](../../${relativePackage}skills/engineering-workflow/SKILL.md). Follow its procedures using the tools enabled by the host. Persist artifacts in .engineering/runs/; obtain execution or write capabilities when necessary to complete authorized work.\n`);
    files.set('.github/copilot-instructions.md', mergeBlock(existing('.github/copilot-instructions.md'), `${markerStart}\nUse the [engineering coordinator](../${relativePackage}skills/engineering-workflow/SKILL.md) for Engineering Relay workflow tasks. Follow the project's AGENTS.md and existing conventions.\n${markerEnd}`));
  }
  return files;
}
export function syncAdapters(target = PACKAGE_ROOT) {
  for (const adapter of ['codex', 'copilot']) {
    for (const [name, content] of adapterFiles(target, adapter, '.')) atomicWrite(inside(target, name, { missing: true }), content);
  }
}
function copyRuntimeDependencies(destination) {
  const seen = new Set();
  function copy(name, from) {
    if (seen.has(name)) return;
    seen.add(name);
    const require = createRequire(path.join(from, 'package.json'));
    const manifest = require.resolve(`${name}/package.json`);
    const source = path.dirname(manifest), pkg = readJSON(manifest);
    fs.cpSync(source, path.join(destination, 'node_modules', name), { recursive: true, dereference: true });
    for (const dependency of Object.keys(pkg.dependencies ?? {})) copy(dependency, source);
  }
  for (const name of Object.keys(readJSON(path.join(PACKAGE_ROOT, 'package.json')).dependencies ?? {})) copy(name, PACKAGE_ROOT);
}
export function install(target, adapter = 'generic') {
  const root = fs.realpathSync(target);
  const legacy = inside(root, '.engineering/playbook', { missing: true });
  if (fs.existsSync(legacy)) throw new Error(`Legacy workflow already installed at ${legacy}. Keep it pinned for existing runs; adopt Engineering Relay in a separate checkout.`);
  const destination = inside(root, '.engineering/relay', { missing: true });
  if (fs.existsSync(destination)) throw new Error(`Engineering Relay already installed at ${destination}. Keep it pinned for existing runs; install upgrades in a separate checkout after reviewing changes.`);
  const files = adapterFiles(root, adapter);
  // Preflight every generated file before copying anything. Existing project prose is merged only in marked blocks.
  for (const [name, content] of files) {
    const file = inside(root, name, { missing: true });
    if (fs.existsSync(file) && !['AGENTS.md', '.github/copilot-instructions.md'].includes(name) && fs.readFileSync(file, 'utf8') !== content) throw new Error(`Adapter conflicts with existing file: ${name}`);
  }
  const copied = [], backups = new Map();
  let ownsDestination = false;
  try {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.mkdirSync(destination);
    ownsDestination = true;
    for (const name of ['bin', 'lib', 'schemas', 'workflow', 'skills', 'docs', 'examples', 'evaluations', 'test', 'scripts', '.github/workflows/validate.yml', '.github/rulesets/main.json', 'package.json', 'README.md', 'usage.md', 'CHANGELOG.md']) {
      fs.mkdirSync(path.dirname(path.join(destination, name)), { recursive: true });
      fs.cpSync(path.join(PACKAGE_ROOT, name), path.join(destination, name), { recursive: true });
    }
    copyRuntimeDependencies(destination);
    for (const [name, content] of files) {
      const file = inside(root, name, { missing: true });
      backups.set(file, fs.existsSync(file) ? fs.readFileSync(file) : null);
      atomicWrite(file, content); copied.push(file);
    }
    writeJSON(path.join(destination, 'installation.json'), { version: readJSON(path.join(PACKAGE_ROOT, 'package.json')).version, adapter, files: Object.fromEntries([...files].map(([name, content]) => [name, digest(content)])) });
    return { installed: destination, adapter, entrypoint: path.join(destination, 'bin/engineering-relay.mjs') };
  } catch (error) {
    for (const file of copied.reverse()) { const backup = backups.get(file); if (backup) atomicWrite(file, backup); else fs.unlinkSync(file); }
    if (ownsDestination) fs.rmSync(destination, { recursive: true, force: true });
    throw error;
  }
}
