// Bane 1: "Læs tavlen" – eleven læser et kileskrift-tal og vælger det rigtige arabertal.
import { createQuestionTablet, createToken, createPanel } from '../objects/tablets.js';
import { PLAN, makeQuestion, explain } from './questions.js';
import { LINES, STAGE_INTRO, STAGE_HINT, PRAISE } from './lines.js';
import { sfx, speak, audioContext } from '../core/sound.js';

export class Level1 {
  constructor({ scene, interaction, anchors }) {
    this.interaction = interaction;
    this.anims = [];

    // Tekstplade
    this.panel = createPanel();
    this.panel.group.position.copy(anchors.panel);
    scene.add(this.panel.group);

    // Opgavetavle, lænet let bagover på stativet
    this.tablet = createQuestionTablet();
    this.tablet.group.position.copy(anchors.question);
    this.tablet.group.rotation.x = -0.32;
    scene.add(this.tablet.group);

    // Tre svarbrikker liggende skråt på bordet
    this.tokens = [-0.27, 0, 0.27].map((dx, i) => {
      const t = createToken(i + 5);
      t.group.position.set(anchors.tokens.x + dx, anchors.tokens.y, anchors.tokens.z);
      t.group.rotation.x = -1.05;
      t.group.visible = false;
      scene.add(t.group);
      interaction.add(t.group, {
        onSelect: () => this.choose(i),
        onHover: (on) => { if (!this.locked && !t.used) t.setHover(on); },
      });
      return t;
    });

    // Start/igen-knap: en brik midt på bordet
    this.startBtn = createToken(21);
    this.startBtn.group.position.set(anchors.tokens.x, anchors.tokens.y, anchors.tokens.z);
    this.startBtn.group.rotation.x = -1.05;
    this.startBtn.group.scale.setScalar(1.3);
    this.startBtn.setText('BEGYND');
    scene.add(this.startBtn.group);
    interaction.add(this.startBtn.group, {
      onSelect: () => { audioContext(); sfx.tap(); this.start(); },
      onHover: (on) => this.startBtn.setHover(on),
    });

    this.say('velkommen');
  }

  say(id, extraText = '', footer = '') {
    const l = LINES[id];
    const body = [l.text, extraText].filter(Boolean).join(' ');
    this.panel.setText(l.title, body, footer);
    speak(id);
  }

  progress() { return `Tavle ${this.round + 1} af ${PLAN.length}`; }

  start() {
    this.round = 0;
    this.seenStages = new Set();
    this.startBtn.group.visible = false;
    this.tokens.forEach((t) => { t.group.visible = true; });
    this.ask();
  }

  ask() {
    const stage = PLAN[this.round];
    this.q = makeQuestion(stage);
    this.mistakes = 0;
    this.locked = false;
    this.tablet.show(this.q.digits);
    this.tokens.forEach((t, i) => {
      t.used = false; t.setDim(false); t.setHover(false);
      t.setText(this.q.options[i]);
    });
    const intro = STAGE_INTRO[stage];
    if (intro && !this.seenStages.has(stage)) {
      this.seenStages.add(stage);
      this.say(intro, '', this.progress());
    } else {
      this.panel.setText('Hvilket tal står der?', 'Læs tavlen og peg på det rigtige tal.', this.progress());
    }
    this.pulse(this.tablet.group, 0.06);
  }

  choose(i) {
    if (this.locked || !this.q) return;
    const t = this.tokens[i];
    if (t.used) return;
    const value = this.q.options[i];

    if (value === this.q.answer) {
      this.locked = true;
      sfx.correct();
      this.tokens.forEach((o, k) => { if (k !== i) o.setDim(true); });
      this.glow(t);
      const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
      this.say(praise, explain(this.q), this.progress());
      setTimeout(() => this.next(), 3200);
    } else {
      sfx.wrong();
      t.used = true; t.setDim(true); t.setHover(false);
      this.shake(t.group);
      this.mistakes++;
      this.say(STAGE_HINT[this.q.stage], '', this.progress());
    }
  }

  next() {
    this.round++;
    if (this.round >= PLAN.length) return this.finish();
    this.ask();
  }

  finish() {
    sfx.finish();
    this.q = null;
    this.tokens.forEach((t) => { t.group.visible = false; });
    this.tablet.blank();
    this.say('faerdig');
    this.startBtn.setText('IGEN');
    this.startBtn.group.visible = true;
  }

  // --- Små animationer -------------------------------------------------------
  shake(obj) {
    const x0 = obj.position.x;
    this.anims.push({ t: 0, dur: 0.4, step: (k) => { obj.position.x = x0 + Math.sin(k * 40) * 0.012 * (1 - k); }, end: () => { obj.position.x = x0; } });
  }
  pulse(obj, amount) {
    this.anims.push({ t: 0, dur: 0.5, step: (k) => obj.scale.setScalar(1 + Math.sin(k * Math.PI) * amount), end: () => obj.scale.setScalar(1) });
  }
  glow(token) {
    const m = token.face.material;
    this.anims.push({ t: 0, dur: 1.6, step: (k) => m.emissive.setRGB(0.55 * (1 - k), 0.42 * (1 - k), 0.1 * (1 - k)), end: () => m.emissive.set(0) });
    this.pulse(token.group, 0.15);
  }

  update(dt) {
    this.anims = this.anims.filter((a) => {
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      a.step(k);
      if (k >= 1) { a.end?.(); return false; }
      return true;
    });
  }
}
