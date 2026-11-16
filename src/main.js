import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { buildEduba } from './scene/eduba.js';
import { createInteraction } from './core/interaction.js';
import { createDesktopControls } from './core/desktopControls.js';
import { Level1 } from './game/level1.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
// Ingen skygger: skumringslyset er blødt, og det sparer ydelse på Quest
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 1000);
camera.position.set(0, 1.55, 0.15);
const rig = new THREE.Group();   // i VR står eleven i rig'ens nulpunkt foran bordet
rig.add(camera);
scene.add(rig);

const world = buildEduba(scene);
const interaction = createInteraction({ renderer, camera, rig, dom: renderer.domElement });
const controls = createDesktopControls({
  camera, renderer, dom: renderer.domElement,
  bounds: { minX: -5.3, maxX: 5.3, minZ: -0.2, maxZ: 4.3 },
});
const level = new Level1({ scene, interaction, anchors: world.anchors });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.xr.addEventListener('sessionstart', () => document.body.classList.add('in-vr'));
renderer.xr.addEventListener('sessionend', () => document.body.classList.remove('in-vr'));

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  controls.update(dt);
  interaction.update();
  level.update(dt);
  world.update(dt, clock.elapsedTime);
  renderer.render(scene, camera);
});

// Til fejlsøgning i konsollen
window.__babylon = { scene, camera, level };
