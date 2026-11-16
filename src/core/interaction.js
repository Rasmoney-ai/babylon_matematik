// Fælles pege-og-vælg for mus, touch og VR-controllere.
// Et objekt bliver klikbart ved add(obj, { onSelect, onHover }).
import * as THREE from 'three';

export function createInteraction({ renderer, camera, rig, dom }) {
  const raycaster = new THREE.Raycaster();
  const targets = new Map();          // obj -> { onSelect, onHover }
  const hoveredBy = new Map();        // kilde -> obj
  let lastHovered = new Set();
  const mouse = { ndc: new THREE.Vector2(), inside: false, down: null };

  function owner(o) {
    while (o) { if (targets.has(o)) return o; o = o.parent; }
    return null;
  }
  function pick() {
    const hits = raycaster.intersectObjects([...targets.keys()], true);
    for (const h of hits) { const o = owner(h.object); if (o && o.visible) return o; }
    return null;
  }
  function select(o) { if (o) targets.get(o).onSelect?.(o); }

  // --- Mus / touch --------------------------------------------------------------
  function setNdc(e) {
    const r = dom.getBoundingClientRect();
    mouse.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }
  dom.addEventListener('pointermove', (e) => { setNdc(e); mouse.inside = true; });
  dom.addEventListener('pointerleave', () => { mouse.inside = false; });
  dom.addEventListener('pointerdown', (e) => { mouse.down = { x: e.clientX, y: e.clientY }; });
  dom.addEventListener('pointerup', (e) => {
    if (!mouse.down) return;
    const moved = Math.hypot(e.clientX - mouse.down.x, e.clientY - mouse.down.y);
    mouse.down = null;
    if (moved > 6 || renderer.xr.isPresenting) return;   // det var et træk, ikke et klik
    setNdc(e);
    raycaster.setFromCamera(mouse.ndc, camera);
    select(pick());
  });

  // --- VR-controllere -------------------------------------------------------------
  const controllers = [0, 1].map((i) => {
    const c = renderer.xr.getController(i);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0.8 }));
    line.scale.z = 3;
    c.add(line);
    c.userData.line = line;
    c.addEventListener('select', () => { rayFrom(c); select(pick()); });
    rig.add(c);
    return c;
  });
  const tmp = new THREE.Matrix4();
  function rayFrom(c) {
    tmp.identity().extractRotation(c.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tmp);
  }

  // --- Opdatering hver frame (hover) ---------------------------------------------
  function update() {
    hoveredBy.clear();
    if (renderer.xr.isPresenting) {
      controllers.forEach((c, i) => {
        rayFrom(c);
        const hits = raycaster.intersectObjects([...targets.keys()], true);
        const o = hits.length ? owner(hits[0].object) : null;
        c.userData.line.scale.z = hits.length ? hits[0].distance : 3;
        if (o) hoveredBy.set(`c${i}`, o);
      });
    } else if (mouse.inside && !mouse.down) {
      raycaster.setFromCamera(mouse.ndc, camera);
      const o = pick();
      if (o) hoveredBy.set('mouse', o);
    }
    const now = new Set(hoveredBy.values());
    lastHovered.forEach((o) => { if (!now.has(o)) targets.get(o)?.onHover?.(false, o); });
    now.forEach((o) => { if (!lastHovered.has(o)) targets.get(o)?.onHover?.(true, o); });
    lastHovered = now;
    dom.style.cursor = now.size && !renderer.xr.isPresenting ? 'pointer' : '';
  }

  return {
    add(obj, handlers) { targets.set(obj, handlers); },
    remove(obj) { targets.delete(obj); },
    update,
  };
}
