import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDuration } from '../src/duration.mjs';

// These expected values are literal fixtures, not calculated by the test.
const validCases = [
  [0, '00:00:00'],
  [-0, '00:00:00'],
  [1, '00:00:01'],
  [9, '00:00:09'],
  [59, '00:00:59'],
  [60, '00:01:00'],
  [61, '00:01:01'],
  [3599, '00:59:59'],
  [3600, '01:00:00'],
  [3661, '01:01:01'],
  [86399, '23:59:59'],
  [86400, '24:00:00'],
  [359999, '99:59:59'],
  [360000, '100:00:00'],
  [360001, '100:00:01'],
  [Number.MAX_SAFE_INTEGER, '2501999792983:36:31'],
  [9007199254740992, '2501999792983:36:32'],
  // Independently derived from Python's exact integer representation of
  // sys.float_info.max, which has the same binary64 value as Number.MAX_VALUE.
  [Number.MAX_VALUE,
    '49935920412842103004035395481028987999464046534956943499699299111988127994452371877941544064657466158761238598198439573398422590802628939657907651862093754718347197382375356132290413913997035817798852363459759428417939788028673041157169044258923152298554951723373534213538382550255361078125112229495590238:26:08'],
];

for (const [seconds, expected] of validCases) {
  test(`formats ${Object.is(seconds, -0) ? '-0' : seconds} seconds as ${expected}`, () => {
    assert.equal(formatDuration(seconds), expected);
  });
}

const nonNumbers = [
  ['undefined', undefined],
  ['null', null],
  ['numeric string', '60'],
  ['empty string', ''],
  ['true', true],
  ['false', false],
  ['array', [60]],
  ['object', {}],
  ['boxed number', new Number(60)],
  ['bigint', 60n],
  ['symbol', Symbol('seconds')],
  ['function', () => 60],
  ['object with a coercion hook', {
    [Symbol.toPrimitive]() { throw new Error('The input must not be coerced'); },
  }],
];

for (const [label, input] of nonNumbers) {
  test(`rejects ${label} with TypeError`, () => {
    assert.throws(() => formatDuration(input), { constructor: TypeError });
  });
}

for (const input of [-1, -Number.MAX_VALUE, -0.5, 0.5, 1.5, Number.MIN_VALUE, NaN, Infinity, -Infinity]) {
  test(`rejects invalid numeric value ${input} with RangeError`, () => {
    assert.throws(() => formatDuration(input), { constructor: RangeError });
  });
}
