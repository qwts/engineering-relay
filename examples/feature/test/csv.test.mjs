import test from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../src/csv.mjs';

test('explicit column order, header, CRLF, null and absent values', () => {
  assert.equal(toCsv([{ name: 'Ada', age: 37 }, { name: null }], ['age', 'name']), 'age,name\r\n37,Ada\r\n,\r\n');
  assert.equal(toCsv([], ['name']), 'name\r\n');
});
test('quotes commas, embedded quotes, and line breaks in fields and headers', () => {
  assert.equal(toCsv([{ 'a,b': 'said "hi"', notes: 'one\ntwo' }], ['a,b', 'notes']), '"a,b",notes\r\n"said ""hi""","one\ntwo"\r\n');
  assert.equal(toCsv([{ value: 'a\rb' }], ['value']), 'value\r\n"a\rb"\r\n');
});
test('does not mutate input and rejects invalid top-level arguments', () => {
  const rows = Object.freeze([Object.freeze({ x: 0, y: false })]);
  const columns = Object.freeze(['y', 'x']);
  assert.equal(toCsv(rows, columns), 'y,x\r\nfalse,0\r\n');
  assert.throws(() => toCsv({}, []), TypeError);
  assert.throws(() => toCsv([], null), TypeError);
});
