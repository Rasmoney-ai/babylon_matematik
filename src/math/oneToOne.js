// Én-til-én: at sammenligne to mængder uden at tælle dem.
// Hyrden parrer lerkugler med får. Ren logik uden three.js, så det kan testes med node.
// Tallene her bruges kun internt i spillet – eleven ser dem aldrig.

const count = (n, name) => {
  if (!Number.isInteger(n) || n < 0) throw new Error(`Ugyldigt antal ${name}: ${n}`);
  return n;
};

/**
 * Parrer kugler og får én-til-én.
 * @returns {{ pairs:number, extraStones:number, lonelySheep:number, match:boolean }}
 */
export function pairUp(stones, sheep) {
  count(stones, 'kugler'); count(sheep, 'får');
  const pairs = Math.min(stones, sheep);
  return { pairs, extraStones: stones - pairs, lonelySheep: sheep - pairs, match: stones === sheep };
}

/**
 * Samme parring, men med konkrete ting (fx kugle- og fåre-objekter i rækkefølge).
 * Kugle nr. i hører til får nr. i. Resten er til overs i den ene eller anden side.
 */
export function pairItems(stones, sheep) {
  const n = Math.min(stones.length, sheep.length);
  return {
    pairs: stones.slice(0, n).map((s, i) => [s, sheep[i]]),
    extraStones: stones.slice(n),
    lonelySheep: sheep.slice(n),
  };
}

/**
 * Anden aften: krukken havde `jar` kugler (én pr. får i flokken). `arrived` får kom hjem,
 * og eleven tog `removed` kugler op. Hvad skal rettes, før pointen lander?
 *  - putBack:  kugler taget op uden et får → tilbage i krukken
 *  - takeMore: får der gik ind uden at en kugle blev taget op → én kugle mere op for hvert
 *  - missing:  kugler der bliver tilbage i krukken, når alt er rettet = får der mangler
 */
export function settleEveningTwo(jar, arrived, removed) {
  count(jar, 'kugler'); count(arrived, 'får'); count(removed, 'kugler');
  if (removed > jar) throw new Error('Kan ikke tage flere kugler op, end der er i krukken');
  const check = pairUp(removed, arrived);
  return {
    putBack: check.extraStones,
    takeMore: check.lonelySheep,
    missing: Math.max(0, jar - arrived),
    ok: check.match,
  };
}

/**
 * Hvornår fårene går gennem lågen: ca. ét hvert `gap` sekund, lidt uregelmæssigt.
 * `rnd` kan udskiftes i tests. Første får kommer efter `first` sekunder.
 */
export function arrivalTimes(n, gap = 3, { jitter = 0.3, first = 1, rnd = Math.random } = {}) {
  count(n, 'får');
  const out = [];
  let t = first;
  for (let i = 0; i < n; i++) {
    out.push(t);
    t += gap * (1 + (rnd() * 2 - 1) * jitter);
  }
  return out;
}
