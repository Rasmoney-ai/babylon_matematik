// Kort fade til sort, fx ved skift af station eller "næste aften".
// En lille sort kugle sidder på kameraet, så det virker ens i browser og VR.
// En valgfri billedtekst kan vises midt i mørket.
import * as THREE from 'three';

export function createFade(camera) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0, side: THREE.BackSide,
    depthTest: false, depthWrite: false, fog: false,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 8), mat);
  sphere.renderOrder = 1000;
  sphere.visible = false;
  sphere.raycast = () => {};
  camera.add(sphere);

  // Billedtekst på et canvas lige foran øjnene
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const capMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
  const caption = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.06), capMat);
  caption.position.z = -0.25;
  caption.renderOrder = 1001;
  caption.visible = false;
  caption.raycast = () => {};
  camera.add(caption);

  let target = 0, speed = 1, captionOn = false, resolve = null;

  function setCaption(text) {
    ctx.clearRect(0, 0, c.width, c.height);
    captionOn = !!text;
    if (!text) return;
    ctx.font = 'italic 600 96px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f3dcae';
    ctx.fillText(text, c.width / 2, c.height / 2);
    tex.needsUpdate = true;
  }

  return {
    /** Fader mod sort (1) eller tilbage (0). Returnerer et promise, der løses, når fade'en er færdig. */
    to(value, duration = 0.35, text = null) {
      if (text !== null) setCaption(text);
      target = value;
      speed = 1 / Math.max(0.01, duration);
      resolve?.();
      return new Promise((r) => { resolve = r; });
    },
    get black() { return mat.opacity > 0.99; },
    update(dt) {
      const o = mat.opacity;
      const next = o < target ? Math.min(target, o + dt * speed) : Math.max(target, o - dt * speed);
      mat.opacity = next;
      capMat.opacity = captionOn ? next : 0;
      sphere.visible = next > 0.001;
      caption.visible = captionOn && next > 0.001;
      if (next === target && resolve) {
        if (target === 0) setCaption(null);
        const r = resolve; resolve = null; r();
      }
    },
  };
}
