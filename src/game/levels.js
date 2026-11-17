// Bane-manager: én verden, flere stationer, én aktiv bane ad gangen.
//
// En bane registreres med  { id, station, Level }  hvor Level er en klasse med
// start(), stop() og update(dt). Level = null betyder "ikke bygget endnu" (vises dæmpet).
// Rækkefølgen af register() er banernes rækkefølge (bruges til NÆSTE).
//
// Hver bane får en rod-gruppe, der sidder på sin stations position og retning, så banen
// kan bygge alt i stationens lokale koordinater. Når banen ikke er aktiv, skjules roden,
// og så kan dens objekter heller ikke vælges (interaction tjekker synlighed).
import * as THREE from 'three';
import { createPanel, createLabelToken } from '../objects/tablets.js';
import { LINES, BUTTONS } from './lines.js';
import { speak, sfx, audioContext } from '../core/sound.js';

const STORAGE_KEY = 'babylon.fremdrift.v1';

function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return new Set(Array.isArray(data.done) ? data.done : []);
  } catch { return new Set(); }
}
function saveProgress(done) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ done: [...done] })); } catch { /* fx privat browsing */ }
}

export class LevelManager {
  /**
   * stations: { id: { position, yaw, bounds, view, lights, anchors:{ panel, panelYaw?, buttons, buttonTilt? } } }
   * moveTo(station): flytter rig/kamera/lys til stationen (kaldes mens skærmen er sort).
   */
  constructor({ scene, camera, interaction, stations, fade, moveTo }) {
    Object.assign(this, { scene, camera, interaction, stations, fade, moveTo });
    this.defs = [];
    this.instances = new Map();   // id -> { level, root }
    this.uis = new Map();         // station-id -> { group, panel, next, home }
    this.done = loadProgress();
    this.active = null;           // { def, level, root }
    this.stationId = null;
    this.timeScale = 1;           // til test: > 1 spoler banen hurtigere frem
    this.onHome = null;           // sættes af banevælgeren
    this.busy = false;
  }

  register(def) { this.defs.push(def); return this; }
  def(id) { return this.defs.find((d) => d.id === id); }
  isBuilt(id) { return !!this.def(id)?.Level; }
  isDone(id) { return this.done.has(id); }
  nextOf(id) { const i = this.defs.findIndex((d) => d.id === id); return this.defs[i + 1] || null; }

