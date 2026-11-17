// Billige, bløde kontaktskygger ("blob"-skygger) i stedet for rigtige shadow maps.
// Et mørkt, gennemsigtigt plan med en blød canvas-gradient ligger lige over jorden
// under en genstand. Det koster næsten intet på Quest og ser naturligt ud i skumringen.
import * as THREE from 'three';

const TINT = '#140b06';   // varm, næsten sort – rent sort ser for hårdt ud mod lerjorden

function makeTex(size, alphaAt) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size * 2 - 1, v = (y + 0.5) / size * 2 - 1;
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, alphaAt(u, v))));
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

let texRound, texRect, texEdge;
// Rund: tættest i midten og en lang, blød udtoning
const roundTex = () => texRound ??= makeTex(64, (u, v) => {
  const r = Math.hypot(u, v);
  return Math.pow(1 - smooth(0, 1, r), 1.6);
});
// Afrundet rektangel med blød kant (til bord og bænke)
const rectTex = () => texRect ??= makeTex(64, (u, v) => {
  const inner = 0.45;
  const dx = Math.max(0, Math.abs(u) - inner), dy = Math.max(0, Math.abs(v) - inner);
  const d = Math.hypot(dx, dy) / (1 - inner);
  return 1 - smooth(0, 1, d);
});
// Stribe langs murens fod: mørkest ved muren (v = -1), udtonet væk fra den
const edgeTex = () => texEdge ??= makeTex(32, (u, v) => {
  const along = 1 - smooth(0.75, 1, Math.abs(u));   // bløde ender
  return Math.pow(1 - (v + 1) / 2, 2.2) * along;
});

const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const mats = new Map();
function mat(kind, opacity) {
  const key = `${kind}:${opacity}`;
  if (!mats.has(key)) {
    const map = kind === 'rect' ? rectTex() : kind === 'edge' ? edgeTex() : roundTex();
    mats.set(key, new THREE.MeshBasicMaterial({
      map, color: TINT, transparent: true, opacity, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
  }
  return mats.get(key);
}

function plane(kind, w, d, opacity, y) {
  const m = new THREE.Mesh(geo, mat(kind, opacity));
  m.scale.set(w, 1, d);
  m.position.y = y;
  m.renderOrder = 1;
  m.raycast = () => {};          // skal aldrig fange klik
  return m;
}

/** Rund/oval blød skygge. w og d er hele bredden og dybden. */
export const blobShadow = (w, d = w, opacity = 0.5, y = 0.012) => plane('round', w, d, opacity, y);
/** Blødt rektangel, fx under bord og bænke. */
export const rectShadow = (w, d, opacity = 0.5, y = 0.012) => plane('rect', w, d, opacity, y);
/**
 * Svag mørk kant langs en murs fod. Planet ligger med den mørke side mod -z (lokalt),
 * så det placeres lige foran muren og drejes, så -z peger ind mod muren.
 */
export const wallFootShadow = (len, width = 0.7, opacity = 0.45, y = 0.011) => plane('edge', len, width, opacity, y);
