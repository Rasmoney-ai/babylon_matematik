import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bundle, exchangeSteps, share, dealPlan, fairParts, triedEnough } from '../src/math/grouping.js';

test('bundle: tiere og løse', () => {
  assert.deepEqual(bundle(34, 10), { bundles: 3, loose: 4 });
  assert.deepEqual(bundle(9, 10), { bundles: 0, loose: 9 });
  assert.deepEqual(bundle(60, 10), { bundles: 6, loose: 0 });
  assert.deepEqual(bundle(75, 60), { bundles: 1, loose: 15 });
  assert.throws(() => bundle(-1));
  assert.throws(() => bundle(5, 1));
});

test('exchangeSteps: én bytning ad gangen', () => {
  assert.deepEqual(exchangeSteps(34, 10), [24, 14, 4]);
  assert.deepEqual(exchangeSteps(7, 10), []);
});

test('share: deling med rest', () => {
  assert.deepEqual(share(10, 2), { parts: 2, each: 5, rest: 0, fair: true });
  assert.deepEqual(share(10, 3), { parts: 3, each: 3, rest: 1, fair: false });
  assert.deepEqual(share(10, 4), { parts: 4, each: 2, rest: 2, fair: false });
  assert.deepEqual(share(60, 7), { parts: 7, each: 8, rest: 4, fair: false });
  for (let n = 0; n < 200; n++) {
    for (let p = 1; p < 13; p++) {
      const s = share(n, p);
      assert.equal(s.each * p + s.rest, n);
      assert.ok(s.rest >= 0 && s.rest < p);
    }
  }
  assert.throws(() => share(10, 0));
});

test('dealPlan: rundt én ad gangen, resten bliver liggende', () => {
  const d = dealPlan(10, 3);
  assert.deepEqual(d.order, [0, 1, 2, 0, 1, 2, 0, 1, 2]);
  assert.equal(d.rest, 1);
  const d60 = dealPlan(60, 4);
  assert.equal(d60.order.length, 60);
  for (let b = 0; b < 4; b++) assert.equal(d60.order.filter((x) => x === b).length, 15);
});

test('fairParts: 10 er besværligt, 60 er let at dele', () => {
  assert.deepEqual(fairParts(10, [2, 3, 4, 5]), [2, 5]);
  assert.deepEqual(fairParts(60, [2, 3, 4, 5, 6, 7]), [2, 3, 4, 5, 6]);
  // 60 har flere delere end alle mindre tal
  const divisors = (n) => fairParts(n, Array.from({ length: n }, (_, i) => i + 1)).length;
  for (let n = 1; n < 60; n++) assert.ok(divisors(n) < divisors(60), `${n}`);
});

test('triedEnough', () => {
  assert.equal(triedEnough([2], { atLeast: 2, anyOf: [3, 4] }), false);
  assert.equal(triedEnough([2, 5], { atLeast: 2, anyOf: [3, 4] }), false);
  assert.equal(triedEnough([2, 3], { atLeast: 2, anyOf: [3, 4] }), true);
  assert.equal(triedEnough([2, 5, 6, 7], { atLeast: 4, must: [3, 4] }), false);
  assert.equal(triedEnough([2, 3, 4, 7, 3], { atLeast: 4, must: [3, 4] }), true);
  assert.equal(triedEnough([3, 4, 3, 4], { atLeast: 4, must: [3, 4] }), false);
});
