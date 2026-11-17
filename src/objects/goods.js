// Købmandens ting: lerkegler (et bundt på ti), brød, flettede kurve, et bræt og en timeskive.
import * as THREE from 'three';
import { blobShadow } from '../scene/shadows.js';
import { paintClay } from './clayCanvas.js';

const hitMat = new THREE.MeshBasicMaterial({ visible: false });

// --- Lerkegle: én kegle er det samme som ti kugler --------------------------------
export const coneGeo = new THREE.ConeGeometry(0.032, 0.075, 16).translate(0, 0.0375, 0);
export const coneMat = new THREE.MeshStandardMaterial({ color: '#9a5a33', roughness: 0.85, flatShading: true });

// --- Brød (InstancedMesh, så 60 brød kun koster ét draw call) -------------------------
const loafGeo = (() => {
  const g = new THREE.SphereGeometry(1, 12, 7);
  g.scale(1, 0.55, 0.68);
  g.translate(0, 0.5, 0);       // står på y = 0 (synker en anelse ned)
  return g;
})();
const loafMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 });
export const LOAF_COLOR = new THREE.Color('#c98a4b');
export const LOAF_REST = new THREE.Color('#ff6a3d');

/**
 * `capacity` brød. Hvert brød er { p, rotY, s, color, visible }. Kald sync() efter ændringer.
 * `size` er brødets halve længde i meter.
 */
export function createBread(capacity, size) {
  const mesh = new THREE.InstancedMesh(loafGeo, loafMat, capacity);
  mesh.frustumCulled = false;
  const items = Array.from({ length: capacity }, (_, i) => ({
    p: new THREE.Vector3(), rotY: (i * 2.39) % Math.PI, s: size, color: LOAF_COLOR.clone(), visible: false,
  }));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const sync = () => {
    items.forEach((it, i) => {
      q.setFromAxisAngle(up, it.rotY);
      sc.setScalar(it.visible ? it.s : 0);
      m.compose(it.p, q, sc);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, it.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  };
  sync();
  return { mesh, items, sync };
}

/** Pladser i et gitter på et bræt (lokale koordinater, rækker langs x). */
export function gridSlots(n, cols, dx, dz) {
  const rows = Math.ceil(n / cols);
  return Array.from({ length: n }, (_, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    return new THREE.Vector3((c - (cols - 1) / 2) * dx, 0, (r - (rows - 1) / 2) * dz);
  });
}

// --- Flettet kurv ----------------------------------------------------------------
let wickerTex = null;
function wicker() {
  if (wickerTex) return wickerTex;
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a6434'; ctx.fillRect(0, 0, 128, 32);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#c49a5c' : '#a77b43';
      ctx.fillRect(x * 8 + 1, y * 8 + 1, 6, 6);
    }
  }
  wickerTex = new THREE.CanvasTexture(c);
  wickerTex.colorSpace = THREE.SRGBColorSpace;
  wickerTex.wrapS = wickerTex.wrapT = THREE.RepeatWrapping;
  wickerTex.repeat.set(3, 1);
  return wickerTex;
}
const basketGeo = new THREE.LatheGeometry(
  [[0, 0.004], [0.075, 0], [0.095, 0.015], [0.108, 0.05], [0.115, 0.055], [0.107, 0.055], [0.099, 0.05], [0.086, 0.018], [0, 0.014]]
    .map(([x, y]) => new THREE.Vector2(x, y)), 22);

/** Kurv til én arbejder. `slots` er pladser til brød i kurven (lokalt). */
export function createBasket() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: wicker(), roughness: 1, side: THREE.DoubleSide, emissive: new THREE.Color(0) });
  g.add(new THREE.Mesh(basketGeo, mat), blobShadow(0.3, 0.3, 0.55, 0.002));
  return { group: g, mat };
}

/** Pladser til `n` brød i en kurv: ringe og lag, så de ligger i en lille bunke. */
export function basketSlots(n, loafSize) {
  const out = [];
  const rings = loafSize > 0.03 ? [[0, 1], [0.045, 5]] : [[0, 1], [0.034, 6], [0.066, 11]];
  for (let layer = 0; out.length < n; layer++) {
    for (const [r, k] of rings) {
      for (let i = 0; i < k && out.length < n; i++) {
        const a = (i / k) * Math.PI * 2 + layer * 0.6;
        const rr = Math.max(0, r - layer * 0.008);
        out.push(new THREE.Vector3(Math.cos(a) * rr, 0.016 + layer * loafSize * 0.85, Math.sin(a) * rr));
      }
    }
  }
  return out;
}

// --- Bræt til brødet ---------------------------------------------------------------
export function createTray(w, d, mat) {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), mat);
  board.position.y = 0.01;
  g.add(board, blobShadow(w * 1.25, d * 1.4, 0.5, 0.002));
  return g;
}

/** Usynligt mål, så en bunke kan peges på. */
export function hitBox(w, h, d) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
  m.position.y = h / 2;
  return m;
}

// --- Timeskiven: en lerskive med 60 mærker -------------------------------------------
/**
 * show(minutes, label): fremhæv de første `minutes` af de 60 (fra toppen, med uret) og skriv
 * `label` under skiven. Står lodret på en lille fod, forsiden mod +z.
 */
export function createHourDisk(radius = 0.24, woodMat) {
  const g = new THREE.Group();
  const clayMat = new THREE.MeshStandardMaterial({ color: '#b88a5a', roughness: 0.95 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.035, 48), clayMat);
  rim.rotation.x = Math.PI / 2;
  const c = document.createElement('canvas'); c.width = c.height = 768;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const face = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.97, 48),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.12, emissiveMap: tex }));
  face.position.z = 0.0181;
  const disc = new THREE.Group();
  disc.add(rim, face);
  disc.position.y = radius + 0.04;
  g.add(disc);
  // Fod: en lille træklods med en rille
  const foot = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.1, 0.05, 0.12), woodMat);
  foot.position.y = 0.025;
  g.add(foot, blobShadow(radius * 1.6, 0.25, 0.5, 0.002));

  const W = c.width, R = W * 0.47, cx = W / 2, cy = W / 2;
  const show = (minutes = 0, label = '') => {
    paintClay(ctx, W, W, 5, '#d2a978');
    // Fremhævet stykke
    if (minutes > 0) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R * 0.86, -Math.PI / 2, -Math.PI / 2 + (minutes / 60) * Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(214, 92, 40, 0.75)';
      ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(90, 30, 10, 0.9)'; ctx.stroke();
    }
    // 60 mærker, hvert 5. længere
    for (let i = 0; i < 60; i++) {
      const a = -Math.PI / 2 + (i / 60) * Math.PI * 2;
      const long = i % 5 === 0;
      const r0 = R * (long ? 0.86 : 0.91), r1 = R * 0.98;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineWidth = long ? 9 : 5;
      ctx.strokeStyle = 'rgba(70,40,18,0.9)';
      ctx.stroke();
    }
    // Midterprik
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fillStyle = 'rgba(70,40,18,0.9)'; ctx.fill();
    if (label) {
      ctx.font = '700 64px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // Lys plade bag teksten, så den kan læses oven på det fremhævede stykke
      const tw = ctx.measureText(label).width + 50;
      ctx.fillStyle = 'rgba(236, 214, 176, 0.92)';
      ctx.fillRect(cx - tw / 2, cy + R * 0.42 - 46, tw, 92);
      ctx.fillStyle = '#4a2a12';
      ctx.fillText(label, cx, cy + R * 0.42);
    }
    tex.needsUpdate = true;
  };
  show(0);
  return { group: g, show };
}
