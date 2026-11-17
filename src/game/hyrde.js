// Bane 1: Hyrden – hvorfor tæller vi?
// Fårene kommer hjem, og der findes ingen tal. Eleven lægger én lerkugle i krukken for hvert får
// og opdager næste aften, at kuglen der bliver til overs, er fåret der mangler.
//
// VIGTIGT: I denne bane vises ingen tal eller cifre nogen steder – heller ikke i tekst.
// Antallene findes kun internt i logikken (src/math/oneToOne.js).
import * as THREE from 'three';
import { BUTTONS, LINES } from './lines.js';
import { sfx, audioContext } from '../core/sound.js';
import { createSheep } from '../objects/sheep.js';
import { createCountJar, createStoneBowl, stoneGeo, stoneMat } from '../objects/pottery.js';
import { createLabelToken } from '../objects/tablets.js';
import { pairUp, pairItems, settleEveningTwo, arrivalTimes } from '../math/oneToOne.js';
import { Tweens } from './tweens.js';

const HERD = 12;          // fårene i flokken (kun i logikken)
const BOWL_START = 18;    // kugler i skålen fra start – flere end får, så eleven kan lave fejl
const WALK = 1.15;        // m/s
const GAP = 3.0;          // sekunder mellem fårene
const CANCEL = Symbol('banen blev stoppet');

const lerpAngle = (a, b, k) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
};

export class HyrdeLevel {
  constructor(ctx) {
    this.ctx = ctx;
    this.A = ctx.station.anchors;
    this.gate = ctx.station.gate;
    this.tw = new Tweens();
    this.run = 0;
    const root = ctx.root, A = this.A;

    // Krukke og skål på den lave mur
    this.jar = createCountJar();
    this.jar.group.position.copy(A.jar);
    this.jar.group.scale.setScalar(0.95);
    root.add(this.jar.group);
    this.bowl = createStoneBowl(26);
    this.bowl.group.position.copy(A.bowl);
    root.add(this.bowl.group);
    ctx.interaction.add(this.jar.group, { onSelect: () => this.tapJar(), onHover: (on) => { this.hoverOn = on ? 'jar' : null; } });
    ctx.interaction.add(this.bowl.group, { onSelect: () => this.tapBowl(), onHover: (on) => { this.hoverOn = on ? 'bowl' : null; } });

    // Flyvende kugler (fra skål til krukke og tilbage)
    this.flyers = Array.from({ length: 8 }, () => {
      const m = new THREE.Mesh(stoneGeo, stoneMat); m.visible = false; root.add(m); return m;
    });
    // Lysende kugler til parringen: store nok til at kunne ses over fårene i folden
    const glowGeo = new THREE.IcosahedronGeometry(0.075, 1);
    this.glowMat = new THREE.MeshStandardMaterial({ color: '#f0c48c', emissive: '#ff9d45', emissiveIntensity: 0.85, roughness: 0.6, flatShading: true });
    this.extraMat = new THREE.MeshStandardMaterial({ color: '#ff8a6a', emissive: '#e8402a', emissiveIntensity: 0.9, roughness: 0.6, flatShading: true });
    this.balls = Array.from({ length: 22 }, () => {
      const m = new THREE.Mesh(glowGeo, this.glowMat); m.visible = false; m.userData.base = new THREE.Vector3(); root.add(m); return m;
    });

    // Får
    this.sheep = Array.from({ length: HERD }, (_, i) => {
      const s = createSheep(i);
      s.idx = i;
      s.path = []; s.moving = false; s.speed = WALK; s.restYaw = 0;
      root.add(s.group);
      return s;
    });
    // Det får, der bliver væk, skal kunne vælges (kun mens eleven leder)
    this.onSheep = { onSelect: (o) => this.tapSheep(o), onHover: () => {} };

    // Én knap-brik på muren (HVAD GØR VI?, VIDERE …)
    this.btn = createLabelToken(51, 0.36, 0.12);
    this.btn.group.position.copy(A.buttons);
    this.btn.group.rotation.x = A.buttonTilt;
    this.btn.group.visible = false;
    root.add(this.btn.group);
    ctx.interaction.add(this.btn.group, { onSelect: () => this.pressButton(), onHover: (on) => this.btn.setHover(on) });

    this.reset();
  }

  // --- Livscyklus --------------------------------------------------------------
  start() {
    this.run++;
    this.reset();
    this.main().catch((e) => { if (e !== CANCEL) console.error(e); });
  }

