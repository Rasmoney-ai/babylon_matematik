// Miljøet: gården i tavlehuset (eduba) i Babylon med zigguraten i horisonten.
// Alt er bygget af simple former og canvas-teksturer – ingen eksterne modeller.
import * as THREE from 'three';
import { canvasTexture, brickPainter, sandPainter, box, wallSegment, palm, jar, flame, oilLamp, torch, flicker } from './props.js';
import { blobShadow, rectShadow, wallFootShadow } from './shadows.js';

function ziggurat(mudMat, glazeMat) {
  const g = new THREE.Group();
  // Mørkere udgave af lerstenene, så zigguraten står som en silhuet mod gløden
  const brickMat = mudMat.clone();
  brickMat.color.set('#a39790');
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
  // Varmt lys fra templets åbning mod gården
  const glowMat = new THREE.MeshBasicMaterial({ color: '#ffb25c', fog: false });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), glowMat);
  door.position.set(0, y + 1.2, 3.52);
  g.add(door);
  [-2.3, 2.3].forEach((x) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.9), glowMat);
    win.position.set(x, y + 2.3, 3.52);
    g.add(win);
  });
  // Ildsteder på trinnene ved trappen (kun emissive flammer, intet ekstra lys)
  const flames = [];
  [[-4.2, 9 + 8, 16.2], [4.2, 9 + 8, 16.2], [-4.2, 9, 22.2], [4.2, 9, 22.2], [-2.5, y, 6.2], [2.5, y, 6.2]].forEach(([x, fy, z]) => {
    const f = flame(0.55, 3);
    f.position.set(x, fy, z);
    g.add(f);
    flames.push(f);
  });
  g.userData.flames = flames;
  // Den store trappe mod gården
  const stair = box(6, 0.5, 30, brickMat);
  stair.position.set(0, 12, 24);
  stair.rotation.x = 0.62;
  g.add(stair);
  return g;
}


function stars(radius = 420) {
  const pos = [], col = [];
  for (let i = 0; i < 520; i++) {
    const y = 0.22 + Math.random() * 0.78;               // kun over ca. 13 grader
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    pos.push(x * radius, y * radius, z * radius);
    // Svagere lavt på himlen og i retning af gløden (nord, -z)
    const glowSide = Math.max(0, -z);
    let b = (0.25 + Math.random() * 0.75) * Math.min(1, (y - 0.22) * 2.2) * (1 - glowSide * 0.75);
    if (Math.random() < 0.04) b = Math.min(1, b * 2);     // enkelte klare stjerner
    const warm = Math.random() * 0.12;
    col.push(b, b * (1 - warm * 0.4), b * (1 - warm));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true,
    depthWrite: false, fog: false, toneMapped: false,
  }));
  pts.renderOrder = -1;
  return pts;
}

// Tynd, tiltagende månesegl lavt i vest, tæt på hvor solen gik ned
function crescentMoon() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff4dc';
  ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(52, 58, 48, 0, Math.PI * 2); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  s.scale.setScalar(9);
  return s;
}


