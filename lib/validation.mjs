import path from 'node:path';
import Ajv from 'ajv';
import { PACKAGE_ROOT, readJSON } from './files.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
const validators = new Map();
export function validate(name, value) {
  if (!validators.has(name)) validators.set(name, ajv.compile(readJSON(path.join(PACKAGE_ROOT, 'schemas', `${name}.schema.json`))));
  const validator = validators.get(name);
  if (!validator(value)) throw new Error(`${name}: ${ajv.errorsText(validator.errors, { separator: '; ' })}`);
  return value;
}