  stop() {
    this.run++;
    this.tw.clear();
    this.btnResolve = null;
    this.btn.group.visible = false;
    this.bleating = false;
    this.ctx.interaction.remove(this.missing?.hit);
  }

  reset() {
    this.tw.clear();
    this.target = null;
    this.jarCount = 0;
    this.removed = 0;
    this.inside = 0;
    this.homeOrder = [];
    this.fixQueue = null;
    this.bleating = false;
    this.missing = null;
    this.found = false;
    this.phase = 'start';
    this.bowl.setCount(BOWL_START);
    this.gate.set(0);
    this.flyers.forEach((f) => { f.visible = false; });
    this.hideBalls();
    this.sheep.forEach((s, i) => this.toFlock(s, i));
    this.btn.group.visible = false;
  }

  // --- Hjælpere til forløbet -------------------------------------------------------
  async w(sec) {
    const r = this.run;
    await this.tw.wait(sec);
    if (r !== this.run) throw CANCEL;
  }
  async until(pred) { while (!pred()) await this.w(0.1); }
  say(id) { this.ctx.say(id); }

  async button(text) {
    const r = this.run;
    this.btn.setText(text);
    this.btn.setHover(false);
    this.btn.group.visible = true;
    await new Promise((res) => { this.btnResolve = res; });
    this.btn.group.visible = false;
    if (r !== this.run) throw CANCEL;
  }
  pressButton() {
    if (!this.btnResolve) return;
    audioContext(); sfx.tap();
    const r = this.btnResolve; this.btnResolve = null; r();
  }

  async blackout(text, during) {
    const r = this.run;
    await this.ctx.blackout(text, during);
    if (r !== this.run) throw CANCEL;
  }

  // --- Hele banen ------------------------------------------------------------------
  async main() {
    this.say('hyrde_problem');
    sfx.bleat(-0.6, 1.05, 0.12);
    await this.button(BUTTONS.hvad);
    this.say('hyrde_metode');
    await this.button(BUTTONS.lukInd);

    let gap = GAP;
    while (!(await this.eveningOne(gap))) {
      await this.blackout(null, () => this.resetEveningOne());
      gap = Math.min(gap * 1.3, 4.6);
      this.say('hyrde_igen');
      await this.button(BUTTONS.lukInd);
    }

    await this.blackout(LINES.hyrde_naeste_aften.title, () => this.setupEveningTwo());
    this.say('hyrde_aften2');
    await this.button(BUTTONS.lukInd);
    await this.eveningTwo();
    await this.findMissing();
    await this.ending();
  }

  // Aften 1: én kugle i krukken for hvert får, der går ind
  async eveningOne(gap) {
    this.phase = 'aften1';
    this.say('hyrde_aften1');
    this.jarCount = 0;
    this.inside = 0;
    this.homeOrder = [];
    this.bowl.setCount(BOWL_START);
    const order = this.departOrder(this.sheep);
    this.letIn(order, gap);
    this.target = 'bowl';
    await this.until(() => this.inside >= order.length);
    await this.w(2.2);
    this.target = null;
    this.closeGate();
    await this.w(0.7);

    this.phase = 'parring1';
    this.say('hyrde_parring');
    const home = this.homeOrder.map((i) => this.sheep[i]);
    const res = pairUp(this.jarCount, home.length);
    await this.showPairing(this.jarCount, home, this.jarMouth());
    await this.w(0.6);
    if (res.match) {
      sfx.correct();
      this.say('hyrde_parring_ok');
      await this.button(BUTTONS.videre);
      await this.collectBalls(this.jarMouth());
      return true;
    }
    sfx.wrong();
    this.say(res.extraStones > 0 ? 'hyrde_for_mange' : 'hyrde_for_faa');
    await this.button(BUTTONS.proevIgen);
    return false;
  }

  resetEveningOne() {
    this.hideBalls();
    this.jarCount = 0;
    this.bowl.setCount(BOWL_START);
    this.gate.set(0);
    this.sheep.forEach((s, i) => this.toFlock(s, i));
  }

  setupEveningTwo() {
    this.hideBalls();
    this.gate.set(0);
    // Det får, der kom sidst ind i går, bliver væk i aften
    this.missing = this.sheep[this.homeOrder[this.homeOrder.length - 1]];
    this.sheep.forEach((s, i) => this.toFlock(s, i));
    const m = this.missing;
    m.group.position.copy(this.A.hide);
    m.group.rotation.y = m.restYaw = -2.2;
  }

