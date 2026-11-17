// Landmålerens ting: marken med felter og spirer, rebet med knuder, pæle,
// små lertavler til oversigten og to små indhegninger med en hund.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { blobShadow } from '../scene/shadows.js';
import { paintClay } from './clayCanvas.js';

export const STEP = 0.6;          // ét skridt i meter (afstanden mellem to knuder)

const hitMat = new THREE.MeshBasicMaterial({ visible: false });

// Farver på felterne
export const CELL = {
  empty: new THREE.Color('#5b412b'),
  target: new THREE.Color('#7d5a39'),
  hover: new THREE.Color('#a87a48'),
  sown: new THREE.Color('#6d6a34'),
};

// Spire: en lille tot af grønne strå (slået sammen til én geometri)
const sproutGeo = (() => {
  const blades = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.ConeGeometry(0.018, 0.2, 3).translate(0, 0.1, 0);
    const a = (i / 7) * Math.PI * 2;
    const r = i === 0 ? 0 : 0.06;
    b.rotateX(i === 0 ? 0 : 0.35 * Math.cos(a)).rotateZ(i === 0 ? 0 : -0.35 * Math.sin(a));
    b.translate(Math.cos(a) * r, 0, Math.sin(a) * r);
    blades.push(b);
  }
  return mergeGeometries(blades);
})();
const sproutMat = new THREE.MeshStandardMaterial({ color: '#8fc24a', roughness: 0.7, emissive: new THREE.Color('#2a4010'), emissiveIntensity: 0.6 });

/**
 * Marken: op til maxRows × maxCols felter. Gruppen har sin origo midt på markens forreste kant;
 * række 0 er den forreste, og rækkerne går bagud (-z).
 * cells[r * maxCols + c] = { r, c, on, color, sprout (0..1), hit }
 */
export function createPlot(maxRows = 5, maxCols = 7, step = STEP) {
  const group = new THREE.Group();
  const n = maxRows * maxCols;
  const tileGeo = new THREE.PlaneGeometry(step * 0.86, step * 0.86).rotateX(-Math.PI / 2);
  const tiles = new THREE.InstancedMesh(tileGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }), n);
  tiles.frustumCulled = false;
  tiles.position.y = 0.014;
  const sprouts = new THREE.InstancedMesh(sproutGeo, sproutMat, n);
  sprouts.frustumCulled = false;
  sprouts.position.y = 0.014;
  group.add(tiles, sprouts);

  const hitGeo = new THREE.BoxGeometry(step * 0.96, 0.08, step * 0.96);
  const cells = [];
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      const hit = new THREE.Mesh(hitGeo, hitMat);
      hit.visible = false;
      group.add(hit);
      cells.push({ r, c, on: false, color: CELL.empty.clone(), sprout: 0, hit, p: new THREE.Vector3() });
    }
  }
  const api = {
    group, cells, step, rows: 0, cols: 0,
    cell(r, c) { return cells[r * maxCols + c]; },
    /** Vis en mark med `rows` rækker og `cols` felter i hver. Alle felter bliver tomme. */
    layout(rows, cols) {
      api.rows = rows; api.cols = cols;
      for (const cl of cells) {
        cl.on = cl.r < rows && cl.c < cols;
        cl.sprout = 0;
        cl.color.copy(CELL.empty);
        cl.p.set((cl.c - (cols - 1) / 2) * step, 0, -(cl.r + 0.5) * step);
        cl.hit.position.copy(cl.p).setY(0.04);
        cl.hit.visible = false;
      }
      api.sync();
    },
    clear() { for (const cl of cells) { cl.on = false; cl.hit.visible = false; } api.sync(); },
    sync() {
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      cells.forEach((cl, i) => {
        s.setScalar(cl.on ? 1 : 0);
        m.compose(cl.p, q, s);
        tiles.setMatrixAt(i, m);
        tiles.setColorAt(i, cl.color);
        const k = cl.on ? cl.sprout : 0;
        s.set(k, k, k);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 1.9);
        m.compose(cl.p, q, s);
        sprouts.setMatrixAt(i, m);
        q.identity();
      });
      tiles.instanceMatrix.needsUpdate = true;
      tiles.instanceColor.needsUpdate = true;
      sprouts.instanceMatrix.needsUpdate = true;
    },
    sownCount() { return cells.filter((cl) => cl.on && cl.sprout > 0).length; },
  };
  api.clear();
  return api;
}

// --- Pæle og reb ----------------------------------------------------------------------
const stakeGeo = (() => {
  const body = new THREE.BoxGeometry(0.06, 0.3, 0.06).translate(0, 0.15, 0);
  const tip = new THREE.ConeGeometry(0.042, 0.1, 4).rotateX(Math.PI).rotateY(Math.PI / 4).translate(0, -0.05, 0);
  return mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()]);
})();
const stakeMat = new THREE.MeshStandardMaterial({ color: '#8a6238', roughness: 0.85 });

