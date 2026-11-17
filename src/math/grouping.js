// Købmandens matematik: at samle i bundter og at dele ligeligt.
// Ren logik uden three.js, så det kan testes med node.

const whole = (n, name) => {
  if (!Number.isInteger(n) || n < 0) throw new Error(`Ugyldigt antal ${name}: ${n}`);
  return n;
};

/**
 * Saml `n` ting i bundter på `size`.
 * @returns {{ bundles:number, loose:number }}  fx bundle(34, 10) -> { bundles: 3, loose: 4 }
 */
export function bundle(n, size = 10) {
  whole(n, 'ting');
  if (!Number.isInteger(size) || size < 2) throw new Error(`Ugyldig bundtstørrelse: ${size}`);
  return { bundles: Math.floor(n / size), loose: n % size };
}

/**
 * Bytningerne én ad gangen: hvor mange løse ting der er tilbage efter hver bytning.
 * exchangeSteps(34, 10) -> [24, 14, 4]
 */
export function exchangeSteps(n, size = 10) {
  const { bundles } = bundle(n, size);
  return Array.from({ length: bundles }, (_, i) => n - (i + 1) * size);
}

/**
 * Del `total` ligeligt mellem `parts`.
 * @returns {{ parts:number, each:number, rest:number, fair:boolean }}
 */
export function share(total, parts) {
  whole(total, 'ting');
  if (!Number.isInteger(parts) || parts < 1) throw new Error(`Ugyldigt antal dele: ${parts}`);
  const each = Math.floor(total / parts);
  const rest = total - each * parts;
  return { parts, each, rest, fair: rest === 0 };
}

/**
 * Sådan deles der ud: én ad gangen rundt, ligesom når man deler kort ud.
 * `order[k]` er den kurv, ting nr. k lander i. De sidste `rest` ting deles ikke ud.
 */
export function dealPlan(total, parts) {
  const s = share(total, parts);
  const order = Array.from({ length: s.each * parts }, (_, k) => k % parts);
  return { ...s, order };
}

/** De antal blandt `candidates`, som `total` kan deles ligeligt mellem. */
export function fairParts(total, candidates) {
  return candidates.filter((p) => share(total, p).fair);
}

/**
 * Er eleven klar til at gå videre? Hun skal have prøvet mindst `atLeast` forskellige antal,
 * og alle tal i `must` skal være blandt dem. `anyOf` (valgfri): mindst ét af dem.
 */
export function triedEnough(tried, { atLeast = 1, must = [], anyOf = null } = {}) {
  const set = new Set(tried);
  if (set.size < atLeast) return false;
  if (!must.every((m) => set.has(m))) return false;
  if (anyOf && !anyOf.some((m) => set.has(m))) return false;
  return true;
}
