import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import Ajv from 'ajv';
import { PACKAGE_ROOT, readJSON } from '../lib/files.mjs';
import { adapterFiles } from '../lib/install.mjs';
import { validate } from '../lib/validation.mjs';

const failures = [], root = PACKAGE_ROOT;
function check(condition, message) { if (!condition) failures.push(message); }
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['.git', '.engineering', 'node_modules', '.DS_Store'].includes(entry.name)) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root);
for (const file of files.filter(x => x.endsWith('.md'))) {
  const text = fs.readFileSync(file, 'utf8').replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '').replace(/`[^`\n]*`/g, '');
  for (const match of text.matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/g)) {
    const href = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    check(fs.existsSync(path.resolve(path.dirname(file), decodeURIComponent(href))), `${path.relative(root, file)}: missing link ${href}`);
  }
}
const skillNames = fs.readdirSync(path.join(root, 'skills'));
for (const name of skillNames) {
  const skill = path.join(root, 'skills', name, 'SKILL.md');
  const text = fs.readFileSync(skill, 'utf8');
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length <= 64, `Invalid skill directory: ${name}`);
  check(text.startsWith('---\n'), `${name}: missing YAML frontmatter`);
  check(text.match(/^name: (.+)$/m)?.[1] === name, `${name}: name mismatch`);
  const description = text.match(/^description: (.+)$/m)?.[1];
  check(description && description.length <= 1024, `${name}: missing/long description`);
  check(!/\b(TODO|TBD)\b|\[INSERT|\[TODO/.test(text), `${name}: unfinished scaffold`);
}
const catalog = readJSON(path.join(root, 'workflow/catalog.json'));
const docs = fs.readdirSync(path.join(root, 'docs')).filter(x => /^\d\d-/.test(x) && !x.startsWith('00-'));
const covered = new Set(Object.values(catalog.domains).flatMap(domain => domain.documents));
for (const doc of docs) check(covered.has(doc.slice(0, 2)), `Guide is not routed: ${doc}`);
for (const domain of Object.values(catalog.domains)) check(skillNames.includes(domain.skill), `Unknown domain skill: ${domain.skill}`);
for (const name of Object.values(catalog.stageSkills)) check(skillNames.includes(name), `Unknown stage skill: ${name}`);
const ajv = new Ajv({ strict: false });
for (const file of fs.readdirSync(path.join(root, 'schemas'))) {
  const schema = readJSON(path.join(root, 'schemas', file));
  check(ajv.validateSchema(schema), `Invalid JSON schema: ${file}`);
  try { ajv.compile(schema); } catch (error) { failures.push(`${file}: ${error.message}`); }
}
for (const stage of ['intake', 'requirements', 'design', 'implementation']) {
  try { validate(stage, readJSON(path.join(root, 'examples/feature/artifacts', `${stage}.json`))); } catch (error) { failures.push(error.message); }
}
// Native wrappers are present in the source checkout, but are generated at the consumer root on installation.
if (fs.existsSync(path.join(root, '.agents'))) {
  for (const adapter of ['codex', 'copilot']) for (const [name, expected] of adapterFiles(root, adapter, '.')) check(fs.existsSync(path.join(root, name)) && fs.readFileSync(path.join(root, name), 'utf8') === expected, `Stale adapter: ${name}; run node scripts/sync-adapters.mjs`);
}
for (const file of files.filter(x => x.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  check(result.status === 0, `Syntax error: ${file}\n${result.stderr}`);
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Validated ${skillNames.length} skills, ${docs.length} guide mappings, schemas, examples, links, adapters, and JavaScript syntax.`);