export function createStake() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(stakeGeo, stakeMat), blobShadow(0.18, 0.18, 0.55, 0.004));
  return g;
}

const ropeMat = new THREE.MeshStandardMaterial({ color: '#e0c48c', roughness: 0.9, emissive: new THREE.Color('#3a2a10'), emissiveIntensity: 0.5 });
const knotMat = new THREE.MeshStandardMaterial({ color: '#f4dca6', roughness: 0.8, emissive: new THREE.Color('#5a3c14'), emissiveIntensity: 0.6 });
const ROPE_Y = 0.24;               // rebet sidder øverst på pælene

/**
 * Reb med knuder rundt om fire hjørner. set(corners, drawn, knots):
 *  corners: fire Vector3 (på jorden) i rækkefølge rundt; drawn: 0..1 hvor meget af rebet der er spændt;
 *  knots: antal knuder fordelt jævnt rundt (= rebets længde i skridt).
 */
export function createRope(maxKnots = 24) {
  const group = new THREE.Group();
  const sideGeo = new THREE.CylinderGeometry(0.014, 0.014, 1, 6).rotateZ(Math.PI / 2).translate(0.5, 0, 0);
  const sides = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(sideGeo, ropeMat); group.add(m); return m; });
  const knots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.034, 8, 6), knotMat, maxKnots);
  knots.frustumCulled = false;
  group.add(knots);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  const api = {
    group,
    set(corners, drawn = 1, n = 16) {
      const lens = corners.map((c, i) => c.distanceTo(corners[(i + 1) % 4]));
      const total = lens.reduce((x, y) => x + y, 0);
      let left = total * drawn;
      sides.forEach((side, i) => {
        a.copy(corners[i]).setY(ROPE_Y); b.copy(corners[(i + 1) % 4]).setY(ROPE_Y);
        const len = Math.max(0, Math.min(lens[i], left));
        left -= lens[i];
        side.visible = len > 0.001;
        side.position.copy(a);
        side.rotation.set(0, -Math.atan2(b.z - a.z, b.x - a.x), 0);
        side.scale.set(len, 1, 1);
      });
      // Knuder: én pr. skridt, jævnt fordelt efter længden rundt
      for (let k = 0; k < maxKnots; k++) {
        let d = (k * total) / Math.max(1, n);
        let show = k < n && d <= total * drawn + 1e-4;
        let i = 0;
        while (i < 3 && d > lens[i]) { d -= lens[i]; i++; }
        a.copy(corners[i]); b.copy(corners[(i + 1) % 4]);
        p.lerpVectors(a, b, lens[i] ? Math.min(1, d / lens[i]) : 0).setY(ROPE_Y);
        s.setScalar(show ? 1 : 0);
        m.compose(p, q, s);
        knots.setMatrixAt(k, m);
      }
      knots.instanceMatrix.needsUpdate = true;
    },
    hide() { group.visible = false; },
  };
  return api;
}

/** Hjørnerne i en mark med `rows` × `cols` felter (på jorden, plot-gruppens koordinater). */
export function plotCorners(rows, cols, step = STEP) {
  const hx = (cols * step) / 2, d = rows * step;
  return [new THREE.Vector3(-hx, 0, 0), new THREE.Vector3(hx, 0, 0), new THREE.Vector3(hx, 0, -d), new THREE.Vector3(-hx, 0, -d)];
}

// --- Små lertavler til oversigten (form og antal felter) -------------------------------
const INK = 'rgba(70, 40, 18, 0.92)';
/** Tegner en mark (rows × cols små felter) og et tal under på en lille lertavle. */
export function drawShapeTablet(ctx, w, h, { rows, cols, label, count, seed = 3, best = false }) {
  paintClay(ctx, w, h, seed, best ? '#e8c68a' : '#d1a674');
  if (best) {
    // Den bedste mark får en blå glaseret kant (som seglet på banebrikkerne)
    ctx.strokeStyle = '#2a5aa6'; ctx.lineWidth = w * 0.05;
    ctx.strokeRect(w * 0.03, h * 0.03, w * 0.94, h * 0.94);
  }
  const top = h * 0.2, areaH = h * 0.4, areaW = w * 0.8;
  const cell = Math.min(areaW / 7, areaH / 4);
  const gx = (w - cols * cell) / 2, gy = top + (areaH - rows * cell) / 2;
  ctx.fillStyle = 'rgba(110, 120, 40, 0.55)';
  ctx.fillRect(gx, gy, cols * cell, rows * cell);
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, cell * 0.08);
  for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(gx, gy + r * cell); ctx.lineTo(gx + cols * cell, gy + r * cell); ctx.stroke(); }
  for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(gx + c * cell, gy); ctx.lineTo(gx + c * cell, gy + rows * cell); ctx.stroke(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK;
  ctx.font = `700 ${Math.round(h * 0.15)}px Georgia, serif`;
  ctx.fillText(label, w / 2, h * 0.12);
  ctx.font = `700 ${Math.round(h * 0.3)}px Georgia, serif`;
  ctx.fillText(String(count), w / 2, h * 0.8);
}

