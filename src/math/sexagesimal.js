// Babylonisk 60-talssystem. Ren logik uden three.js, så det kan testes med node.

/** 75 -> [1, 15]   (1 sekstital og 15 enere) */
export function toBase60(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error(`Ugyldigt tal: ${n}`);
  if (n === 0) return [0];
  const digits = [];
  while (n > 0) {
    digits.unshift(n % 60);
    n = Math.floor(n / 60);
  }
  return digits;
}

/** [1, 15] -> 75 */
export function fromBase60(digits) {
  return digits.reduce((acc, d) => acc * 60 + d, 0);
}

/** Et babylonisk "ciffer" (0-59) skrives som vinkler (10) og lodrette kiler (1). */
export function splitDigit(d) {
  return { tens: Math.floor(d / 10), ones: d % 10 };
}

/** Hvordan enerkilerne stables i rækker, så de er lette at tælle. */
export const ONES_LAYOUT = {
  0: [], 1: [1], 2: [2], 3: [3], 4: [2, 2], 5: [3, 2],
  6: [3, 3], 7: [4, 3], 8: [4, 4], 9: [3, 3, 3],
};

/** Venstrestil med nuller, så tallet altid fylder `places` kolonner. */
export function padPlaces(digits, places) {
  const out = digits.slice();
  while (out.length < places) out.unshift(0);
  return out;
}