  // Aften 2: én kugle OP af krukken for hvert får
  async eveningTwo() {
    this.phase = 'aften2';
    this.say('hyrde_aften2_gang');
    this.removed = 0;
    this.inside = 0;
    this.homeOrder = [];
    const herd = this.sheep.filter((s) => s !== this.missing);
    const order = this.departOrder(herd);
    this.letIn(order, GAP);
    this.target = 'jar';
    await this.until(() => this.inside >= order.length);
    await this.w(2.2);
    this.target = null;
    this.closeGate();
    await this.w(0.7);

    const home = this.homeOrder.map((i) => this.sheep[i]);
    const r = settleEveningTwo(HERD, home.length, this.removed);
    if (r.ok) return;

    // Noget passer ikke: par kuglerne i skålen (taget op i aften) med fårene i folden
    this.phase = 'parring2';
    this.say('hyrde_parring');
    const p = await this.showPairing(this.removed, home, this.bowlTop());
    await this.w(1.0);
    if (r.putBack > 0) {
      this.say('hyrde_aften2_for_mange');
      await this.w(2.8);
      for (const ball of p.extraBalls) {
        this.flyBall(ball, this.jarMouth(), 0.6, () => { ball.visible = false; sfx.plop(); });
        this.bowl.setCount(this.bowl.count - 1);
        this.jarCount++; this.removed--;
        await this.w(0.55);
      }
      await this.w(0.8);
    }
    if (r.takeMore > 0) {
      this.say('hyrde_aften2_for_faa');
      this.fixQueue = p.lonely.slice();
      this.target = 'jar';
      await this.until(() => this.fixQueue.length === 0);
      this.target = null;
      this.fixQueue = null;
      await this.w(0.8);
    }
    sfx.correct();
    await this.w(1.2);
    await this.collectBalls(this.bowlTop());
  }

  // Kuglen til overs = fåret der mangler
  async findMissing() {
    this.phase = 'mangler';
    this.say('hyrde_mangler');
    // Den sidste kugle løftes op af krukken og bliver hængende uden et får
    const ball = this.balls[0];
    ball.material = this.glowMat;
    ball.visible = true;
    ball.position.copy(this.jarMouth());
    ball.scale.setScalar(0.2);
    this.flyBall(ball, this.jarMouth().add(new THREE.Vector3(0, 0.11, 0)), 0.9, null, 0.4);
    await this.w(1.6);

    this.found = false;
    this.ctx.interaction.add(this.missing.hit, this.onSheep);
    this.bleating = true;
    this.bleatTimer = 0.5;
    let waited = 0, hinted = false;
    while (!this.found) {
      await this.w(0.25);
      waited += 0.25;
      if (!hinted && waited > 18) { hinted = true; this.say('hyrde_lyt_hint'); }
    }
    this.ctx.interaction.remove(this.missing.hit);
    this.bleating = false;

    this.phase = 'hjem';
    this.say('hyrde_fundet');
    const m = this.missing;
    this.openGate();
    this.walk(m, [this.A.hideExit, this.A.gateOut, this.A.gateIn, this.A.slots[HERD - 1]], 2.1, (k) => { if (k === 2) this.inside++; });
    const before = this.inside;
    await this.until(() => this.inside > before);
    await this.w(1.4);
    this.closeGate();
    // Kuglen finder sit får
    sfx.pair(0);
    this.flyBall(ball, this.above(m), 1.1);
    await this.w(1.3);

    this.phase = 'sidste';
    this.target = 'jar';
    await this.until(() => this.jarCount === 0);
    this.target = null;
    await this.w(0.6);
    this.hideBalls();
    sfx.finish();
  }

  async ending() {
    this.phase = 'slut';
    this.say('hyrde_pointe');
    await this.button(BUTTONS.videre);
    this.say('hyrde_spor');
    await this.button(BUTTONS.videre);
    this.say('hyrde_bro');
    this.phase = 'faerdig';
    this.ctx.complete();
  }

  // --- Får ---------------------------------------------------------------------
  toFlock(s, i) {
    const p = this.A.flock[i];
    s.group.position.copy(p);
    s.restYaw = Math.PI / 2 + Math.sin(i * 2.1) * 0.6;   // kigger mod lågen
    s.group.rotation.y = s.restYaw;
    s.path = []; s.moving = false; s.done = null;
    s.ring.visible = false;
    s.group.visible = true;
  }

  /** De nærmeste går først, så ingen overhaler hinanden på stien. */
  departOrder(list) {
    const g = this.A.gateOut;
    return list.slice().sort((a, b) => a.group.position.distanceTo(g) - b.group.position.distanceTo(g));
  }

