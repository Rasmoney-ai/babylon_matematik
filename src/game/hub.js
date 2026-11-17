// Banevælgeren i gården: en lerbrik pr. bane på skriverbordets forkant.
// Ikke-byggede baner er dæmpede ("kommer snart"); gennemførte baner har et segl.
// Når alle baner er gennemført, skifter velkomsten til en afslutningstekst, og første gang
// lyser brikkerne op én efter én. En lille FORFRA-brik under tekstpladen nulstiller fremdriften.
import * as THREE from 'three';
import { createLabelToken } from '../objects/tablets.js';
import { LEVEL_TITLES, BUTTONS } from './lines.js';
import { sfx, audioContext } from '../core/sound.js';

export class Hub {
  constructor({ scene, interaction, levels }) {
    this.levels = levels;
    const st = levels.stations.gaard;
    this.group = new THREE.Group();
    this.group.position.copy(st.position);
    this.group.rotation.y = st.yaw;
    scene.add(this.group);

    const defs = levels.defs;
    const w = 0.255, gap = 0.035;
    const x0 = -((defs.length - 1) * (w + gap)) / 2;
    this.tokens = defs.map((def, i) => {
      const t = createLabelToken(40 + i, w, 0.125);
      t.group.position.copy(st.anchors.hub).add(new THREE.Vector3(x0 + i * (w + gap), 0, 0));
      t.group.rotation.x = st.anchors.buttonTilt ?? -1.05;
      this.group.add(t.group);
      interaction.add(t.group, {
        onSelect: () => this.pick(def),
        onHover: (on) => { if (levels.isBuilt(def.id)) t.setHover(on); },
      });
      return { def, token: t };
    });
    levels.onHome = () => this.show();
    levels.onLeaveHome = () => this.hide();
    this.timers = [];

    // FORFRA: lille, mørk brik under tekstpladens højre hjørne (som "forlad"-brikken til venstre).
    // Kræver to tryk, så den ikke trykkes ved et uheld. Vises kun i gården, når noget er gennemført.
    const ui = levels.ui('gaard');
    const r = createLabelToken(34, 0.26, 0.095);
    r.setText(BUTTONS.forfra);
    r.body.material.color.set('#7d5a3c');
    r.group.position.set(0.42, -0.31 - 0.1, 0);
    const cordMat = new THREE.MeshBasicMaterial({ color: '#2a1a0e' });
    [-0.09, 0.09].forEach((dx) => {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.05, 4), cordMat);
      cord.position.set(dx, 0.07, -0.01);
      cord.raycast = () => {};
      r.group.add(cord);
    });
    r.group.visible = false;
    ui.panel.group.add(r.group);
    interaction.add(r.group, { onSelect: () => this.pressRestart(), onHover: (on) => r.setHover(on) });
    this.restart = r;
    this.restartArmed = null;
  }

  pressRestart() {
    if (this.levels.busy || this.levels.active) return;
    audioContext(); sfx.tap();
    if (this.restartArmed) {
      clearTimeout(this.restartArmed);
      this.disarmRestart();
      this.levels.resetProgress();
      this.show();
      return;
    }
    this.restart.setText(BUTTONS.forladIgen);
    this.restart.face.material.emissive.set(0x663311);
    this.restartArmed = setTimeout(() => this.disarmRestart(), 4000);
  }

  disarmRestart() {
    this.restartArmed = null;
    this.restart.setText(BUTTONS.forfra);
    this.restart.face.material.emissive.set(0x000000);
  }

  refresh() {
    for (const { def, token } of this.tokens) {
      const built = this.levels.isBuilt(def.id);
      token.setLabel({
        title: LEVEL_TITLES[def.id] || def.id,
        sub: built ? '' : BUTTONS.kommerSnart,
        done: this.levels.isDone(def.id),
      });
      token.setDim(!built);
      token.setHover(false);
    }
  }

  show() {
    this.refresh();
    this.group.visible = true;
    this.restart.group.visible = this.levels.done.size > 0;
    if (this.levels.allDone()) {
      this.levels.say('gaard', 'gaard_alle_faerdige');
      if (!this.levels.celebrated) { this.levels.markCelebrated(); this.celebrate(); }
    } else {
      this.levels.say('gaard', 'gaard_velkommen');
    }
  }

  /** Lille, rolig fejring: brikkerne lyser op én efter én, og en fanfare til sidst. */
  celebrate() {
    this.stopCelebration();
    const later = (ms, fn) => this.timers.push(setTimeout(fn, ms));
    this.tokens.forEach(({ token }, i) => {
      later(600 + i * 450, () => {
        token.face.material.emissive.set(0x6a4a18);
        token.group.scale.setScalar(1.08);
        sfx.pair(i * 4);
      });
    });
    const end = 600 + this.tokens.length * 450;
    later(end, () => sfx.finish());
    later(end + 2600, () => this.tokens.forEach(({ token }) => token.setHover(false)));
  }

  stopCelebration() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  hide() {
    this.stopCelebration();
    this.tokens.forEach(({ token }) => token.setHover(false));
    this.group.visible = false;
    this.restart.group.visible = false;
    if (this.restartArmed) { clearTimeout(this.restartArmed); this.disarmRestart(); }
  }

  pick(def) {
    audioContext();
    if (!this.levels.isBuilt(def.id)) {
      sfx.wrong();
      this.levels.say('gaard', 'gaard_kommer_snart');
      return;
    }
    sfx.tap();
    this.levels.open(def.id);
  }
}
