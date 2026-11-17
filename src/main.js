import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { buildEduba } from './scene/eduba.js';
import { buildFold } from './scene/fold.js';
import { buildMarket } from './scene/market.js';
import { buildField } from './scene/field.js';
import { createInteraction } from './core/interaction.js';
import { createDesktopControls } from './core/desktopControls.js';
import { createFade } from './core/fade.js';
import { LevelManager } from './game/levels.js';
import { Hub } from './game/hub.js';
import { HyrdeLevel } from './game/hyrde.js';
import { SkriverLevel } from './game/skriver.js';
import { KoebmandLevel } from './game/koebmand.js';
import { LandmaalerLevel } from './game/landmaaler.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
// Ingen shadow maps: skumringslyset er blødt, og bløde "blob"-skygger (scene/shadows.js) er billigere på Quest
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
const vrButton = VRButton.createButton(renderer);
vrButton.id ||= 'VRButton';        // placeres øverst til højre via CSS i index.html
document.body.appendChild(vrButton);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 1000);
camera.position.set(0, 1.55, 0.15);
// Eleven står i rig'ens nulpunkt. Skift af station flytter rig'en (i VR og i browser).
const rig = new THREE.Group();
rig.add(camera);
scene.add(rig);

// --- Verden og stationer ---------------------------------------------------------
const world = buildEduba(scene);
const stations = { ...world.stations, fold: buildFold(scene, world), marked: buildMarket(scene, world), mark: buildField(scene, world) };

const interaction = createInteraction({ renderer, camera, rig, dom: renderer.domElement });
const controls = createDesktopControls({ camera, renderer, dom: renderer.domElement, bounds: stations.gaard.bounds });
const fade = createFade(camera);

function moveTo(station) {
  rig.position.copy(station.position);
  rig.rotation.y = station.yaw;
  controls.setStation(station);
  world.setLights(station.lights);   // to af de fire PointLights følger med til stationen
}

// --- Baner (rækkefølgen her er forløbets rækkefølge) ---------------------------------
const levels = new LevelManager({ scene, camera, interaction, stations, fade, moveTo });
levels
  .register({ id: 'hyrde', station: 'fold', Level: HyrdeLevel })
  .register({ id: 'koebmand', station: 'marked', Level: KoebmandLevel })
  .register({ id: 'skriver', station: 'gaard', Level: SkriverLevel })
  .register({ id: 'landmaaler', station: 'mark', Level: LandmaalerLevel });

const hub = new Hub({ scene, interaction, levels });
levels.home();

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
  levels.update(dt);
  world.update(dt, clock.elapsedTime);
  renderer.render(scene, camera);
});

// Til fejlsøgning og test i konsollen, fx  __babylon.levels.open('hyrde')
//   __babylon.levels.timeScale = 6   spoler den aktive bane hurtigere frem
//   __babylon.level('hyrde')         giver bane-objektet
window.__babylon = {
  scene, camera, rig, renderer, levels, hub, stations, controls, interaction,
  level: (id) => levels.instances.get(id)?.level,
};