  letIn(order, gap) {
    this.openGate();
    const times = arrivalTimes(order.length, gap, { first: 0.4 });
    order.forEach((s, k) => {
      this.tw.add(times[k], null, () => {
        const slot = this.A.slots[k];
        s.restYaw = Math.sin(s.idx * 1.7) * 0.6;          // vender ud mod eleven i folden
        this.walk(s, [this.A.gateOut, this.A.gateIn, slot], WALK, (i) => {
          if (i === 1) { this.inside++; this.homeOrder.push(s.idx); }
        });
      });
    });
  }

  walk(s, points, speed, onPoint) {
    s.path = points.map((p) => p.clone());
    s.pointIndex = 0;
    s.speed = speed;
    s.onPoint = onPoint;
    s.moving = true;
  }

  openGate() { const g = this.gate, k0 = g.open; this.tw.add(0.8, (k) => g.set(k0 + (1 - k0) * k)); }
  closeGate() { const g = this.gate, k0 = g.open; this.tw.add(0.8, (k) => g.set(k0 * (1 - k))); }

  tapSheep(o) {
    if (this.phase !== 'mangler' || !this.missing || o !== this.missing.hit || this.found) return;
    audioContext();
    this.found = true;
    sfx.bleat(this.panTo(this.missing), 1.1);
  }