  /** Stationens tekstplade og slut-knapper (deles af banevælger og baner på samme station). */
  ui(stationId) {
    if (this.uis.has(stationId)) return this.uis.get(stationId);
    const st = this.stations[stationId];
    const group = new THREE.Group();
    group.position.copy(st.position);
    group.rotation.y = st.yaw;
    this.scene.add(group);

    const panel = createPanel();
    panel.group.position.copy(st.anchors.panel);
    panel.group.rotation.y = st.anchors.panelYaw || 0;
    panel.group.scale.setScalar(st.anchors.panelScale || 1);
    group.add(panel.group);

    const mkButton = (text, dx, seed, onSelect) => {
      const b = createLabelToken(seed, 0.27, 0.12);
      b.setText(text);
      b.group.position.copy(st.anchors.buttons).add(new THREE.Vector3(dx, 0, 0));
      b.group.rotation.x = st.anchors.buttonTilt ?? -1.05;
      b.group.visible = false;
      group.add(b.group);
      this.interaction.add(b.group, {
        onSelect: () => { if (this.busy) return; audioContext(); sfx.tap(); onSelect(); },
        onHover: (on) => b.setHover(on),
      });
      return b;
    };
    const ui = { group, panel };
    ui.next = mkButton(BUTTONS.naeste, 0.36, 31, () => { const n = this.nextOf(this.active?.def.id); if (n) this.open(n.id); });
    ui.home = mkButton(BUTTONS.gaarden, -0.36, 32, () => this.home());

    // Lille "forlad banen"-brik, der hænger under tekstpladens venstre hjørne.
    // Den sidder langt fra banens egne brikker på bordet, er mindre og mørkere, og den
    // kræver to tryk, så den ikke trykkes ved et uheld. Vises kun, mens en bane er i gang.
    const leave = createLabelToken(33, 0.34, 0.095);
    leave.setText(BUTTONS.forlad);
    leave.body.material.color.set('#7d5a3c');
    leave.group.position.set(-0.42, -0.31 - 0.1, 0);
    const cordMat = new THREE.MeshBasicMaterial({ color: '#2a1a0e' });
    [-0.13, 0.13].forEach((dx) => {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.05, 4), cordMat);
      cord.position.set(dx, 0.07, -0.01);
      cord.raycast = () => {};
      leave.group.add(cord);
    });
    leave.group.visible = false;
    panel.group.add(leave.group);
    this.interaction.add(leave.group, {
      onSelect: () => this.pressLeave(ui),
      onHover: (on) => leave.setHover(on),
    });
    ui.leave = leave;
    ui.leaveArmed = 0;          // > 0: sekunder tilbage, hvor et tryk mere sender eleven hjem
    this.uis.set(stationId, ui);
    return ui;
  }

  /** Første tryk på "forlad"-brikken beder om et tryk mere; andet tryk går til gården. */
  pressLeave(ui) {
    if (this.busy || !this.active) return;
    audioContext(); sfx.tap();
    if (ui.leaveArmed > 0) { this.disarmLeave(ui); this.home(); return; }
    ui.leaveArmed = 4;
    ui.leave.setText(BUTTONS.forladIgen);
    ui.leave.face.material.emissive.set(0x663311);
  }

  disarmLeave(ui) {
    ui.leaveArmed = 0;
    ui.leave.setText(BUTTONS.forlad);
    ui.leave.face.material.emissive.set(0x000000);
  }

  /** Vis en replik på en stations tekstplade og afspil lydfilen, hvis den findes. */
  say(stationId, id, extraText = '', footer = '') {
    const l = LINES[id];
    if (!l) throw new Error(`Ukendt replik: ${id}`);
    const body = [l.text, extraText].filter(Boolean).join(' ');
    this.ui(stationId).panel.setText(l.title, body, footer);
    speak(id);
  }

  async goStation(id) {
    if (this.stationId === id) return;
    const st = this.stations[id];
    this.ui(id);
    if (this.stationId === null) { this.moveTo(st); this.stationId = id; return; }
    this.busy = true;
    this.interaction.setEnabled(false);
    await this.fade.to(1, 0.35);
    this.moveTo(st);
    this.stationId = id;
    await this.fade.to(0, 0.45);
    this.interaction.setEnabled(true);
    this.busy = false;
  }

  /** Fade til sort med en billedtekst, kør `during()` i mørket og fade tilbage. */
  async blackout(text, during, hold = 1.2) {
    this.interaction.setEnabled(false);
    await this.fade.to(1, 0.5, text);
    await during?.();
    await new Promise((r) => setTimeout(r, (hold * 1000) / Math.max(1, this.timeScale)));
    await this.fade.to(0, 0.6);
    this.interaction.setEnabled(true);
  }

  instance(def) {
    if (this.instances.has(def.id)) return this.instances.get(def.id);
    const st = this.stations[def.station];
    const root = new THREE.Group();
    root.position.copy(st.position);
    root.rotation.y = st.yaw;
    root.visible = false;
    this.scene.add(root);
    const ctx = {
      scene: this.scene,
      camera: this.camera,
      interaction: this.interaction,
      station: st,
      root,
      panel: this.ui(def.station).panel,
      say: (id, extra, footer) => this.say(def.station, id, extra, footer),
      blackout: (text, during, hold) => this.blackout(text, during, hold),
      complete: () => this.complete(def.id),
      manager: this,
    };
    const entry = { level: new def.Level(ctx), root };
    this.instances.set(def.id, entry);
    return entry;
  }

  stopActive() {
    if (!this.active) return;
    this.active.level.stop();
    this.active.root.visible = false;
    this.active = null;
  }

  hideButtons(stationId) {
    const ui = this.uis.get(stationId);
    if (ui) { ui.next.group.visible = false; ui.home.group.visible = false; }
  }

  async open(id) {
    const def = this.def(id);
    if (!def?.Level || this.busy) return false;
    this.stopActive();
    this.hideButtons(this.stationId);
    this.onLeaveHome?.();
    await this.goStation(def.station);
    const entry = this.instance(def);
    this.hideButtons(def.station);
    entry.root.visible = true;
    this.active = { def, ...entry };
    entry.level.start();
    return true;
  }

  async home() {
    if (this.busy) return;
    this.stopActive();
    this.hideButtons(this.stationId);
    await this.goStation('gaard');
    this.onHome?.();
  }

  /** Kaldes af banen, når den er gennemført. */
  complete(id) {
    this.done.add(id);
    saveProgress(this.done);
    const def = this.def(id);
    const ui = this.ui(def.station);
    const next = this.nextOf(id);
    ui.home.group.visible = true;
    ui.next.group.visible = !!next?.Level;
  }

  update(dt) {
    this.fade.update(dt);
    // "Forlad"-brikken: kun på den aktive banes station, og ikke når slut-knapperne vises
    for (const [id, ui] of this.uis) {
      const on = !!this.active && this.active.def.station === id && !ui.home.group.visible && !this.busy;
      ui.leave.group.visible = on;
      if (ui.leaveArmed > 0) {
        ui.leaveArmed -= dt;
        if (ui.leaveArmed <= 0 || !on) this.disarmLeave(ui);
      }
    }
    this.active?.level.update(dt * this.timeScale);
  }
}
