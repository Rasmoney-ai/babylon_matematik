// Banevælgeren i gården: en lerbrik pr. bane på skriverbordets forkant.
// Ikke-byggede baner er dæmpede ("kommer snart"); gennemførte baner har et segl.
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
    this.levels.say('gaard', 'gaard_velkommen');
  }

  hide() { this.group.visible = false; }

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
