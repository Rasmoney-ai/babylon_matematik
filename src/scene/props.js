// Fælles byggeklodser til miljøerne: teksturer, mure, palmer, krukker, flammer og lamper.
// Bruges af både gården (eduba.js) og fårefolden (fold.js).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// --- Teksturer ----------------------------------------------------------------
export function canvasTexture(w, h, paint, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

export function brickPainter(base, mortar, vary = 18) {
  return (ctx, w, h) => {
    ctx.fillStyle = mortar; ctx.fillRect(0, 0, w, h);
    const rows = 8, bh = h / rows, bw = w / 4;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * bw / 2;
      for (let c = -1; c < 5; c++) {
        const v = (Math.random() - 0.5) * vary;
        const col = new THREE.Color(base); col.offsetHSL(0, 0, v / 255);
        ctx.fillStyle = `#${col.getHexString()}`;
        ctx.fillRect(c * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
  };
}

export const sandPainter = (ctx, w, h) => {
  ctx.fillStyle = '#d6b483'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(120,85,45,0.10)' : 'rgba(255,245,220,0.12)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
};

// --- Byggeklodser --------------------------------------------------------------
export const box = (w, h, d, mat) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};

export function wallSegment(len, height, thick, mat, capMat) {
  const g = new THREE.Group();
  const wall = box(len, height, thick, mat);
  wall.position.y = height / 2;
  g.add(wall);
  // Trappeformede tinder, typisk for mesopotamiske mure
  const n = Math.floor(len / 0.9);
  for (let i = 0; i < n; i++) {
    const t = box(0.45, 0.35, thick * 0.9, capMat);
    t.position.set(-len / 2 + 0.45 + i * (len - 0.9) / Math.max(1, n - 1), height + 0.17, 0);
    g.add(t);
  }
  return g;
}

// Palme: stammen og bladene slås sammen til én mesh hver (2 draw calls i stedet for 16).
const palmTrunkMat = new THREE.MeshStandardMaterial({ color: '#7a5a3a', roughness: 1 });
const palmLeafMat = new THREE.MeshStandardMaterial({ color: '#5b8a34', roughness: 0.8, side: THREE.DoubleSide });
export function palm(h = 6, lean = 0.3) {
  const g = new THREE.Group();
  const trunk = [], leaves = [];
  const segs = 7;
  const tmp = new THREE.Object3D();
  for (let i = 0; i < segs; i++) {
    const geo = new THREE.CylinderGeometry(0.16 - i * 0.008, 0.2 - i * 0.008, h / segs, 7);
    const t = i / segs;
    tmp.position.set(Math.sin(t * 1.6) * lean * 2, (i + 0.5) * (h / segs), 0);
    tmp.rotation.set(0, 0, -Math.cos(t * 1.6) * lean * 0.5);
    tmp.updateMatrix();
    trunk.push(geo.applyMatrix4(tmp.matrix));
  }
  const top = new THREE.Vector3(Math.sin(1.6) * lean * 2, h, 0);
  const pivot = new THREE.Object3D();
  for (let i = 0; i < 9; i++) {
    const geo = new THREE.ConeGeometry(0.35, 3.2, 4, 1, true);
    geo.translate(0, 1.6, 0);
    tmp.position.set(0, 0, 0);
    tmp.rotation.set(0, 0, Math.PI / 2 - 0.35 - Math.random() * 0.3);
    tmp.scale.set(1, 1, 0.12);
    tmp.updateMatrix();
    pivot.position.copy(top);
    pivot.rotation.set(0, (i / 9) * Math.PI * 2, 0);
    pivot.updateMatrix();
    leaves.push(geo.applyMatrix4(tmp.matrix).applyMatrix4(pivot.matrix));
  }
  tmp.scale.set(1, 1, 1);
  g.add(new THREE.Mesh(mergeGeometries(trunk), palmTrunkMat), new THREE.Mesh(mergeGeometries(leaves), palmLeafMat));
  return g;
}

export function jar(color = '#a8683d') {
  const pts = [[0, 0], [0.12, 0.01], [0.2, 0.12], [0.22, 0.3], [0.16, 0.45], [0.08, 0.5], [0.09, 0.56], [0.1, 0.58]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}


// --- Ild og lys i skumringen ---------------------------------------------------
// Blødt, rundt lysskær bag flammerne (tegnet på canvas, ingen ekstern tekstur)
let haloTex = null;
export function haloTexture() {
  if (haloTex) return haloTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,200,130,1)');
  g.addColorStop(0.25, 'rgba(255,150,70,0.45)');
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  haloTex = new THREE.CanvasTexture(c);
  haloTex.colorSpace = THREE.SRGBColorSpace;
  return haloTex;
}

// Dråbeformet flamme: en varm ydre kappe og en lys kerne. Skaleres med `size`.
const flameOuterMat = new THREE.MeshBasicMaterial({ color: '#ff8a2e', transparent: true, opacity: 0.9, depthWrite: false, fog: false });
const flameInnerMat = new THREE.MeshBasicMaterial({ color: '#ffe2a0', fog: false });
const flameGeo = new THREE.LatheGeometry(
  [[0, 0], [0.45, 0.12], [0.55, 0.35], [0.42, 0.65], [0.2, 0.9], [0, 1.15]].map(([x, y]) => new THREE.Vector2(x, y)), 10);
export function flame(size = 0.05, halo = 3) {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(flameGeo, flameOuterMat);
  outer.scale.set(size, size * 1.6, size);
  const inner = new THREE.Mesh(flameGeo, flameInnerMat);
  inner.scale.set(size * 0.5, size * 0.9, size * 0.5);
  inner.position.y = size * 0.08;
  g.add(outer, inner);
  if (halo) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTexture(), color: '#ffffff', transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    }));
    s.scale.setScalar(size * halo * 2);
    s.position.y = size * 0.7;
    g.add(s);
  }
  g.userData.outer = outer;
  g.userData.base = size;
  return g;
}

