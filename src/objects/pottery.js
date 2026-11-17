// Hyrdens ting: en krukke med bred åbning, en flad skål og små lerkugler.
import * as THREE from 'three';
import { blobShadow } from '../scene/shadows.js';

const clay = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide, emissive: new THREE.Color(0) });
const hitMat = new THREE.MeshBasicMaterial({ visible: false });

export const stoneGeo = new THREE.IcosahedronGeometry(0.024, 1);
export const stoneMat = new THREE.MeshStandardMaterial({ color: '#c08a58', roughness: 0.85, flatShading: true });

/** Tælle-krukken. Åbningen sidder i `mouth` (lokalt), hvor kuglerne falder ned. */
export function createCountJar() {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.07, 0.005], [0.12, 0.06], [0.14, 0.15], [0.125, 0.24], [0.09, 0.29], [0.085, 0.31],
    [0.1, 0.33], [0.092, 0.335], [0.075, 0.31], [0.07, 0.25], [0, 0.23]].map(([x, y]) => new THREE.Vector2(x, y));
  const mat = clay('#a5643a');
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat);
  // Mørk indersiden, så man kan se, at krukken er åben
  const inside = new THREE.Mesh(new THREE.CircleGeometry(0.074, 18), new THREE.MeshStandardMaterial({ color: '#2a170b', roughness: 1 }));
  inside.rotation.x = -Math.PI / 2; inside.position.y = 0.3;
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.45, 10), hitMat);
  hit.position.y = 0.2;
  g.add(body, inside, hit, blobShadow(0.38, 0.38, 0.6, 0.002));
  return { group: g, mat, mouth: new THREE.Vector3(0, 0.33, 0) };
}

/** Flad skål med en bunke lerkugler. setCount(n) viser n kugler. */
export function createStoneBowl(capacity = 26) {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.06, 0], [0.07, 0.01], [0.15, 0.05], [0.175, 0.085], [0.168, 0.09], [0.14, 0.065], [0, 0.03]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const mat = clay('#b37a4b');
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 26), mat);
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.25, 10), hitMat);
  hit.position.y = 0.08;
  g.add(body, hit, blobShadow(0.42, 0.42, 0.6, 0.002));

  // Faste pladser i en lille bunke: ydre ring nederst, så indad og opad
  const slots = [];
  let i = 0;
  for (let layer = 0; slots.length < capacity; layer++) {
    const rings = [[0.11, 11], [0.065, 7], [0.02, 2]];
    for (const [r, n] of rings) {
      for (let k = 0; k < n && slots.length < capacity; k++, i++) {
        const a = (k / n) * Math.PI * 2 + layer * 0.5;
        const rr = Math.max(0, r - layer * 0.03);
        slots.push(new THREE.Vector3(Math.cos(a) * rr, 0.055 + layer * 0.036 + (0.11 - r) * 0.25, Math.sin(a) * rr));
      }
    }
  }
  const stones = slots.map((p) => {
    const s = new THREE.Mesh(stoneGeo, stoneMat);
    s.position.copy(p);
    s.rotation.set(p.x * 40, p.z * 40, 0);
    g.add(s);
    return s;
  });
  let count = 0;
  const api = {
    group: g, mat,
    get count() { return count; },
    setCount(n) {
      count = Math.max(0, Math.min(capacity, n));
      stones.forEach((s, k) => { s.visible = k < count; });
    },
    /** Lokal position for den øverste kugle (hvor den tages fra / lægges). */
    topSlot() { return slots[Math.max(0, count - 1)].clone(); },
  };
  api.setCount(0);
  return api;
}
