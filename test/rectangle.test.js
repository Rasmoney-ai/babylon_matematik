import { test } from 'node:test';
import assert from 'node:assert/strict';
import { area, perimeter, lengthFor, rectanglesFor, biggest, rowTotals, knotPoints } from '../src/math/rectangle.js';
import { triedEnough } from '../src/math/grouping.js';

test('areal og omkreds', () => {
  assert.equal(area(3, 5), 15);
  assert.equal(perimeter(3, 5), 16);
  assert.equal(area(5, 5), 25);
  assert.equal(perimeter(5, 5), 20);
  assert.throws(() => area(0, 5));
  assert.throws(() => perimeter(2.5, 3));
});

test('længden følger bredden, når rebet er det samme', () => {
  assert.equal(lengthFor(16, 1), 7);
  assert.equal(lengthFor(16, 4), 4);
  assert.throws(() => lengthFor(16, 8));
  assert.throws(() => lengthFor(15, 2));
  for (let w = 1; w <= 7; w++) assert.equal(perimeter(w, lengthFor(16, w)), 16);
});

test('samme reb, forskellig mark: 7, 12, 15, 16', () => {
  const shapes = rectanglesFor(16);
  assert.deepEqual(shapes.map((s) => [s.w, s.l, s.area]), [[1, 7, 7], [2, 6, 12], [3, 5, 15], [4, 4, 16]]);
  for (const s of shapes) assert.equal(perimeter(s.w, s.l), 16);
  assert.deepEqual(biggest(16), { w: 4, l: 4, area: 16 });
  // Den firkantede mark er altid størst
  for (let rope = 4; rope <= 40; rope += 2) {
    const b = biggest(rope);
    assert.ok(Math.abs(b.l - b.w) <= 1, `reb ${rope}`);
  }
});

test('felterne række for række', () => {
  assert.deepEqual(rowTotals(3, 5), [5, 10, 15]);
  assert.deepEqual(rowTotals(1, 7), [7]);
  assert.deepEqual(rowTotals(5, 5).at(-1), 25);
});

test('knuderne: én pr. skridt hele vejen rundt', () => {
  for (const [w, l] of [[3, 5], [1, 7], [4, 4], [5, 5], [1, 1]]) {
    const pts = knotPoints(w, l);
    assert.equal(pts.length, perimeter(w, l));
    assert.equal(new Set(pts.map((p) => p.join())).size, pts.length, 'ingen knude to gange');
    // Nabo-knuder ligger præcis ét skridt fra hinanden (også fra den sidste til den første)
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      assert.equal(Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]), 1);
    });
    for (const c of [[0, 0], [l, 0], [l, w], [0, w]]) assert.ok(pts.some((p) => p[0] === c[0] && p[1] === c[1]), 'hjørne');
  }
});

test('hvornår har eleven prøvet nok former? (mindst tre, med 1×7 og 4×4)', () => {
  const rule = { atLeast: 3, must: [1, 4] };
  assert.equal(triedEnough([1, 4], rule), false);
  assert.equal(triedEnough([2, 3, 4], rule), false);
  assert.equal(triedEnough([1, 1, 4, 4], rule), false);
  assert.equal(triedEnough([1, 2, 4], rule), true);
  assert.equal(triedEnough([3, 1, 2, 4], rule), true);
});
