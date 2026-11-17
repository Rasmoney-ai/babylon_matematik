// Low-poly får: uldkrop af nogle kugler, mørkt hoved med ører, fire ben.
// Geometri og materialer deles af alle får, og uld/hoved er slået sammen til én mesh hver,
// så et får kun koster ca. syv draw calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { blobShadow } from '../scene/shadows.js';

let shared = null;
function parts() {
  if (shared) return shared;
  const ball = (r, detail, [x, y, z], [sx, sy, sz] = [1, 1, 1]) => {
    const g = new THREE.IcosahedronGeometry(r, detail);
    g.scale(sx, sy, sz); g.translate(x, y, z);
    return g;
  };
  // Fåret vender mod +z
  const wool = mergeGeometries([
    ball(0.27, 1, [0, 0.5, 0], [1, 0.82, 1.35]),          // krop
    ball(0.15, 0, [0.1, 0.66, 0.14]),                      // uldtotter ovenpå
    ball(0.15, 0, [-0.1, 0.67, -0.04]),
    ball(0.14, 0, [0.06, 0.64, -0.2]),
    ball(0.13, 0, [-0.15, 0.55, 0.2]),
    ball(0.13, 0, [0.16, 0.53, -0.14]),
    ball(0.07, 0, [0, 0.55, -0.37]),                       // hale
    ball(0.075, 0, [0, 0.75, 0.37]),                       // pandelok
  ]);
  const face = mergeGeometries([
    ball(1, 1, [0, 0.62, 0.43], [0.105, 0.125, 0.17]),     // hoved
    ball(1, 0, [0.12, 0.66, 0.38], [0.085, 0.03, 0.045]),  // ører
    ball(1, 0, [-0.12, 0.66, 0.38], [0.085, 0.03, 0.045]),
  ]);
  const leg = new THREE.CylinderGeometry(0.032, 0.026, 0.36, 6);
  leg.translate(0, -0.18, 0);                               // drejepunkt i hoften
  const hit = new THREE.BoxGeometry(1.0, 1.0, 1.3); hit.translate(0, 0.45, 0);
  const ring = new THREE.RingGeometry(0.42, 0.52, 28).rotateX(-Math.PI / 2);
  shared = {
    wool, face, leg, hit, ring,
    // Lidt varm egenglød, så ulden står lyst og tydeligt i skumringen
    woolMat: new THREE.MeshStandardMaterial({ color: '#fbf3e4', emissive: '#4a3a2a', roughness: 1, flatShading: true }),
    faceMat: new THREE.MeshStandardMaterial({ color: '#2d2420', roughness: 0.85, flatShading: true }),
    hitMat: new THREE.MeshBasicMaterial({ visible: false }),
  };
  return shared;
}

export function createSheep(seed = 0) {
  const p = parts();
  const group = new THREE.Group();      // står på jorden, drejes med yaw
  const body = new THREE.Group();       // vipper og hopper når fåret går
  group.add(body);
  body.add(new THREE.Mesh(p.wool, p.woolMat), new THREE.Mesh(p.face, p.faceMat));
  const legs = [[0.12, 0.2], [-0.12, 0.2], [0.12, -0.2], [-0.12, -0.2]].map(([x, z]) => {
    const l = new THREE.Mesh(p.leg, p.faceMat);
    l.position.set(x, 0.36, z);
    body.add(l);
    return l;
  });
  group.add(blobShadow(0.75, 0.95, 0.55));
  // Ring under fåret: markerer et får uden kugle under parringen (skjult ellers)
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.85, depthWrite: false, fog: false });
  const ring = new THREE.Mesh(p.ring, ringMat);
  ring.position.y = 0.03; ring.visible = false; ring.renderOrder = 2;
  group.add(ring);
  // Usynlig, stor klikflade (gør det let at pege på fåret i VR)
  const hit = new THREE.Mesh(p.hit, p.hitMat);
  group.add(hit);

  // Lidt forskel på fårene, så flokken ser levende ud
  const s = 0.92 + ((seed * 37) % 10) / 60;
  body.scale.setScalar(s);
  let phase = seed * 1.3, idle = seed * 0.7;

  return {
    group, body, legs, ring, hit,
    /** moving: går fåret? speed i m/s. t: samlet tid (til ringens puls). */
    animate(dt, moving, speed = 1) {
      if (moving) {
        phase += dt * (7 + speed * 4);
        const k = Math.sin(phase);
        body.position.y = Math.abs(k) * 0.035;
        body.rotation.z = k * 0.05;
        body.rotation.x = 0;
        legs[0].rotation.x = legs[3].rotation.x = k * 0.55;
        legs[1].rotation.x = legs[2].rotation.x = -k * 0.55;
      } else {
        idle += dt;
        body.position.y *= 0.8;
        body.rotation.z *= 0.8;
        // Rolig vejrtrækning og et lille nik en gang imellem
        body.rotation.x = Math.max(0, Math.sin(idle * 0.6)) ** 8 * 0.18;
        legs.forEach((l) => { l.rotation.x *= 0.8; });
      }
      if (ring.visible) {
        const k = 0.5 + 0.5 * Math.sin(performance.now() / 180);
        ring.material.opacity = 0.45 + 0.5 * k;
        ring.scale.setScalar(1 + 0.08 * k);
      }
    },
  };
}
