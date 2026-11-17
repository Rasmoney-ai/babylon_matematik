// 3D-objekter: lertavler, svarbrikker og tekstplade. Alle tegnes via CanvasTexture.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { drawNumberTablet, drawNumberToken, drawLabelToken, paintClay, wrapText } from './clayCanvas.js';

const clayBody = (color = '#b88a5a') =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0 });

/** Lerklump + forside med canvas. Returnerer { group, face, canvas, ctx, redraw(fn) }. */
function makeClaySlab(w, h, d, px = 512, bodyColor) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.35), clayBody(bodyColor));
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  const canvas = document.createElement('canvas');
  canvas.width = px; canvas.height = Math.round(px * (h / w));
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.9, h * 0.88),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: new THREE.Color(0x000000) }),
  );
  face.position.z = d / 2 + 0.0015;
  group.add(face);

  const redraw = (fn) => { fn(ctx, canvas.width, canvas.height); tex.needsUpdate = true; };
  return { group, body, face, canvas, ctx, redraw };
}

/** Stor opgavetavle med kileskrift. */
export function createQuestionTablet() {
  const slab = makeClaySlab(0.56, 0.38, 0.05, 768);
  slab.show = (digits) => slab.redraw((ctx, w, h) => drawNumberTablet(ctx, w, h, digits, { places: 2 }));
  slab.blank = () => slab.redraw((ctx, w, h) => paintClay(ctx, w, h, 3));
  slab.blank();
  return slab;
}

/** Lille svarbrik med et tal. Kan pege- og klikkes. */
export function createToken(seed = 1) {
  const slab = makeClaySlab(0.17, 0.11, 0.035, 384, '#c4935f');
  slab.setText = (t) => slab.redraw((ctx, w, h) => drawNumberToken(ctx, w, h, String(t), seed));
  slab.setHover = (on) => {
    slab.face.material.emissive.set(on ? 0x553311 : 0x000000);
    slab.group.scale.setScalar(on ? 1.08 : 1);
  };
  slab.setDim = (on) => {
    slab.face.material.color.set(on ? 0x777777 : 0xffffff);
  };
  return slab;
}

/**
 * Bredere brik med et ord: banevælger og knapper (NÆSTE, TIL GÅRDEN, VIDERE …).
 * setLabel({ title, sub, done }) tegner den om.
 */
export function createLabelToken(seed = 1, w = 0.25, h = 0.12) {
  const slab = makeClaySlab(w, h, 0.035, 512, '#c4935f');
  slab.setLabel = (opts) => slab.redraw((ctx, cw, ch) => drawLabelToken(ctx, cw, ch, { seed, ...opts }));
  slab.setText = (t) => slab.setLabel({ title: String(t) });
  slab.setHover = (on) => {
    slab.face.material.emissive.set(on ? 0x553311 : 0x000000);
    slab.group.scale.setScalar(on ? 1.08 : 1);
  };
  slab.setDim = (on) => {
    slab.face.material.color.set(on ? 0x8c8680 : 0xffffff);
    slab.body.material.color.set(on ? '#8a7866' : '#c4935f');
  };
  return slab;
}

/** Tekstplade: en stor lerplade på væggen med titel og brødtekst. */
export function createPanel() {
  const slab = makeClaySlab(1.3, 0.62, 0.06, 1024, '#a77b4e');
  slab.setText = (title, body, footer = '') =>
    slab.redraw((ctx, w, h) => {
      paintClay(ctx, w, h, 11, '#dcbf94');
      ctx.fillStyle = '#4a2a12';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = `700 ${Math.round(h * 0.14)}px Georgia, serif`;
      ctx.fillText(title, w * 0.06, h * 0.07);
      ctx.font = `${Math.round(h * 0.095)}px Georgia, serif`;
      wrapText(ctx, body, w * 0.06, h * 0.28, w * 0.88, h * 0.125);
      if (footer) {
        ctx.font = `italic ${Math.round(h * 0.06)}px Georgia, serif`;
        ctx.fillStyle = 'rgba(74,42,18,0.7)';
        ctx.textAlign = 'right';
        ctx.fillText(footer, w * 0.94, h * 0.84);
      }
    });
  return slab;
}
