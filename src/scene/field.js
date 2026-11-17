// Marken ved floden: vest for gården, uden for vestmuren. Eleven står på et lavt dige
// og ser ned på en oversvømmet mark med floden bagved. Lidt siv og palmer langs bredden.
// Alt bygges i stationens lokale koordinater: eleven står i (0, 0, 0) på digets top og ser mod -z.
// Jorden nedenfor diget ligger i y = GROUND (stationens position er hævet tilsvarende).
import * as THREE from 'three';
import { box, palm, flame, oilLamp, canvasTexture } from './props.js';
import { blobShadow, rectShadow } from './shadows.js';

const P = (x, y, z) => new THREE.Vector3(x, y, z);

export const BANK = 0.55;          // digets højde over jorden
const GROUND = -BANK;

// Fugtig, mørk jord efter oversvømmelsen, med små vandpytter der spejler himlen
function mudPainter(ctx, w, h) {
  ctx.fillStyle = '#3a2a1d'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(20,12,6,0.18)' : 'rgba(120,90,60,0.10)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 3, 2);
  }
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * w, y = Math.random() * h, rx = 10 + Math.random() * 26;
    ctx.fillStyle = 'rgba(100,120,155,0.16)';
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// Diget: tør, lys jord med lidt græs
function bankPainter(ctx, w, h) {
  ctx.fillStyle = '#9b7a52'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(60,40,20,0.14)' : 'rgba(230,205,160,0.12)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  for (let i = 0; i < 260; i++) {
    ctx.strokeStyle = 'rgba(90,110,50,0.35)';
    const x = Math.random() * w, y = Math.random() * h;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 6); ctx.stroke();
  }
}

// Vandet: spejler himlen svagt – mørk blå med en varm stribe mod nord (højre), hvor solen gik ned
function waterPainter(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#18213a'); g.addColorStop(0.6, '#233452'); g.addColorStop(1, '#4e4a5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    const y = Math.random() * h, x = Math.random() * w, len = 10 + Math.random() * 40;
    ctx.fillStyle = Math.random() > 0.3 ? 'rgba(150,175,210,0.10)' : 'rgba(255,170,110,0.12)';
    ctx.fillRect(x, y, len, 1.5);
  }
}

/** Et lille knippe siv: tynde, lidt skæve kegler. */
function reeds(n = 9, seed = 1) {
  const g = new THREE.Group();
  let s = seed * 7919;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const h = 0.6 + rnd() * 0.7;
    const m = new THREE.Mesh(reedGeo, reedMat);
    m.scale.set(1, h, 1);
    m.position.set((rnd() - 0.5) * 0.4, 0, (rnd() - 0.5) * 0.4);
    m.rotation.set((rnd() - 0.5) * 0.3, 0, (rnd() - 0.5) * 0.3);
    g.add(m);
  }
  return g;
}
const reedGeo = new THREE.ConeGeometry(0.015, 1, 4).translate(0, 0.5, 0);
const reedMat = new THREE.MeshStandardMaterial({ color: '#56693a', roughness: 1 });

