// Landmålerens matematik: rektangler, omkreds og areal.
// Ren logik uden three.js, så det kan testes med node.
// Bredde = antal rækker (væk fra eleven), længde = felter i hver række (på tværs).

const side = (n, name) => {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Ugyldig ${name}: ${n}`);
  return n;
};

/** Antal felter på 1 × 1 skridt i en mark, der er `w` bred og `l` lang. */
export function area(w, l) {
  return side(w, 'bredde') * side(l, 'længde');
}

/** Hvor langt rebet skal være for at gå hele vejen rundt. */
export function perimeter(w, l) {
  return 2 * (side(w, 'bredde') + side(l, 'længde'));
}

/** Med et reb på `rope` skridt og bredden `w`: hvor lang bliver marken? */
export function lengthFor(rope, w) {
  if (!Number.isInteger(rope) || rope < 4 || rope % 2) throw new Error(`Ugyldigt reb: ${rope}`);
  const l = rope / 2 - side(w, 'bredde');
  if (l < 1) throw new Error(`Rebet på ${rope} er for kort til bredden ${w}`);
  return l;
}

/**
 * Alle marker med hele skridt, som rebet kan gå rundt om (bredde ≤ længde).
 * rectanglesFor(16) -> 1×7, 2×6, 3×5, 4×4 med 7, 12, 15 og 16 felter.
 */
export function rectanglesFor(rope) {
  const out = [];
  for (let w = 1; w <= rope / 4; w++) {
    const l = lengthFor(rope, w);
    out.push({ w, l, area: area(w, l) });
  }
  return out;
}

/** Den mark, rebet giver flest felter med (den mest firkantede). */
export function biggest(rope) {
  return rectanglesFor(rope).reduce((a, b) => (b.area > a.area ? b : a));
}

/** Felterne talt række for række: rowTotals(3, 5) -> [5, 10, 15]. */
export function rowTotals(w, l) {
  side(w, 'bredde'); side(l, 'længde');
  return Array.from({ length: w }, (_, r) => (r + 1) * l);
}

/**
 * Rebets knuder hele vejen rundt, ét skridt imellem, i gitterpunkter [x, y]
 * (x langs længden, y langs bredden). Starter i hjørnet (0, 0) og går med uret
 * set fra eleven: hen langs den forreste side, bagud, tilbage og frem igen.
 * Antallet er lig omkredsen.
 */
export function knotPoints(w, l) {
  const pts = [];
  for (let x = 0; x < l; x++) pts.push([x, 0]);
  for (let y = 0; y < w; y++) pts.push([l, y]);
  for (let x = l; x > 0; x--) pts.push([x, w]);
  for (let y = w; y > 0; y--) pts.push([0, y]);
  return pts;
}