// --- Selve scenen ----------------------------------------------------------------
export function buildEduba(scene) {
  // Himmel i skumringen: solen er lige gået ned bag zigguraten (nord, -z).
  // Orange glød lavt i horisonten mod nord, der går over i dyb blå og indigo opad.
  const fogColor = new THREE.Color('#3b4262');
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(450, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        zenith: { value: new THREE.Color('#0d1230') },
        upper: { value: new THREE.Color('#1f3a72') },
        horizon: { value: new THREE.Color('#4a6890') },
        glow: { value: new THREE.Color('#ea9450') },
        glowHot: { value: new THREE.Color('#ffb060') },
        pale: { value: new THREE.Color('#8fa0ac') },
        below: { value: fogColor },
        sunDir: { value: new THREE.Vector2(0.12, -1).normalize() },  // x/z-retning mod solnedgangen
      },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 zenith; uniform vec3 upper; uniform vec3 horizon; uniform vec3 glow; uniform vec3 glowHot; uniform vec3 pale; uniform vec3 below; uniform vec2 sunDir;
        varying vec3 vP;
        void main(){
          vec3 d = normalize(vP);
          float h = max(d.y, 0.0);
          // Grundgradient: lys blågrå horisont -> blå -> indigo i zenit
          vec3 col = mix(horizon, upper, smoothstep(0.0, 0.35, h));
          col = mix(col, zenith, smoothstep(0.3, 1.0, h));
          // Glød mod solnedgangen: bred og rosa-orange, med en smal hed stribe nederst
          float facing = max(dot(normalize(d.xz + 1e-5), sunDir), 0.0);
          float wide = pow(facing, 2.6) * exp(-h * 4.2);
          float core = pow(facing, 5.0) * exp(-h * 10.0);
          // Først en bleg, kølig overgang og derefter den varme glød.
          // Blå -> blegt gråblå -> orange giver ingen lilla mellemtoner.
          col = mix(col, pale, smoothstep(0.0, 0.5, wide) * 0.7);
          col = mix(col, glow, clamp(pow(wide, 1.4), 0.0, 1.0) * 0.9);
          col = mix(col, glowHot, clamp(core, 0.0, 1.0));
          // Under horisonten: samme farve som tågen, så jorden glider ind i himlen
          col = mix(col, below, smoothstep(0.0, -0.02, d.y));
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  );
  sky.renderOrder = -2;
  scene.add(sky);
  scene.add(stars());
  const moon = crescentMoon();
  moon.position.set(-200, 140, -280);     // lavt i nordvest, tæt på gløden (lige over murene)
  moon.material.rotation = -0.7;          // den lyse side vender ned mod solen
  scene.add(moon);
  scene.fog = new THREE.Fog(fogColor, 45, 300);

  // Lys: køligt, lavt omgivelseslys fra himlen + et svagt varmt skær fra horisonten.
  // Skygger er slået fra – i skumringen er de næsten usynlige, og det sparer ydelse på Quest.
  scene.add(new THREE.HemisphereLight('#8a9cc8', '#3a2c24', 1.15));
  const dusk = new THREE.DirectionalLight('#ff9e6e', 0.55);
  dusk.position.set(-6, 5, -40);
  scene.add(dusk);

  // Flammer der flakker. Højst fire PointLights i alt, ingen af dem kaster skygger.
  const flickers = [];   // { flame, light, base, seed }
  const addFire = (obj, light, seed) => flickers.push({ flame: obj, light, base: light ? light.intensity : 0, seed });

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

  // Svag mørk kant langs murenes fod inde i gården (den mørke side vender mod muren)
  const foot = (len, x, z, rotY) => { const f = wallFootShadow(len, 0.8, 0.5); f.position.set(x, 0.011, z); f.rotation.y = rotY; scene.add(f); };
  foot(11.4, 0, 4.7 - 0.4, Math.PI);          // syd: muren ligger mod +z
  foot(11.4, -5.7 + 0.4, -1, Math.PI / 2);    // vest
  foot(11.4, 5.7 - 0.4, -1, -Math.PI / 2);    // øst
  foot(3.9, -3.85, -6.7 + 0.4, 0);            // nord, venstre for porten
  foot(3.9, 3.85, -6.7 + 0.4, 0);             // nord, højre for porten
  // Og på ydersiden mod nord, hvor fårefolden ligger
  [[-3.8, 4.4], [3.8, 4.4]].forEach(([x, len]) => { const f = wallFootShadow(len, 0.9, 0.4); f.position.set(x, 0.011, -7.3 - 0.45); f.rotation.y = Math.PI; scene.add(f); });

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
  [-1.65, 1.65].forEach((x) => { const s = blobShadow(1.9, 1.8, 0.45); s.position.x = x; gate.add(s); });

  // Fakler på muren på hver side af porten (2 PointLights)
  [-2.75, 2.75].forEach((x, i) => {
    const t = torch();
    t.position.set(x, 2.25, -6.7);
    scene.add(t);
    const l = new THREE.PointLight('#ff9a48', 4.5, 9, 2);
    l.position.set(x, 2.85, -6.2);
    scene.add(l);
    addFire(t.userData.flame, l, i * 3.1 + 1);
  });

  // Zigguraten
  const zig = ziggurat(mud, glaze);
  zig.position.set(0, 0, -62);
  zig.scale.setScalar(1.25);
  scene.add(zig);
  zig.userData.flames.forEach((f, i) => addFire(f, null, i * 1.7 + 4));

  // Fjerne bymure og huse for dybde
  for (let i = 0; i < 26; i++) {
    const ang = (i / 26) * Math.PI * 2;
    const r = 140 + Math.random() * 40;
    const hse = box(8 + Math.random() * 10, 4 + Math.random() * 6, 8 + Math.random() * 10, mud);
    hse.castShadow = false;
    hse.position.set(Math.cos(ang) * r, hse.geometry.parameters.height / 2, Math.sin(ang) * r);
    scene.add(hse);
  }

  // Palmer langs vejen til zigguraten og i gården (fårefolden ligger nordvest for porten)
  [[-9.6, -12.2], [5.5, -16], [-8, -24], [9, -27], [-4.5, -36], [6, -42], [-12, -18], [13, -20],
   [-4.6, 3.6], [4.6, 3.8]].forEach(([x, z], i) => {
    const p = palm(5 + (i % 3), 0.15 + (i % 4) * 0.08);
    p.position.set(x, 0, z);
    p.rotation.y = i * 1.7;
    p.add(blobShadow(1.1, 1.1, 0.55));
    scene.add(p);
  });

  // Krukker og bænke i gården
  [[-5.3, -6.2], [-4.8, -6.4], [5.2, -6.2], [-5.4, 2], [5.3, 1.2], [5.4, 0.6]].forEach(([x, z], i) => {
    const j = jar(i % 2 ? '#9c5f36' : '#b7774a');
    j.position.set(x, 0, z);
    j.scale.setScalar(1 + (i % 3) * 0.3);
    j.add(blobShadow(0.62, 0.62, 0.6));
    scene.add(j);
  });
  const wood = new THREE.MeshStandardMaterial({ color: '#7b5434', roughness: 0.8 });
  [[-5.4, -2.5], [5.4, -2.5]].forEach(([x, z]) => {
    const b = box(0.5, 0.42, 2.6, wood); b.position.set(x, 0.21, z); scene.add(b);
    const s = rectShadow(0.8, 2.95, 0.5); s.position.set(x, 0.012, z); scene.add(s);
  });

  // Skriverbordet foran eleven
  const desk = new THREE.Group();
  const top = box(1.5, 0.06, 0.75, wood); top.position.y = 0.72;
  desk.add(top);
  [[-0.68, -0.32], [0.68, -0.32], [-0.68, 0.32], [0.68, 0.32]].forEach(([x, z]) => {
    const leg = box(0.07, 0.72, 0.07, wood); leg.position.set(x, 0.36, z); desk.add(leg);
  });
  // Blød skygge under bordpladen + små mørke pletter, hvor benene står
  const deskShadow = rectShadow(1.75, 1.0, 0.55); desk.add(deskShadow);
  [[-0.68, -0.32], [0.68, -0.32], [-0.68, 0.32], [0.68, 0.32]].forEach(([x, z]) => {
    const s = blobShadow(0.2, 0.2, 0.6, 0.013); s.position.set(x, 0.013, z); desk.add(s);
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
    const s = blobShadow(0.32, 0.32, 0.6); s.position.set(x, 0.012, -2.32); scene.add(s);
  });
  { const s = rectShadow(1.9, 0.5, 0.35); s.position.set(0, 0.012, -2.3); scene.add(s); }

  // Olielampe på skriverbordet (bagerste venstre hjørne, fri af tavle og brikker).
  // Tuden peger skråt ind mod midten, så den ses i profil fra elevens plads.
  const lamp = oilLamp();
  lamp.position.set(-0.6, 0.75, -1.0);
  lamp.rotation.y = -0.45;
  lamp.scale.setScalar(1.15);
  { const s = blobShadow(0.24, 0.17, 0.55, 0.002); s.position.x = 0.02; lamp.add(s); }
  scene.add(lamp);
  const deskLight = new THREE.PointLight('#ffb36b', 1.25, 4, 2);
  deskLight.position.set(-0.3, 1.2, -0.55);
  scene.add(deskLight);
  addFire(lamp.userData.flame, deskLight, 0.4);

  // Lampefod ved opslagsvæggen med en lerlampe, der lyser tekstpladen op
  const standMat = new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.9 });
  const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.3, 8), standMat);
  lampPost.position.set(-1.05, 0.65, -1.95);
  const lampPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.03, 14), standMat);
  lampPlate.position.set(-1.05, 1.31, -1.95);
  scene.add(lampPost, lampPlate);
  { const s = blobShadow(0.42, 0.42, 0.6); s.position.set(-1.05, 0.012, -1.95); scene.add(s); }
  const lamp2 = oilLamp('#9c5f36');
  lamp2.position.set(-1.05, 1.325, -1.95);
  lamp2.rotation.y = -0.3;
  lamp2.scale.setScalar(1.3);
  scene.add(lamp2);
  const panelLight = new THREE.PointLight('#ffb36b', 1.6, 5, 2);
  panelLight.position.set(-0.85, 1.55, -1.55);
  scene.add(panelLight);
  addFire(lamp2.userData.flame, panelLight, 2.2);

  // Lerlamper i gården uden eget lys (kun flammen), så vi holder os på fire PointLights
  [[-5.4, 0.42, -2.0], [5.4, 0.42, -3.1]].forEach(([x, y, z], i) => {
    const l = oilLamp(i ? '#9c5f36' : '#b7774a');
    l.position.set(x, y, z);
    l.rotation.y = i * 2;
    l.scale.setScalar(1.5);
    l.add(blobShadow(0.2, 0.16, 0.5, 0.002));
    scene.add(l);
    addFire(l.userData.flame, null, 7 + i);
  });

  // Kaldes hver frame fra game-loopet: flammerne flakker roligt
  const update = (dt, time) => {
    for (const f of flickers) {
      const k = flicker(time, f.seed);
      if (f.light) f.light.intensity = f.base * k;
      const b = f.flame.userData.base;
      f.flame.userData.outer.scale.set(b * (2 - k), b * 1.6 * k * k, b * (2 - k));
    }
  };

  // De to "flytbare" lys følger den aktive station (se setLights). Faklerne bliver i gården.
  const movable = { desk: deskLight, panel: panelLight };
  const lightsAt = (defs) => {
    for (const [key, d] of Object.entries(defs)) {
      const l = movable[key];
      l.position.copy(d.position);
      l.distance = d.distance;
      flickers.find((f) => f.light === l).base = d.intensity;
    }
  };
  const snapshot = (l) => ({ position: l.position.clone(), intensity: l.intensity, distance: l.distance });

  // Gården er startstedet. Stationens koordinater er verdenskoordinater (ingen drejning).
  const station = {
    id: 'gaard',
    position: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    bounds: { minX: -5.3, maxX: 5.3, minZ: -0.2, maxZ: 4.3 },
    view: { yaw: 0, pitch: -0.3 },
    lights: { desk: snapshot(deskLight), panel: snapshot(panelLight) },
    anchors: {
      question: new THREE.Vector3(0, 0.98, -1.0),
      tokens: new THREE.Vector3(0, 0.78, -0.62),
      panel: new THREE.Vector3(0, 1.62, -2.25),
      // Knapper ved banens slutning og banevælgeren ligger på bordets forkant
      buttons: new THREE.Vector3(0, 0.78, -0.62),
      buttonTilt: -1.05,
      hub: new THREE.Vector3(0, 0.775, -0.6),
    },
  };

  return {
    update,
    deskTopY: 0.75,
    stations: { gaard: station },
    setLights: lightsAt,
    addFire,
    materials: { mud, mudCap, wood },
  };
}