export function buildField(scene, world) {
  const { wood } = world.materials;
  const position = P(-10, BANK, -1);
  const yaw = Math.PI / 2;                 // ser mod vest, væk fra gården
  const g = new THREE.Group();
  g.position.copy(position);
  g.rotation.y = yaw;
  scene.add(g);
  g.updateMatrixWorld(true);
  const toWorld = (v) => g.localToWorld(v.clone());

  // --- Diget, eleven står på --------------------------------------------------------
  const bankMat = new THREE.MeshStandardMaterial({ map: canvasTexture(256, 256, bankPainter, [6, 2]), roughness: 1 });
  const BANK_FRONT = -1.0, BANK_BACK = 2.2, BANK_X = 7;
  const top = box(BANK_X * 2, BANK, BANK_BACK - BANK_FRONT, bankMat);
  top.position.set(0, GROUND + BANK / 2, (BANK_FRONT + BANK_BACK) / 2);
  g.add(top);
  // Skråninger foran og bagved (et prisme af en drejet kasse)
  const slope = (z, dir) => {
    const len = Math.hypot(BANK, 0.7);
    const s = box(BANK_X * 2, 0.06, len, bankMat);
    s.rotation.x = dir * Math.atan2(BANK, 0.7);
    s.position.set(0, GROUND + BANK / 2 - 0.02, z + dir * -0.35);
    g.add(s);
    const fill = box(BANK_X * 2, BANK * 0.5, 0.36, bankMat);
    fill.position.set(0, GROUND + BANK * 0.25, z + dir * -0.2);
    g.add(fill);
  };
  slope(BANK_FRONT, 1);
  slope(BANK_BACK, -1);

  // --- Den oversvømmede jord, marken skal ligge på -----------------------------------
  const mud = new THREE.Mesh(
    new THREE.PlaneGeometry(BANK_X * 2, 6.2),
    new THREE.MeshStandardMaterial({ map: canvasTexture(512, 256, mudPainter, [3, 1.5]), roughness: 0.55, metalness: 0.05 }),
  );
  mud.rotation.x = -Math.PI / 2;
  mud.position.set(0, GROUND + 0.006, -1.0 - 3.1 - 0.3);
  g.add(mud);

  // Floden bagved
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 9),
    new THREE.MeshBasicMaterial({ map: canvasTexture(512, 128, waterPainter, [1, 1]) }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, GROUND + 0.012, -12.2);
  g.add(water);
  // Mudret bred mellem marken og floden
  const shore = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 1.4),
    new THREE.MeshStandardMaterial({ color: '#4a3826', roughness: 1 }),
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.set(0, GROUND + 0.009, -7.3);
  g.add(shore);

  // Siv langs bredden og et par palmer
  [[-5.5, -7.4], [-3.6, -7.7], [-1.2, -7.5], [1.4, -7.8], [3.3, -7.4], [5.8, -7.6], [-6.8, -6.6], [7.2, -6.8],
   [-2.4, -16.9], [2.6, -17.2], [8, -17], [-8.5, -17.2]].forEach(([x, z], i) => {
    const r = reeds(7 + (i % 4), i + 3);
    r.position.set(x, GROUND, z);
    g.add(r);
  });
  [[-5.2, -6.8, 5.5], [4.9, -6.5, 6.2], [-9.5, -3.2, 5], [9.2, -4, 5.8], [1.5, -18, 6], [-6, -18.5, 5.2]].forEach(([x, z, h], i) => {
    const p = palm(h, 0.2 + (i % 3) * 0.1);
    p.position.set(x, GROUND, z);
    p.rotation.y = i * 2.1;
    p.add(blobShadow(1.1, 1.1, 0.5));
    g.add(p);
  });
  // Gamle markpæle, som floden har væltet
  [[-3.7, -3.6, 1.2], [3.6, -4.8, -0.9], [-2.9, -5.6, 0.4]].forEach(([x, z, r]) => {
    const s = box(0.05, 0.05, 0.42, wood);
    s.position.set(x, GROUND + 0.03, z); s.rotation.y = r;
    g.add(s);
  });

  // --- Den lave sten foran eleven: her ligger brikkerne og lampen ---------------------
  const TABLE_Y = 0.64, TABLE_Z = -0.55;
  const stone = new THREE.MeshStandardMaterial({ color: '#6f675d', roughness: 0.95, flatShading: true });
  const slab = box(1.6, 0.1, 0.44, stone);
  slab.position.set(0, TABLE_Y - 0.05, TABLE_Z);
  g.add(slab);
  [-0.55, 0.55].forEach((x) => {
    const leg = box(0.32, TABLE_Y - 0.1, 0.3, stone);
    leg.position.set(x, (TABLE_Y - 0.1) / 2, TABLE_Z);
    g.add(leg);
  });
  { const s = rectShadow(1.9, 0.8, 0.5); s.position.set(0, 0.012, TABLE_Z); g.add(s); }

  const lamp = oilLamp('#9c5f36');
  lamp.position.set(0.7, TABLE_Y, TABLE_Z - 0.12);
  lamp.rotation.y = 2.4;
  lamp.scale.setScalar(1.15);
  lamp.add(blobShadow(0.24, 0.17, 0.5, 0.002));
  g.add(lamp);
  world.addFire(lamp.userData.flame, null, 19);

  // --- Tekstpladen: hænger i reb fra en bjælke på en høj ramme ved foden af diget ------
  // Rammens stolper står uden for marken, så de ikke skærer felterne over. Pladen hænger
  // i øjenhøjde: marken ses under den, floden over og bag den.
  const PANEL = P(0, 1.42, -2.2);
  const FRAME_X = 2.55, FRAME_TOP = PANEL.y + 0.62, FRAME_Z = PANEL.z - 0.06;
  [-FRAME_X, FRAME_X].forEach((x) => {
    const h = FRAME_TOP - GROUND;
    const post = box(0.09, h, 0.09, wood);
    post.position.set(x, GROUND + h / 2, FRAME_Z);
    g.add(post);
    const s = blobShadow(0.3, 0.3, 0.55); s.position.set(x, GROUND + 0.012, FRAME_Z); g.add(s);
  });
  const beam = box(FRAME_X * 2 + 0.2, 0.08, 0.08, wood);
  beam.position.set(0, FRAME_TOP, FRAME_Z);
  g.add(beam);
  const cordMat = new THREE.MeshBasicMaterial({ color: '#2a1a0e' });
  [-0.5, 0.5].forEach((x) => {
    const len = FRAME_TOP - (PANEL.y + 0.3);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 4), cordMat);
    cord.position.set(x, PANEL.y + 0.3 + len / 2, FRAME_Z + 0.02);
    g.add(cord);
  });

  // Fakler i skåle oven på rammens stolper (kun flammer; lyset er et af gårdens flytbare lys)
  const ironMat = new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 0.6, metalness: 0.5 });
  [-FRAME_X, FRAME_X].forEach((x, i) => {
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.1, 8), ironMat);
    bowl.position.set(x, FRAME_TOP + 0.09, FRAME_Z);
    g.add(bowl);
    const f = flame(0.08, 3.5);
    f.position.set(x, FRAME_TOP + 0.13, FRAME_Z);
    g.add(f);
    world.addFire(f, null, 23 + i * 2);
  });

  const station = {
    id: 'mark',
    position, yaw,
    bounds: { minX: -1.2, maxX: 1.2, minZ: -0.2, maxZ: 1.5 },
    view: { yaw: 0, pitch: -0.48 },
    lights: {
      desk: { position: toWorld(P(0.0, 1.15, -0.35)), intensity: 0.6, distance: 2.0 },
      panel: { position: toWorld(P(-0.6, 2.3, -2.9)), intensity: 8, distance: 9 },
    },
    anchors: {
      panel: PANEL,
      panelYaw: 0,
      panelScale: 1.05,
      // NÆSTE / TIL GÅRDEN ved banens slutning: midt på stenens forkant
      buttons: P(0, TABLE_Y + 0.02, TABLE_Z + 0.12),
      buttonTilt: -1.05,
      tableY: TABLE_Y,
      tableZ: TABLE_Z,
      ground: GROUND,
      fieldNear: -2.4,         // markens forreste kant (z)
    },
  };
  return station;
}
