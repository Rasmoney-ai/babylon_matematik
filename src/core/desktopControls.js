// Browser-styring: træk for at kigge, WASD/piletaster for at gå. Slås fra i VR.
// Kameraet sidder i `rig`, så alt her er i rig'ens lokale koordinater: når eleven
// flyttes til en ny station, flyttes rig'en, og bevægelsesgrænserne skiftes med setStation().
export function createDesktopControls({ camera, dom, renderer, bounds }) {
  let yaw = 0, pitch = -0.3;
  let drag = null;
  const keys = new Set();

  dom.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; dom.setPointerCapture?.(e.pointerId); });
  dom.addEventListener('pointerup', () => { drag = null; });
  dom.addEventListener('pointercancel', () => { drag = null; });
  dom.addEventListener('pointermove', (e) => {
    if (!drag || renderer.xr.isPresenting) return;
    yaw += (e.clientX - drag.x) * 0.004;
    pitch += (e.clientY - drag.y) * 0.004;
    pitch = Math.max(-1.3, Math.min(1.2, pitch));
    drag = { x: e.clientX, y: e.clientY };
  });
  addEventListener('keydown', (e) => keys.add(e.code));
  addEventListener('keyup', (e) => keys.delete(e.code));

  return {
    /** Ny station: nulstil kamera og blik, og brug stationens grænser (lokale koordinater). */
    setStation(station) {
      bounds = station.bounds;
      yaw = station.view?.yaw ?? 0;
      pitch = station.view?.pitch ?? -0.3;
      if (!renderer.xr.isPresenting) camera.position.set(0, 1.55, 0.15);
    },
    /** Til test/skærmbilleder: sæt blikket direkte. */
    look(y, p) { yaw = y; pitch = p; },
    update(dt) {
      if (renderer.xr.isPresenting) return;
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
      const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
      const s = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
      if (!f && !s) return;
      const speed = 2.2 * dt;
      // frem = (-sin yaw, -cos yaw), højre = (cos yaw, -sin yaw)
      camera.position.x += (-Math.sin(yaw) * f + Math.cos(yaw) * s) * speed;
      camera.position.z += (-Math.cos(yaw) * f - Math.sin(yaw) * s) * speed;
      camera.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, camera.position.x));
      camera.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, camera.position.z));
    },
  };
}
