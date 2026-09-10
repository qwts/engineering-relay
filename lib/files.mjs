import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

export const PACKAGE_ROOT = fileURLToPath(new URL('../', import.meta.url));
export const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const digest = value => crypto.createHash('sha256').update(value).digest('hex');
export const hashJSON = value => digest(JSON.stringify(value));
export const now = () => new Date().toISOString();
export function writeJSON(file, value) { atomicWrite(file, `${JSON.stringify(value, null, 2)}\n`); }
export function atomicWrite(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try { fs.writeFileSync(temp, value); fs.renameSync(temp, file); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
export function inside(root, relative, { missing = false } = {}) {
  if (!relative || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) {
    throw new Error(`Expected a project-relative path without '..': ${relative}`);
  }
  const base = fs.realpathSync(root);
  const target = path.resolve(base, relative);
  if (!target.startsWith(`${base}${path.sep}`)) throw new Error(`Path escapes project: ${relative}`);
  let ancestor = target;
  while (!fs.existsSync(ancestor) && ancestor !== base) ancestor = path.dirname(ancestor);
  const real = fs.realpathSync(ancestor);
  if (real !== base && !real.startsWith(`${base}${path.sep}`)) throw new Error(`Symlink escapes project: ${relative}`);
  if (!missing && !fs.existsSync(target)) throw new Error(`Missing file: ${relative}`);
  return target;
}
export function hashFiles(root, names) {
  return Object.fromEntries([...new Set(names)].sort().map(name => {
    const file = inside(root, name, { missing: true });
    if (!fs.existsSync(file)) return [name, null];
    if (!fs.statSync(file).isFile()) throw new Error(`Expected a file: ${name}`);
    return [name, digest(fs.readFileSync(file))];
  }));
}
const excluded = new Set(['.git', '.engineering', 'node_modules', '.DS_Store']);
function walk(root, prefix = '') {
  return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
    if (excluded.has(entry.name)) return [];
    const name = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) return walk(root, name);
    return [name];
  });
}
export function sourceSnapshot(root) {
  const git = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' });
  const names = git.status === 0 ? git.stdout.split('\0').filter(Boolean) : walk(root);
  // Run state and installed workflow are bookkeeping, not application source.
  const selected = names.filter(name => !name.split('/').some(part => excluded.has(part)));
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  return { revision: revision.status === 0 ? revision.stdout.trim() : null, files: hashFiles(root, selected) };
}
export function packageFingerprint() {
  const names = ['package.json'];
  for (const directory of ['bin', 'lib', 'schemas', 'workflow', 'skills', 'docs']) {
    if (fs.existsSync(path.join(PACKAGE_ROOT, directory))) names.push(...walk(PACKAGE_ROOT, directory));
  }
  return hashJSON({ files: hashFiles(PACKAGE_ROOT, names), runtime: runtimeEnvironment().dependencies });
}
export function runtimeEnvironment() {
  const seen = new Set(), versions = new Set();
  function visit(directory) {
    const pkg = readJSON(path.join(directory, 'package.json'));
    const require = createRequire(path.join(directory, 'package.json'));
    for (const name of Object.keys(pkg.dependencies ?? {})) {
      const manifest = require.resolve(`${name}/package.json`);
      if (seen.has(manifest)) continue;
      seen.add(manifest);
      const dependency = readJSON(manifest);
      versions.add(`${dependency.name}@${dependency.version}`);
      visit(path.dirname(manifest));
    }
  }
  visit(PACKAGE_ROOT);
  return { node: process.version, platform: process.platform, dependencies: [...versions].sort() };
}