// Olielampe: lille åben lerskål med en tud, hvor vægen brænder

// Olielampe: lav, lukket lerskål med indadbøjet kant, en tud med vægen og en lille hank.
// Profilen er massiv (ingen tynd ring), så den ligner en lampe set fra alle vinkler.
// Står fladt på y = 0. Tuden peger mod +x.
const lampBodyGeo = new THREE.LatheGeometry(
  [[0, 0], [0.034, 0], [0.04, 0.006], [0.06, 0.016], [0.068, 0.03], [0.062, 0.042],
   [0.05, 0.049], [0.032, 0.052], [0.022, 0.049], [0.018, 0.043], [0, 0.041]].map(([x, y]) => new THREE.Vector2(x, y)), 22);
const lampSpoutGeo = (() => {
  // Tuden er en kort, fladtrykt kegle der smalner ind mod spidsen
  const g = new THREE.CylinderGeometry(0.011, 0.024, 0.08, 10, 1);
  g.rotateZ(-Math.PI / 2);          // aksen langs +x, smal ende yderst
  g.scale(1, 0.7, 1);
  return g;
})();
const lampHandleGeo = new THREE.TorusGeometry(0.017, 0.0065, 6, 12, Math.PI * 1.3);
const lampOilGeo = new THREE.CircleGeometry(0.019, 14);   // lille påfyldningshul i toppen
const lampOilMat = new THREE.MeshStandardMaterial({ color: '#2a1a0c', roughness: 0.25 });
const lampMats = new Map();
export function oilLamp(clay = '#a8683d') {
  if (!lampMats.has(clay)) lampMats.set(clay, new THREE.MeshStandardMaterial({ color: clay, roughness: 0.9 }));
  const mat = lampMats.get(clay);
  const g = new THREE.Group();
  const body = new THREE.Mesh(lampBodyGeo, mat);
  const spout = new THREE.Mesh(lampSpoutGeo, mat);
  spout.position.set(0.088, 0.03, 0);
  spout.rotation.z = 0.18;          // tuden løfter sig let
  const handle = new THREE.Mesh(lampHandleGeo, mat);
  handle.position.set(-0.07, 0.03, 0);
  handle.rotation.z = Math.PI * 0.35;
  const oil = new THREE.Mesh(lampOilGeo, lampOilMat);
  oil.rotation.x = -Math.PI / 2; oil.position.y = 0.0435;
  // Vægen: en lille mørk tot i spidsen af tuden
  const wick = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), lampOilMat);
  wick.position.set(0.128, 0.042, 0);
  const f = flame(0.02, 4);
  f.position.set(0.128, 0.044, 0);
  g.add(body, spout, handle, oil, wick, f);
  g.userData.flame = f;
  return g;
}

// Fakkel i en jernholder på muren
export function torch() {
  const g = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 0.6, metalness: 0.5 });
  const wood = new THREE.MeshStandardMaterial({ color: '#4a3020', roughness: 1 });
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.28), iron);
  bracket.position.set(0, 0, 0.14);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.6, 7), wood);
  stick.position.set(0, 0.15, 0.28); stick.rotation.x = 0.18;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.14, 8), iron);
  head.position.set(0, 0.47, 0.34);
  const f = flame(0.08, 3.5);
  f.position.set(0, 0.52, 0.34);
  g.add(bracket, stick, head, f);
  g.userData.flame = f;
  return g;
}

// Stjerner: et par hundrede punkter højt på himlen, svagest mod solnedgangen

// Rolig flakken: et par langsomme sinusser oven i hinanden, forskudt per flamme
export function flicker(t, seed) {
  return 1 + 0.07 * Math.sin(t * 6.1 + seed) + 0.045 * Math.sin(t * 11.3 + seed * 2.7) + 0.025 * Math.sin(t * 23.7 + seed * 5.1);
}