/**
 * Bondens tavle: marken tegnet som et omrids (ingen felter), med antal skridt i store tal
 * på den korte og den lange side og ordet "skridt" småt under.
 */
export function drawFarmerTablet(ctx, w, h, { rows, cols, unit = 'skridt', seed = 5 }) {
  paintClay(ctx, w, h, seed);
  const bw = w * 0.5, bh = bw * rows / cols;
  const x = w * 0.32, y = h * 0.1;
  ctx.fillStyle = 'rgba(70,40,18,0.12)'; ctx.fillRect(x, y, bw, bh);
  ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.strokeRect(x, y, bw, bh);
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(h * 0.3)}px Georgia, serif`;
  ctx.fillText(String(cols), x + bw / 2, y + bh + h * 0.2);
  ctx.fillText(String(rows), x - w * 0.12, y + bh / 2);
  ctx.font = `italic ${Math.round(h * 0.11)}px Georgia, serif`;
  ctx.fillText(unit, x + bw / 2, h * 0.92);
}

// --- Spor i din verden: to små indhegninger med samme hegn ------------------------------
const tinyPostGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.05, 5).translate(0, 0.025, 0);
const tinyRopeMat = new THREE.MeshStandardMaterial({ color: '#e0c48c', roughness: 0.9 });
const grassMat = new THREE.MeshStandardMaterial({ color: '#6f8a3a', roughness: 1 });

/** Lille indhegning på bordet: `rows` × `cols` enheder på `unit` meter, med græs indeni. */
export function createMiniPen(rows, cols, unit = 0.05) {
  const g = new THREE.Group();
  const w = cols * unit, d = rows * unit;
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), grassMat);
  grass.position.y = 0.003;
  g.add(grass);
  const corners = [[-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]];
  // Små pæle ved hver enhed langs kanten, og reb ovenpå
  const pts = [];
  corners.forEach(([x0, z0], i) => {
    const [x1, z1] = corners[(i + 1) % 4];
    const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / unit);
    for (let k = 0; k < n; k++) pts.push([x0 + (x1 - x0) * k / n, z0 + (z1 - z0) * k / n]);
  });
  pts.forEach(([x, z]) => { const p = new THREE.Mesh(tinyPostGeo, wood()); p.position.set(x, 0, z); g.add(p); });
  corners.forEach(([x0, z0], i) => {
    const [x1, z1] = corners[(i + 1) % 4];
    const len = Math.hypot(x1 - x0, z1 - z0);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, len, 4).rotateZ(Math.PI / 2), tinyRopeMat);
    r.position.set((x0 + x1) / 2, 0.045, (z0 + z1) / 2);
    r.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    g.add(r);
  });
  return g;
}
let woodMat = null;
const wood = () => (woodMat ??= new THREE.MeshStandardMaterial({ color: '#6b4a2c', roughness: 0.9 }));

/** En lille hund af simple former (vender mod +x). */
export function createDog(color = '#b07a45') {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: '#3a2414', roughness: 0.9 });
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.03, 4, 8).rotateZ(Math.PI / 2), mat);
  body.position.y = 0.026;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), mat);
  head.position.set(0.026, 0.04, 0);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.007, 0.008), dark);
  snout.position.set(0.038, 0.037, 0);
  const ear = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.01, 0.004), dark);
  ear.position.set(0.022, 0.05, 0.007);
  const ear2 = ear.clone(); ear2.position.z = -0.007;
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.002, 0.022, 4), mat);
  tail.position.set(-0.03, 0.038, 0); tail.rotation.z = 0.8;
  g.add(body, head, snout, ear, ear2, tail);
  [[0.014, 0.008], [0.014, -0.008], [-0.014, 0.008], [-0.014, -0.008]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.018, 4), mat);
    leg.position.set(x, 0.009, z);
    g.add(leg);
  });
  g.userData.tail = tail;
  return g;
}

/** Et lille gulv af fliser (kvadratmeter): `rows` × `cols` fliser på `unit` meter. */
export function createTileFloor(rows, cols, unit = 0.05) {
  const g = new THREE.Group();
  const mats = [new THREE.MeshStandardMaterial({ color: '#c8865a', roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: '#a86c45', roughness: 0.8 })];
  const geo = new THREE.BoxGeometry(unit * 0.92, 0.006, unit * 0.92);
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = new THREE.Mesh(geo, mats[(r + c) % 2]);
      t.position.set((c - (cols - 1) / 2) * unit, 0.003, (r - (rows - 1) / 2) * unit);
      g.add(t);
      tiles.push(t);
    }
  }
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(cols * unit + 0.012, rows * unit + 0.012).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#4a3424', roughness: 1 }));
  frame.position.y = 0.001;
  g.add(frame);
  g.userData.tiles = tiles;
  return g;
}

/** Usynligt mål, så noget kan peges på. */
export function hitBox(w, h, d) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
  m.position.y = h / 2;
  return m;
}
