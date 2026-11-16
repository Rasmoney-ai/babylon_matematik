// Miljøet: gården i tavlehuset (eduba) i Babylon med zigguraten i horisonten.
// Alt er bygget af simple former og canvas-teksturer – ingen eksterne modeller.
import * as THREE from 'three';

// --- Teksturer ----------------------------------------------------------------
function canvasTexture(w, h, paint, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

function brickPainter(base, mortar, vary = 18) {
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

const sandPainter = (ctx, w, h) => {
  ctx.fillStyle = '#d6b483'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(120,85,45,0.10)' : 'rgba(255,245,220,0.12)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
};

// --- Byggeklodser --------------------------------------------------------------
const box = (w, h, d, mat) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};

function wallSegment(len, height, thick, mat, capMat) {
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

function palm(h = 6, lean = 0.3) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#7a5a3a', roughness: 1 });
  const segs = 7;
  for (let i = 0; i < segs; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.16 - i * 0.008, 0.2 - i * 0.008, h / segs, 7), trunkMat);
    const t = i / segs;
    s.position.set(Math.sin(t * 1.6) * lean * 2, (i + 0.5) * (h / segs), 0);
    s.rotation.z = -Math.cos(t * 1.6) * lean * 0.5;
    s.castShadow = true;
    g.add(s);
  }
  const top = new THREE.Vector3(Math.sin(1.6) * lean * 2, h, 0);
  const leafMat = new THREE.MeshStandardMaterial({ color: '#5b8a34', roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3.2, 4, 1, true), leafMat);
    leaf.scale.set(1, 1, 0.12);
    leaf.geometry.translate(0, 1.6, 0);
    const pivot = new THREE.Group();
    pivot.position.copy(top);
    pivot.rotation.y = (i / 9) * Math.PI * 2;
    leaf.rotation.z = Math.PI / 2 - 0.35 - Math.random() * 0.3;
    leaf.castShadow = true;
    pivot.add(leaf);
    g.add(pivot);
  }
  return g;
}

