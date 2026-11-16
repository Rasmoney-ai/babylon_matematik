// Tegner ler-overflader, kileskrift og indtrykte tal på et canvas.
import { splitDigit, ONES_LAYOUT, padPlaces } from '../math/sexagesimal.js';

const CLAY = '#c79a68';
const INK = 'rgba(70, 40, 18, 0.92)';      // bunden af aftrykket
const RIM = 'rgba(255, 232, 196, 0.55)';   // lys kant langs aftrykket

/** Lerbaggrund med lidt korn og skygge i kanterne. Deterministisk via seed. */
export function paintClay(ctx, w, h, seed = 1, base = CLAY) {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 60; i++) {
    const x = rnd() * w, y = rnd() * h, r = rnd() * 2.2 + 0.4;
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(90,55,25,0.10)' : 'rgba(255,240,210,0.10)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(60,30,10,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function impress(ctx, path) {
  ctx.save();
  ctx.translate(1.5, 1.5);
  path(); ctx.fillStyle = RIM; ctx.fill();
  ctx.restore();
  path(); ctx.fillStyle = INK; ctx.fill();
}

/** Lodret kile (= 1). (cx, top) er toppen af hovedet. */
function drawWedge(ctx, cx, top, s) {
  impress(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(cx - 0.26 * s, top);
    ctx.lineTo(cx + 0.26 * s, top);
    ctx.lineTo(cx + 0.06 * s, top + 0.34 * s);
    ctx.lineTo(cx + 0.02 * s, top + s);
    ctx.lineTo(cx - 0.02 * s, top + s);
    ctx.lineTo(cx - 0.06 * s, top + 0.34 * s);
    ctx.closePath();
  });
}

/** Vinkel ‹ (= 10). (left, cy) er spidsen. */
function drawChevron(ctx, left, cy, s) {
  impress(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(left, cy);
    ctx.lineTo(left + 0.75 * s, cy - 0.42 * s);
    ctx.lineTo(left + 0.72 * s, cy - 0.34 * s);
    ctx.lineTo(left + 0.3 * s, cy - 0.04 * s);
    ctx.lineTo(left + 0.3 * s, cy + 0.04 * s);
    ctx.lineTo(left + 0.72 * s, cy + 0.34 * s);
    ctx.lineTo(left + 0.75 * s, cy + 0.42 * s);
    ctx.closePath();
  });
}

/** Ét babylonisk ciffer (0-59) centreret i en celle. */
export function drawDigit(ctx, d, cell) {
  const { tens, ones } = splitDigit(d);
  const rows = ONES_LAYOUT[ones];
  const maxRow = Math.max(0, ...rows);
  let s = cell.h * 0.34;
  const chevW = 0.62, wedgeW = 0.5, gap = 0.35;
  const width = (k) => tens * chevW * k + (tens && maxRow ? gap * k : 0) + maxRow * wedgeW * k;
  while (width(s) > cell.w * 0.88 && s > 4) s *= 0.92;
  const rowH = s * 0.62;
  const onesH = rows.length ? s + (rows.length - 1) * rowH : 0;
  if (onesH > cell.h * 0.85) s *= (cell.h * 0.85) / onesH;

  let x = cell.x + (cell.w - width(s)) / 2;
  const cy = cell.y + cell.h / 2;
  for (let i = 0; i < tens; i++) {
    // vinkler stables to og to lodret, hvis der er mange
    drawChevron(ctx, x, cy, s);
    x += chevW * s;
  }
  if (tens && maxRow) x += gap * s;
  const totalH = s + (rows.length - 1) * (s * 0.62);
  let top = cy - totalH / 2;
  rows.forEach((count) => {
    const rowW = count * wedgeW * s;
    let cx = x + (maxRow * wedgeW * s - rowW) / 2 + (wedgeW * s) / 2;
    for (let i = 0; i < count; i++) { drawWedge(ctx, cx, top, s); cx += wedgeW * s; }
    top += s * 0.62;
  });
}

/**
 * En hel tavle med et tal skrevet i kolonner (pladser).
 * Kolonnerne er markeret med riller og etiketter, så pladsværdien er synlig.
 */
export function drawNumberTablet(ctx, w, h, digits, { places = 2, labels = true, seed = 3 } = {}) {
  paintClay(ctx, w, h, seed);
  const padded = padPlaces(digits, places);
  const top = h * 0.1, bottom = labels ? h * 0.78 : h * 0.9;
  const cellW = (w * 0.9) / places;
  const left = w * 0.05;

  for (let i = 1; i < places; i++) {
    const x = left + i * cellW;
    ctx.fillStyle = INK; ctx.fillRect(x - 2, top, 4, bottom - top);
    ctx.fillStyle = RIM; ctx.fillRect(x + 2, top, 2, bottom - top);
  }
  padded.forEach((d, i) => {
    if (d > 0) drawDigit(ctx, d, { x: left + i * cellW, y: top, w: cellW, h: bottom - top });
  });

  if (labels) {
    const names = places === 2 ? ['60’ere', 'enere'] : padded.map((_, i) => `${60 ** (places - 1 - i)}`);
    ctx.font = `600 ${Math.round(h * 0.09)}px Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    names.forEach((t, i) => {
      ctx.fillStyle = 'rgba(70,40,18,0.6)';
      ctx.fillText(t, left + (i + 0.5) * cellW, h * 0.88);
    });
  }
}

/** Lerbrik med et indtrykt arabertal (svarmulighed). */
export function drawNumberToken(ctx, w, h, text, seed = 7) {
  paintClay(ctx, w, h, seed, '#d1a674');
  let size = h * 0.55;
  ctx.font = `700 ${Math.round(size)}px Georgia, serif`;
  while (ctx.measureText(text).width > w * 0.84 && size > 8) {
    size *= 0.92;
    ctx.font = `700 ${Math.round(size)}px Georgia, serif`;
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = RIM; ctx.fillText(text, w / 2 + 2, h / 2 + 4);
  ctx.fillStyle = INK; ctx.fillText(text, w / 2, h / 2 + 2);
}

/** Tekst med automatisk linjeskift. Returnerer y efter sidste linje. */
export function wrapText(ctx, text, x, y, maxW, lineH) {
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y); y += lineH; line = word;
      } else line = test;
    }
    ctx.fillText(line, x, y); y += lineH;
  }
  return y;
}
