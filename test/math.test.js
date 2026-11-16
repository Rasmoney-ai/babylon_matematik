import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toBase60, fromBase60, splitDigit, ONES_LAYOUT, padPlaces } from '../src/math/sexagesimal.js';
import { PLAN, makeQuestion, makeDistractors } from '../src/game/questions.js';

test('toBase60 / fromBase60', () => {
  assert.deepEqual(toBase60(0), [0]);
  assert.deepEqual(toBase60(59), [59]);
  assert.deepEqual(toBase60(60), [1, 0]);
  assert.deepEqual(toBase60(75), [1, 15]);
  assert.deepEqual(toBase60(3600), [1, 0, 0]);
  for (let n = 0; n < 5000; n++) assert.equal(fromBase60(toBase60(n)), n);
});

test('splitDigit og kile-layout', () => {
  assert.deepEqual(splitDigit(43), { tens: 4, ones: 3 });
  for (let i = 0; i <= 9; i++) assert.equal(ONES_LAYOUT[i].reduce((a, b) => a + b, 0), i);
});

test('padPlaces', () => {
  assert.deepEqual(padPlaces([7], 2), [0, 7]);
  assert.deepEqual(padPlaces([1, 15], 2), [1, 15]);
});

test('opgaver har tre forskellige svar inkl. det rigtige', () => {
  for (let k = 0; k < 500; k++) {
    for (const stage of new Set(PLAN)) {
      const q = makeQuestion(stage);
      assert.equal(q.options.length, 3);
      assert.equal(new Set(q.options).size, 3);
      assert.ok(q.options.includes(q.answer));
      assert.ok(q.options.every((x) => x > 0));
      assert.ok(q.digits.length <= 2, 'bane 1 bruger højst to pladser');
    }
  }
});

test('distraktor for glemt pladsværdi', () => {
  assert.ok(makeDistractors(75, 'C').includes(16));
});
