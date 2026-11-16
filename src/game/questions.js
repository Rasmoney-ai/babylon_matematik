// Opgavegenerator til bane 1: "Læs tavlen". Ren logik, testbar med node.
import { toBase60 } from '../math/sexagesimal.js';

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/**
 * Trin:
 *  A  1-9          kun lodrette kiler
 *  B  11-59        vinkler (10) og kiler (1)
 *  C  61-119       én kile på 60'er-pladsen
 *  D  120-599      flere 60'ere
 */
export const PLAN = ['A', 'B', 'B', 'C', 'C', 'C', 'D', 'D'];

export function makeNumber(stage) {
  switch (stage) {
    case 'A': return rand(2, 9);
    case 'B': {
      let n;
      do { n = rand(11, 59); } while (n % 10 === 0 || Math.floor(n / 10) === n % 10);
      return n;
    }
    case 'C': return 60 + rand(1, 59);
    case 'D': return rand(2, 5) * 60 + rand(1, 59);
    default: throw new Error(`Ukendt trin ${stage}`);
  }
}

/** Forkerte svar bygget på typiske misforståelser. */
export function makeDistractors(n, stage) {
  const out = new Set();
  const add = (x) => { if (Number.isInteger(x) && x > 0 && x !== n) out.add(x); };
  const d = toBase60(n);

  if (stage === 'A') {
    add(n + 1); add(n - 1); add(n + 2);
  } else if (stage === 'B') {
    add((n % 10) * 10 + Math.floor(n / 10)); // byttet om på tiere og enere
    add(n + 10); add(n - 1);
  } else {
    const [sixties, rest] = d;
    add(sixties + rest);              // glemt pladsværdien: læst 1,15 som 16
    add(sixties * 10 + rest);         // læst venstre kile som 10
    add((sixties + 1) * 60 + rest);   // talt 60'erne forkert
  }
  while (out.size < 2) add(n + rand(-12, 12));
  return [...out].slice(0, 2);
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeQuestion(stage) {
  const n = makeNumber(stage);
  return { stage, answer: n, digits: toBase60(n), options: shuffle([n, ...makeDistractors(n, stage)]) };
}

/** Forklaring når eleven svarer rigtigt. */
export function explain(q) {
  const d = toBase60(q.answer);
  if (d.length === 1) {
    const t = Math.floor(q.answer / 10), o = q.answer % 10;
    if (t === 0) return `${o} kiler er ${o}.`;
    return `${t} vinkler er ${t * 10}, og ${o} kiler er ${o}. ${t * 10} + ${o} = ${q.answer}.`;
  }
  const [s, r] = d;
  return `${s} på 60-pladsen er ${s * 60}. Plus ${r} enere: ${s * 60} + ${r} = ${q.answer}.`;
}
