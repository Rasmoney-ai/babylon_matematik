import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pairUp, pairItems, settleEveningTwo, arrivalTimes } from '../src/math/oneToOne.js';

test('pairUp: lige mange passer', () => {
  assert.deepEqual(pairUp(12, 12), { pairs: 12, extraStones: 0, lonelySheep: 0, match: true });
  assert.deepEqual(pairUp(0, 0), { pairs: 0, extraStones: 0, lonelySheep: 0, match: true });
});

test('pairUp: kugler til overs og får uden kugle', () => {
  assert.deepEqual(pairUp(14, 12), { pairs: 12, extraStones: 2, lonelySheep: 0, match: false });
  assert.deepEqual(pairUp(9, 12), { pairs: 9, extraStones: 0, lonelySheep: 3, match: false });
  assert.throws(() => pairUp(-1, 3));
  assert.throws(() => pairUp(1.5, 3));
});

test('pairItems parrer i rækkefølge', () => {
  const r = pairItems(['a', 'b', 'c'], [1, 2]);
  assert.deepEqual(r.pairs, [['a', 1], ['b', 2]]);
  assert.deepEqual(r.extraStones, ['c']);
  assert.deepEqual(r.lonelySheep, []);
  assert.deepEqual(pairItems([], [1]).lonelySheep, [1]);
});

test('settleEveningTwo: pointen lander altid – én kugle tilbage = ét får mangler', () => {
  for (let removed = 0; removed <= 12; removed++) {
    const r = settleEveningTwo(12, 11, removed);
    assert.equal(r.missing, 1);
    // Efter rettelsen er der taget præcis lige så mange kugler op, som der kom får
    assert.equal(removed - r.putBack + r.takeMore, 11);
    assert.equal(r.ok, removed === 11);
    assert.ok(r.putBack === 0 || r.takeMore === 0, 'aldrig begge dele på én gang');
  }
  assert.throws(() => settleEveningTwo(12, 11, 13));
});

test('arrivalTimes: stigende, uregelmæssige, cirka det ønskede tempo', () => {
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const t = arrivalTimes(12, 3, { rnd });
  assert.equal(t.length, 12);
  assert.equal(t[0], 1);
  const gaps = t.slice(1).map((x, i) => x - t[i]);
  assert.ok(gaps.every((g) => g >= 3 * 0.7 - 1e-9 && g <= 3 * 1.3 + 1e-9));
  assert.ok(new Set(gaps.map((g) => g.toFixed(3))).size > 1, 'ikke helt jævnt');
  const slow = arrivalTimes(12, 4, { rnd: () => 0.5 });
  assert.equal(slow[11], 1 + 11 * 4);
});