function jar(color = '#a8683d') {
  const pts = [[0, 0], [0.12, 0.01], [0.2, 0.12], [0.22, 0.3], [0.16, 0.45], [0.08, 0.5], [0.09, 0.56], [0.1, 0.58]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function ziggurat(brickMat, glazeMat) {
  const g = new THREE.Group();
  const tiers = [[44, 9, 44], [32, 8, 32], [21, 7, 21], [12, 5, 12]];
  let y = 0;
  tiers.forEach(([w, h, d]) => {
    const t = box(w, h, d, brickMat);
    t.position.y = y + h / 2;
    g.add(t);
    y += h;
  });
  const temple = box(7, 4, 7, glazeMat);
  temple.position.y = y + 2;
  g.add(temple);
  // Den store trappe mod gården
  const stair = box(6, 0.5, 30, brickMat);
  stair.position.set(0, 12, 24);
  stair.rotation.x = 0.62;
  g.add(stair);
  return g;
}

// --- Selve scenen ----------------------------------------------------------------
export function buildEduba(scene) {
  // Himmel
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(450, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: new THREE.Color('#2f6fb8') }, horizon: { value: new THREE.Color('#f3dcb0') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vP;
        void main(){ float h = clamp(vP.y, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(h, 0.55)), 1.0);
        #include <colorspace_fragment>
        }`,
    }),
  );
  scene.add(sky);
  scene.fog = new THREE.Fog('#ecd3a4', 90, 380);

  // Lys: varm eftermiddagssol
  scene.add(new THREE.HemisphereLight('#cfe3ff', '#a0784a', 1.4));
  const sun = new THREE.DirectionalLight('#ffe9c4', 2.6);
  sun.position.set(18, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 80 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // Jord
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({ map: canvasTexture(512, 512, sandPainter, [180, 180]), roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Gårdens gulv af brændte lerfliser
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ map: canvasTexture(512, 512, brickPainter('#b98758', '#8c6038', 22), [6, 12]), roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.005, -1);
  floor.receiveShadow = true;
  scene.add(floor);

  const mud = new THREE.MeshStandardMaterial({ map: canvasTexture(512, 256, brickPainter('#c49565', '#a77a4c'), [4, 2]), roughness: 1 });
  const mudCap = new THREE.MeshStandardMaterial({ color: '#b98a5b', roughness: 1 });
  const glaze = new THREE.MeshStandardMaterial({ map: canvasTexture(256, 256, brickPainter('#1f4f9e', '#15346a', 30), [2, 2]), roughness: 0.35, metalness: 0.05 });
  const gold = new THREE.MeshStandardMaterial({ color: '#e0b04a', roughness: 0.4, metalness: 0.3 });

  // Mure: gården går fra x -6..6 og z -7..5
  const H = 3.2, T = 0.6;
  const south = wallSegment(12, H, T, mud, mudCap); south.position.set(0, 0, 5); scene.add(south);
  const west = wallSegment(12, H, T, mud, mudCap); west.rotation.y = Math.PI / 2; west.position.set(-6, 0, -1); scene.add(west);
  const east = wallSegment(12, H, T, mud, mudCap); east.rotation.y = Math.PI / 2; east.position.set(6, 0, -1); scene.add(east);
  // Nordmuren har en port mod zigguraten
  const nwL = wallSegment(4.4, H, T, mud, mudCap); nwL.position.set(-3.8, 0, -7); scene.add(nwL);
  const nwR = wallSegment(4.4, H, T, mud, mudCap); nwR.position.set(3.8, 0, -7); scene.add(nwR);

  // Port i blå glaserede sten, som Ishtar-porten
  const gate = new THREE.Group();
  const pillarL = box(1.1, 4.4, 1.0, glaze); pillarL.position.set(-1.65, 2.2, 0);
  const pillarR = box(1.1, 4.4, 1.0, glaze); pillarR.position.set(1.65, 2.2, 0);
  const lintel = box(4.4, 0.9, 1.0, glaze); lintel.position.set(0, 4.0, 0);
  const band = box(4.42, 0.12, 1.02, gold); band.position.set(0, 3.5, 0);
  gate.add(pillarL, pillarR, lintel, band);
  for (let i = 0; i < 6; i++) {
    const rosette = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), gold);
    rosette.position.set(-1.25 + i * 0.5, 4.0, 0.51);
    gate.add(rosette);
  }
  gate.position.set(0, 0, -7);
  scene.add(gate);

  // Zigguraten
  const zig = ziggurat(mud, glaze);
  zig.position.set(0, 0, -62);
  zig.scale.setScalar(1.25);
  scene.add(zig);

  // Fjerne bymure og huse for dybde
  for (let i = 0; i < 26; i++) {
    const ang = (i / 26) * Math.PI * 2;
    const r = 140 + Math.random() * 40;
    const hse = box(8 + Math.random() * 10, 4 + Math.random() * 6, 8 + Math.random() * 10, mud);
    hse.castShadow = false;
    hse.position.set(Math.cos(ang) * r, hse.geometry.parameters.height / 2, Math.sin(ang) * r);
    scene.add(hse);
  }

  // Palmer langs vejen til zigguraten og i gården
  [[-5, -14], [5.5, -16], [-8, -24], [9, -27], [-4.5, -36], [6, -42], [-12, -18], [13, -20],
   [-4.6, 3.6], [4.6, 3.8]].forEach(([x, z], i) => {
    const p = palm(5 + (i % 3), 0.15 + (i % 4) * 0.08);
    p.position.set(x, 0, z);
    p.rotation.y = i * 1.7;
    scene.add(p);
  });

  // Krukker og bænke i gården
  [[-5.3, -6.2], [-4.8, -6.4], [5.2, -6.2], [-5.4, 2], [5.3, 1.2], [5.4, 0.6]].forEach(([x, z], i) => {
    const j = jar(i % 2 ? '#9c5f36' : '#b7774a');
    j.position.set(x, 0, z);
    j.scale.setScalar(1 + (i % 3) * 0.3);
    scene.add(j);
  });
  const wood = new THREE.MeshStandardMaterial({ color: '#7b5434', roughness: 0.8 });
  [[-5.4, -2.5], [5.4, -2.5]].forEach(([x, z]) => {
    const b = box(0.5, 0.42, 2.6, wood); b.position.set(x, 0.21, z); scene.add(b);
  });

  // Skriverbordet foran eleven
  const desk = new THREE.Group();
  const top = box(1.5, 0.06, 0.75, wood); top.position.y = 0.72;
  desk.add(top);
  [[-0.68, -0.32], [0.68, -0.32], [-0.68, 0.32], [0.68, 0.32]].forEach(([x, z]) => {
    const leg = box(0.07, 0.72, 0.07, wood); leg.position.set(x, 0.36, z); desk.add(leg);
  });
  desk.position.set(0, 0, -0.8);
  scene.add(desk);

  // Lille stativ der holder opgavetavlen
  const stand = box(0.5, 0.04, 0.12, wood);
  stand.position.set(0, 0.77, -0.98);
  scene.add(stand);

  // Opslagsvæg til tekstpladen
  const board = box(1.6, 0.85, 0.08, wood);
  board.position.set(0, 1.62, -2.3);
  scene.add(board);
  [-0.7, 0.7].forEach((x) => {
    const post = box(0.1, 1.62, 0.1, wood); post.position.set(x, 0.81, -2.32); scene.add(post);
  });

  return {
    deskTopY: 0.75,
    anchors: {
      question: new THREE.Vector3(0, 0.98, -1.0),
      tokens: new THREE.Vector3(0, 0.78, -0.62),
      panel: new THREE.Vector3(0, 1.62, -2.25),
    },
  };
}
