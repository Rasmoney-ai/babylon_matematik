// Markedsboden uden for porten: nordøst for gården, på den anden side af vejen end fårefolden.
// Alt bygges i stationens lokale koordinater: eleven står i (0, 0, 0) og ser mod -z.
// Foran eleven står købmandens disk, bag den en hylde til kurvene og bagest et forhæng,
// hvor tekstpladen hænger. Zigguraten ses til venstre i baggrunden.
import * as THREE from 'three';
import { box, jar, oilLamp, canvasTexture } from './props.js';
import { blobShadow, rectShadow } from './shadows.js';

const P = (x, y, z) => new THREE.Vector3(x, y, z);

// Stribet stof til taget: lyst uld med rødbrune og indigo striber
function stripePainter(ctx, w, h) {
  const cols = ['#e2cfa4', '#9b3b28', '#e2cfa4', '#2f3d6e'];
  const n = 8;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect((i * w) / n, 0, w / n + 1, h);
  }
  // Vævet struktur
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,245,220,0.06)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 3, 1);
  }
}

export function buildMarket(scene, world) {
  const { mud, mudCap, wood } = world.materials;
  const position = P(3.6, 0, -11.5);
  const yaw = -0.6;
  const g = new THREE.Group();
  g.position.copy(position);
  g.rotation.y = yaw;
  scene.add(g);
  g.updateMatrixWorld(true);
  const toWorld = (v) => g.localToWorld(v.clone());

  // --- Disken foran eleven: lermur med en planke ovenpå --------------------------
  const COUNTER_Y = 0.8, COUNTER_Z = -0.86;
  const body = box(2.0, 0.76, 0.56, mud); body.position.set(0, 0.38, COUNTER_Z); g.add(body);
  const top = box(2.1, 0.045, 0.66, wood); top.position.set(0, COUNTER_Y - 0.0225, COUNTER_Z); g.add(top);
  { const s = rectShadow(2.4, 1.0, 0.5); s.position.set(0, 0.012, COUNTER_Z); g.add(s); }

  // --- Hylde bag disken, lidt højere: her står arbejdernes kurve ------------------
  const SHELF_Y = 0.98, SHELF_Z = -1.42;
  const shelf = box(2.24, 0.05, 0.36, wood); shelf.position.set(0, SHELF_Y - 0.025, SHELF_Z); g.add(shelf);
  [-1.04, 1.04].forEach((x) => {
    const leg = box(0.07, SHELF_Y - 0.05, 0.3, wood); leg.position.set(x, (SHELF_Y - 0.05) / 2, SHELF_Z); g.add(leg);
  });
  { const s = rectShadow(2.4, 0.6, 0.35); s.position.set(0, 0.012, SHELF_Z); g.add(s); }

  // --- Boden: fire stolper, bjælker og et stribet stoftag ----------------------------
  const FRONT = -0.38, BACK = -2.95, HALF = 1.18;
  const postGeo = new THREE.BoxGeometry(0.1, 1, 0.1);
  const post = (x, z, h) => {
    const p = new THREE.Mesh(postGeo, wood); p.scale.y = h; p.position.set(x, h / 2, z); g.add(p);
    const s = blobShadow(0.3, 0.3, 0.55); s.position.set(x, 0.012, z); g.add(s);
  };
  const H_FRONT = 2.45, H_BACK = 2.2;
  post(-HALF, FRONT, H_FRONT); post(HALF, FRONT, H_FRONT);
  post(-HALF, BACK, H_BACK); post(HALF, BACK, H_BACK);
  const beam = (len, x, y, z, rotY = 0, rotX = 0) => {
    const b = box(len, 0.08, 0.08, wood); b.position.set(x, y, z); b.rotation.set(rotX, rotY, 0, 'YXZ'); g.add(b);
  };
  beam(HALF * 2 + 0.2, 0, H_FRONT - 0.04, FRONT);
  beam(HALF * 2 + 0.2, 0, H_BACK - 0.04, BACK);
  const sideLen = Math.hypot(FRONT - BACK, H_FRONT - H_BACK);
  const sideTilt = Math.atan2(H_FRONT - H_BACK, FRONT - BACK);
  [-HALF, HALF].forEach((x) => beam(sideLen, x, (H_FRONT + H_BACK) / 2 - 0.04, (FRONT + BACK) / 2, Math.PI / 2, -sideTilt));

  // Taget: et sejl der hænger lidt ned i midten
  const roofGeo = new THREE.PlaneGeometry(HALF * 2 + 0.3, FRONT - BACK + 0.3, 14, 10).rotateX(-Math.PI / 2);
  {
    const pos = roofGeo.attributes.position;
    const w = HALF * 2 + 0.3, d = FRONT - BACK + 0.3;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const u = x / w + 0.5, v = z / d + 0.5;               // v = 0 bagest, 1 forrest
      const y = H_BACK + (H_FRONT - H_BACK) * v + 0.02 - Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.12;
      pos.setY(i, y);
    }
    roofGeo.computeVertexNormals();
  }
  const cloth = new THREE.MeshStandardMaterial({ map: canvasTexture(256, 64, stripePainter), roughness: 1, side: THREE.DoubleSide });
  const roof = new THREE.Mesh(roofGeo, cloth);
  roof.position.z = (FRONT + BACK) / 2;
  g.add(roof);

  // Flæse langs forkanten af taget (buet underkant via alpha)
  const valance = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF * 2 + 0.3, 0.2),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(256, 32, stripePainter),
      alphaMap: canvasTexture(256, 32, (ctx, w, h) => {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h * 0.55);
        for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc((i + 0.5) * w / 12, h * 0.55, w / 24, 0, Math.PI); ctx.fill(); }
      }),
      alphaTest: 0.5, roughness: 1, side: THREE.DoubleSide,
    }),
  );
  valance.position.set(0, H_FRONT - 0.07, FRONT + 0.16);
  g.add(valance);

  // Forhæng bagest: mørkt indigo, så tekstpladen står tydeligt
  const curtain = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF * 2, H_BACK - 0.1, 1, 1),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(128, 128, (ctx, w, h) => {
        ctx.fillStyle = '#2c2a45'; ctx.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 8) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, 0, 3, h); }
        ctx.fillStyle = '#8a3626'; ctx.fillRect(0, h * 0.9, w, h * 0.05);
      }, [3, 1]),
      roughness: 1,
    }),
  );
  curtain.position.set(0, (H_BACK - 0.1) / 2, BACK + 0.06);
  g.add(curtain);

  // Tæppe på jorden under boden
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 1.2),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(256, 128, (ctx, w, h) => {
        ctx.fillStyle = '#7a2e22'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#d9b77a'; ctx.lineWidth = 6; ctx.strokeRect(10, 10, w - 20, h - 20);
        ctx.strokeStyle = '#2f3d6e'; ctx.lineWidth = 4; ctx.strokeRect(22, 22, w - 44, h - 44);
        for (let i = 0; i < 7; i++) {
          ctx.fillStyle = i % 2 ? '#d9b77a' : '#2f3d6e';
          const cx = 40 + i * (w - 80) / 6;
          ctx.beginPath(); ctx.moveTo(cx, h / 2 - 16); ctx.lineTo(cx + 12, h / 2); ctx.lineTo(cx, h / 2 + 16); ctx.lineTo(cx - 12, h / 2); ctx.fill();
        }
      }),
      roughness: 1,
    }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.008, -2.2);
  g.add(rug);

  // --- Varer: sække, krukker og en kurv brød ----------------------------------------
  const sackMat = new THREE.MeshStandardMaterial({ color: '#a88a5a', roughness: 1, flatShading: true });
  const sackGeo = new THREE.IcosahedronGeometry(0.22, 1).scale(1, 1.25, 1);
  [[-0.75, -2.35, 1], [-0.42, -2.5, 0.85], [-0.95, -2.0, 0.8]].forEach(([x, z, s]) => {
    const m = new THREE.Mesh(sackGeo, sackMat);
    m.scale.setScalar(s); m.position.set(x, 0.24 * s, z); m.rotation.y = x * 3;
    g.add(m);
    const sh = blobShadow(0.6 * s, 0.6 * s, 0.55); sh.position.set(x, 0.012, z); g.add(sh);
  });
  [[0.75, -2.35, '#9c5f36', 1.1], [0.98, -2.05, '#b7774a', 0.8], [0.45, -2.55, '#a8683d', 0.9]].forEach(([x, z, c, s]) => {
    const j = jar(c); j.scale.setScalar(s); j.position.set(x, 0, z); g.add(j);
    const sh = blobShadow(0.55 * s, 0.55 * s, 0.6); sh.position.set(x, 0.012, z); g.add(sh);
  });
  // Lille krukke yderst til venstre på hylden
  { const j = jar('#b7774a'); j.scale.setScalar(0.32); j.position.set(-0.98, SHELF_Y, SHELF_Z); g.add(j); }

  // Olielampe yderst til højre på hylden (lyset er et af gårdens flytbare lys)
  const lamp = oilLamp('#9c5f36');
  lamp.position.set(0.98, SHELF_Y, SHELF_Z + 0.02);
  lamp.rotation.y = 2.5;
  lamp.scale.setScalar(1.2);
  lamp.add(blobShadow(0.24, 0.17, 0.5, 0.002));
  g.add(lamp);
  world.addFire(lamp.userData.flame, null, 17);

  const station = {
    id: 'marked',
    position, yaw,
    bounds: { minX: -1.0, maxX: 1.0, minZ: -0.2, maxZ: 1.4 },
    view: { yaw: 0, pitch: -0.3 },
    lights: {
      desk: { position: toWorld(P(0.75, 1.45, -1.0)), intensity: 1.3, distance: 3.6 },
      panel: { position: toWorld(P(0, 2.15, -1.3)), intensity: 2.2, distance: 4.5 },
    },
    anchors: {
      panel: P(0, 1.7, -2.78),
      panelYaw: 0,
      panelScale: 1.22,         // hænger langt tilbage på forhænget, så den er lidt større
      // NÆSTE / TIL GÅRDEN ved banens slutning: midt på diskens forkant
      buttons: P(0, COUNTER_Y + 0.02, COUNTER_Z + 0.22),
      buttonTilt: -1.05,
      counterY: COUNTER_Y,
      counterZ: COUNTER_Z,
      shelfY: SHELF_Y,
      shelfZ: SHELF_Z,
    },
  };
  return station;
}