  panTo(s) {
    const cam = this.ctx.camera;
    const p = s.group.getWorldPosition(new THREE.Vector3());
    const c = cam.getWorldPosition(new THREE.Vector3());
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));
    return p.sub(c).normalize().dot(right);
  }

  // --- Krukke og skål ----------------------------------------------------------------
  jarMouth() {
    return this.jar.mouth.clone().multiplyScalar(this.jar.group.scale.x).add(this.jar.group.position);
  }
  bowlTop() { return this.bowl.topSlot().add(this.bowl.group.position); }

  tapBowl() {
    audioContext();
    if (this.target !== 'bowl' || this.bowl.count === 0) { this.nudge(this.bowl.group); return; }
    const from = this.bowlTop();
    this.bowl.setCount(this.bowl.count - 1);
    this.jarCount++;
    sfx.clink();
    this.flyStone(from, this.jarMouth(), () => sfx.plop());
  }

  tapJar() {
    audioContext();
    if (this.target !== 'jar' || this.jarCount === 0) { this.nudge(this.jar.group); return; }
    this.jarCount--;
    this.removed++;
    sfx.clink();
    const to = this.bowl.topSlot().add(new THREE.Vector3(0, 0.04, 0)).add(this.bowl.group.position);
    this.flyStone(this.jarMouth(), to, () => { this.bowl.setCount(this.bowl.count + 1); sfx.plop(); });
    // Under rettelsen: en lysende kugle finder et af fårene uden kugle
    if (this.fixQueue?.length) {
      const s = this.fixQueue.shift();
      const ball = this.balls.find((b) => !b.visible);
      if (ball) {
        ball.material = this.glowMat; ball.visible = true; ball.scale.setScalar(0.3);
        ball.position.copy(this.jarMouth());
        this.flyBall(ball, this.above(s), 0.7, () => { s.ring.visible = false; sfx.pair(2); });
      }
    }
  }

  nudge(obj) {
    const x0 = obj.position.x;
    this.tw.add(0.35, (k) => { obj.position.x = x0 + Math.sin(k * 30) * 0.008 * (1 - k); }, () => { obj.position.x = x0; });
  }

  flyStone(from, to, onLand) {
    const m = this.flyers.find((f) => !f.visible) || this.flyers[0];
    m.visible = true;
    const a = from.clone(), b = to.clone();
    const h = 0.18 + a.distanceTo(b) * 0.2;
    this.tw.add(0.42, (k) => {
      m.position.lerpVectors(a, b, k);
      m.position.y += Math.sin(k * Math.PI) * h;
    }, () => { m.visible = false; onLand?.(); });
  }

  // --- Parring med lysende kugler ------------------------------------------------------
  /** Lige over fårets ryg, så kuglen tydeligt hører til netop det får. */
  above(s) { return s.group.position.clone().add(new THREE.Vector3(0, 0.9, 0)); }

  hideBalls() {
    this.balls.forEach((b) => { b.visible = false; b.userData.hover = false; });
    this.sheep.forEach((s) => { s.ring.visible = false; });
  }

  flyBall(ball, to, dur = 0.65, onLand, endScale = 1) {
    const a = ball.position.clone(), b = to.clone();
    const s0 = ball.scale.x;
    ball.userData.hover = false;
    const h = 0.25 + a.distanceTo(b) * 0.12;
    return this.tw.add(dur, (k) => {
      const e = k * k * (3 - 2 * k);
      ball.position.lerpVectors(a, b, e);
      ball.position.y += Math.sin(e * Math.PI) * h;
      ball.scale.setScalar(s0 + (endScale - s0) * e);
    }, () => { ball.userData.base.copy(b); ball.userData.hover = true; onLand?.(); });
  }

  /** Løft `n` kugler op fra `from` og send dem hen over hvert sit får. Ekstra kugler bliver røde. */
  async showPairing(n, home, from) {
    const balls = this.balls.slice(0, n);
    const { pairs, extraStones, lonelySheep } = pairItems(balls, home);
    let step = 0;
    for (const [ball, s] of pairs) {
      ball.material = this.glowMat;
      ball.visible = true; ball.scale.setScalar(0.3); ball.position.copy(from);
      this.flyBall(ball, this.above(s), 0.65, () => sfx.pair(step++));
      await this.w(0.26);
    }
    extraStones.forEach((ball, e) => {
      ball.material = this.extraMat;
      ball.visible = true; ball.scale.setScalar(0.3); ball.position.copy(from);
      // Kugler uden får lægger sig i en række uden for hegnet, til højre for lågen
      this.flyBall(ball, new THREE.Vector3(0.75 + (e % 5) * 0.3, 0.75 + Math.floor(e / 5) * 0.25, -2.55), 0.7);
    });
    if (extraStones.length) await this.w(0.4);
    await this.w(0.8);
    lonelySheep.forEach((s) => { s.ring.visible = true; this.hop(s); });
    if (lonelySheep.length) sfx.bleat(0, 1.2, 0.12);
    return { extraBalls: extraStones, lonely: lonelySheep };
  }

  async collectBalls(to) {
    for (const ball of this.balls.filter((b) => b.visible)) {
      this.flyBall(ball, to, 0.45, () => { ball.visible = false; });
      await this.w(0.07);
    }
    await this.w(0.5);
    this.sheep.forEach((s) => { s.ring.visible = false; });
  }

  hop(s) {
    const g = s.group;
    this.tw.add(0.5, (k) => { g.position.y = Math.sin(k * Math.PI) * 0.15; }, () => { g.position.y = 0; });
  }

  // --- Hver frame ---------------------------------------------------------------------
  update(dt) {
    this.tw.update(dt);

    for (const s of this.sheep) {
      if (s.moving && s.path.length) {
        const t = s.path[0], p = s.group.position;
        const dx = t.x - p.x, dz = t.z - p.z, dist = Math.hypot(dx, dz), step = s.speed * dt;
        if (dist <= step) {
          p.set(t.x, 0, t.z);
          s.path.shift();
          s.onPoint?.(s.pointIndex++);
          if (!s.path.length) s.moving = false;
        } else {
          p.x += (dx / dist) * step; p.z += (dz / dist) * step;
          s.group.rotation.y = lerpAngle(s.group.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 8));
        }
      } else {
        s.group.rotation.y = lerpAngle(s.group.rotation.y, s.restYaw, Math.min(1, dt * 3));
      }
      s.animate(dt, s.moving, s.speed);
    }

    // Kuglerne svæver roligt, når de er landet
    const t = performance.now() / 1000;
    this.balls.forEach((b, i) => {
      if (b.visible && b.userData.hover) b.position.y = b.userData.base.y + Math.sin(t * 2.4 + i) * 0.03;
    });

    // Den aktive genstand (krukke eller skål) gløder svagt, så eleven ved, hvor der skal peges
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
    for (const [key, obj] of [['jar', this.jar], ['bowl', this.bowl]]) {
      const on = this.target === key;
      const k = on ? 0.05 + 0.06 * pulse + (this.hoverOn === key ? 0.08 : 0) : 0;
      obj.mat.emissive.setRGB(k * 1.0, k * 0.5, k * 0.15);
    }

    // Det forsvundne får bræger med jævne mellemrum (lyden kommer fra den rigtige side)
    if (this.bleating) {
      this.bleatTimer -= dt;
      if (this.bleatTimer <= 0) {
        this.bleatTimer = 3.2 + Math.random() * 1.2;
        sfx.bleat(this.panTo(this.missing), 0.95 + Math.random() * 0.15);
        this.hop(this.missing);
      }
    }
  }
}
