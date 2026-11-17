// Fårefolden uden for porten: nordvest for gården, ved vejen mod zigguraten.
// Alt bygges i stationens lokale koordinater: eleven står i (0, 0, 0) og ser mod -z.
// Folden ligger foran, zigguraten ses lidt til højre i baggrunden.
import * as THREE from 'three';
import { box, palm, flame, oilLamp, canvasTexture } from './props.js';
import { blobShadow, rectShadow, wallFootShadow } from './shadows.js';

const P = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildFold(scene, world) {
  const { mud, mudCap, wood } = world.materials;
  const position = P(-3.5, 0, -11);
  const yaw = 0.6;
  const g = new THREE.Group();
  g.position.copy(position);
  g.rotation.y = yaw;
  scene.add(g);
  const toWorld = (v) => g.localToWorld(v.clone());
  g.updateMatrixWorld(true);

  // --- Lav lermur foran eleven: her står krukken og skålen ----------------------
  const LEDGE_Y = 0.77;
  const LEDGE_Z = -0.9;
  const ledge = box(1.7, 0.72, 0.56, mud); ledge.position.set(0, 0.36, LEDGE_Z); g.add(ledge);
  const cap = box(1.78, 0.05, 0.64, mudCap); cap.position.set(0, 0.745, LEDGE_Z); g.add(cap);
  { const s = rectShadow(2.1, 1.0, 0.5); s.position.set(0, 0.012, LEDGE_Z); g.add(s); }

  const lamp = oilLamp('#9c5f36');
  lamp.position.set(0.7, LEDGE_Y, LEDGE_Z - 0.14);
  lamp.rotation.y = 2.4;            // tuden peger skråt ind mod eleven
  lamp.scale.setScalar(1.2);
  lamp.add(blobShadow(0.24, 0.17, 0.5, 0.002));
  g.add(lamp);
  world.addFire(lamp.userData.flame, null, 11);

  // --- Folden: lermure på tre sider, et træhegn med låge mod eleven ---------------
  const FRONT = -3.2, BACK = -6.7, HALF = 2.3, WALL_H = 0.62;
  const straw = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF * 2, FRONT - BACK),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#8f7646'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 1400; i++) {
          ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(214,180,110,0.35)' : 'rgba(70,50,25,0.3)';
          const x = Math.random() * w, y = Math.random() * h, a = Math.random() * Math.PI;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); ctx.stroke();
        }
      }, [3, 2]),
      roughness: 1,
    }),
  );
  straw.rotation.x = -Math.PI / 2;
  straw.position.set(0, 0.006, (FRONT + BACK) / 2);
  g.add(straw);

  const lowWall = (len, x, z, rotY) => {
    const w = box(len, WALL_H, 0.3, mud); w.position.set(x, WALL_H / 2, z); w.rotation.y = rotY; g.add(w);
    const c = box(len + 0.04, 0.05, 0.36, mudCap); c.position.set(x, WALL_H + 0.02, z); c.rotation.y = rotY; g.add(c);
    // Mørk kant på begge sider af muren
    [1, -1].forEach((side) => {
      const f = wallFootShadow(len, 0.5, 0.45);
      const off = new THREE.Vector3(0, 0, side * 0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
      f.position.set(x + off.x, 0.012, z + off.z);
      f.rotation.y = rotY + (side > 0 ? 0 : Math.PI);   // mørk side mod muren
      g.add(f);
    });
  };
  lowWall(HALF * 2 + 0.3, 0, BACK, 0);
  lowWall(FRONT - BACK, -HALF, (FRONT + BACK) / 2, Math.PI / 2);
  lowWall(FRONT - BACK, HALF, (FRONT + BACK) / 2, Math.PI / 2);

  // Træhegn mod eleven, med en åbning til lågen
  const GATE_L = -1.45, GATE_R = -0.55;
  const postGeo = new THREE.BoxGeometry(0.08, 0.85, 0.08);
  const addPost = (x) => {
    const p = new THREE.Mesh(postGeo, wood); p.position.set(x, 0.425, FRONT); g.add(p);
    const s = blobShadow(0.22, 0.22, 0.55); s.position.set(x, 0.012, FRONT); g.add(s);
  };
  const addRails = (x0, x1) => {
    [0.36, 0.7].forEach((y) => {
      const r = box(x1 - x0, 0.06, 0.04, wood); r.position.set((x0 + x1) / 2, y, FRONT); g.add(r);
    });
    const s = rectShadow(x1 - x0, 0.35, 0.3); s.position.set((x0 + x1) / 2, 0.012, FRONT); g.add(s);
  };
  [-HALF, -1.9, GATE_L, GATE_R, 0.1, 0.75, 1.4, 1.85, HALF].forEach(addPost);
  addRails(-HALF, GATE_L);
  addRails(GATE_R, HALF);

  // Lågen: hængslet i venstre side, svinger ind i folden
  const gateHinge = new THREE.Group();
  gateHinge.position.set(GATE_L + 0.04, 0, FRONT);
  const leafW = GATE_R - GATE_L - 0.1;
  [0.3, 0.62].forEach((y) => { const r = box(leafW, 0.07, 0.035, wood); r.position.set(leafW / 2, y, 0); gateHinge.add(r); });
  [0.03, leafW - 0.03].forEach((x) => { const s = box(0.05, 0.62, 0.04, wood); s.position.set(x, 0.38, 0); gateHinge.add(s); });
  const brace = box(Math.hypot(leafW, 0.32), 0.05, 0.03, wood);
  brace.position.set(leafW / 2, 0.46, 0); brace.rotation.z = Math.atan2(0.32, leafW); gateHinge.add(brace);
  g.add(gateHinge);
  const gate = {
    open: 0,
    set(k) { this.open = k; gateHinge.rotation.y = k * Math.PI * 0.5; },
  };
  gate.set(0);

  // Fakkel på en stage ved lågen (kun flammen; lyset er et af gårdens lys, der flyttes hertil)
  const pole = box(0.09, 1.75, 0.09, wood); pole.position.set(-1.9, 0.875, FRONT + 0.25); g.add(pole);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.1, 8), new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 0.6, metalness: 0.5 }));
  bowl.position.set(-1.9, 1.78, FRONT + 0.25); g.add(bowl);
  const torchFlame = flame(0.08, 3.5);
  torchFlame.position.set(-1.9, 1.82, FRONT + 0.25); g.add(torchFlame);
  world.addFire(torchFlame, null, 13);
  { const s = blobShadow(0.3, 0.3, 0.6); s.position.set(-1.9, 0.012, FRONT + 0.25); g.add(s); }

  // Trampet sti, hvor fårene kommer fra græsningen (fra venstre)
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 1.5),
    new THREE.MeshBasicMaterial({
      map: canvasTexture(256, 64, (ctx, w, h) => {
        const gr = ctx.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
        const fade = ctx.createLinearGradient(0, 0, w, 0);
        fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(0.15, 'rgba(0,0,0,0)');
        fade.addColorStop(0.85, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = fade; ctx.fillRect(0, 0, w, h);
      }),
      color: '#5a3d22', transparent: true, opacity: 0.35, depthWrite: false,
    }),
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(-4.2, 0.009, -2.45);
  g.add(path);

  // Gemmested: en lav murrest og en palme til højre, hvor et får kan blive væk
  const ruin = box(1.5, 0.8, 0.32, mud);
  ruin.position.set(3.3, 0.4, -1.8); ruin.rotation.y = -1.07; g.add(ruin);
  { const s = rectShadow(1.9, 0.75, 0.5); s.position.set(3.3, 0.012, -1.8); s.rotation.y = -1.07; g.add(s); }
  const hidePalm = palm(5.5, 0.25);
  hidePalm.position.set(4.3, 0, -1.3); hidePalm.rotation.y = 2;
  hidePalm.add(blobShadow(1.1, 1.1, 0.55));
  g.add(hidePalm);

  // Pladser i folden: bagerste række først (højre mod venstre), så de næste ikke går igennem
  const slots = [];
  [-6.05, -5.1, -4.15].forEach((z, r) => {
    [1.5, 0.5, -0.5, -1.5].forEach((x, c) => {
      const j = ((r * 4 + c) * 7919) % 13 / 13 - 0.5;
      slots.push(P(x + j * 0.25, 0, z + j * 0.2));
    });
  });

  // Flokken venter ude på græsningen til venstre
  const flock = [];
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4, r = 0.35 + (i % 4) * 0.33;
    flock.push(P(-7.2 + Math.cos(a) * r * 1.4, 0, -2.7 + Math.sin(a) * r));
  }

  const station = {
    id: 'fold',
    position, yaw,
    bounds: { minX: -1.4, maxX: 1.4, minZ: -0.2, maxZ: 1.4 },
    view: { yaw: 0, pitch: -0.3 },
    lights: {
      desk: { position: toWorld(P(0.3, 1.5, -0.2)), intensity: 0.9, distance: 3.5 },
      panel: { position: toWorld(P(-0.3, 2.7, -2.0)), intensity: 9, distance: 12 },
    },
    anchors: {
      panel: P(-0.95, 1.7, -2.45),
      panelYaw: 0.36,
      buttons: P(0, LEDGE_Y + 0.025, LEDGE_Z + 0.2),
      buttonTilt: -1.05,
      ledgeY: LEDGE_Y,
      jar: P(-0.38, LEDGE_Y, LEDGE_Z - 0.06),
      bowl: P(0.28, LEDGE_Y, LEDGE_Z - 0.04),
      flock,
      gateOut: P(-1.0, 0, -2.45),
      gateIn: P(-1.0, 0, -3.8),
      slots,
      hide: P(3.95, 0, -2.2),
      hideExit: P(2.3, 0, -2.5),
    },
    gate,
  };
  return station;
}
