// Bane 4: Landmåleren – reb, omkreds og areal. Matematik kan forudsige, hvad der vil ske.
// Ved en oversvømmet mark ved floden uden for byen.
//
// A  Floden har skyllet markskellene væk. Landmåleren har et reb med knuder (ét skridt mellem hver).
// B  Bondens tavle: 3 skridt bred, 5 lang. Eleven vælger bredde og længde, rebet spændes,
//    eleven sår den forreste række felt for felt og vælger så antallet af rækker → 3 × 5 = 15.
// C  Ét reb på 16 skridt: 1×7, 2×6, 3×5, 4×4 giver 7, 12, 15 og 16 felter. Gæt først: lige meget?
// D  Forudsig: en mark på 5 × 5. Hvor mange felter, FØR vi sår? (20 er rebet, ikke felterne.)
// E  Spor i din verden: samme hegn til en hundegård, og kvadratmeter.
// F  Afslutning på hele rejsen.
import * as THREE from 'three';
import { BUTTONS, LANDMAALER_HINT as HINT, ropeText, fieldText, tryAlsoText } from './lines.js';
import { sfx, audioContext } from '../core/sound.js';
import { createToken, createLabelToken, createQuestionTablet } from '../objects/tablets.js';
import {
  STEP, CELL, createPlot, createStake, createRope, plotCorners, drawShapeTablet, drawFarmerTablet,
  createMiniPen, createDog, createTileFloor,
} from '../objects/survey.js';
import { area, lengthFor, rowTotals, perimeter } from '../math/rectangle.js';
import { triedEnough } from '../math/grouping.js';
import { Tweens } from './tweens.js';

const FARM = { rows: 3, cols: 5 };          // bondens gamle mark
const ROPE = 16;                             // rebet i del C
const SHAPES = [1, 2, 3, 4];                 // bredder, eleven kan vælge i del C
const NEIGHBOUR = { rows: 5, cols: 5 };      // naboens mark i del D
const FARMER_SCALE = 0.55;
const CANCEL = Symbol('banen blev stoppet');

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = (k) => k * k * (3 - 2 * k);

export class LandmaalerLevel {
  constructor(ctx) {
    this.ctx = ctx;
    const A = this.A = ctx.station.anchors;
    const root = ctx.root;
    this.tw = new Tweens();
    this.run = 0;
    const TY = A.tableY, TZ = A.tableZ;
    this.frontZ = TZ + 0.1;
    this.backZ = TZ - 0.12;

    // --- Marken, pælene og rebet (i markens egne koordinater) ---------------------
    this.plot = createPlot(5, 7);
    this.plot.group.position.set(0, A.ground, A.fieldNear);
    root.add(this.plot.group);
    this.plot.cells.forEach((cl) => {
      ctx.interaction.add(cl.hit, {
        onSelect: () => this.tapCell(cl),
        onHover: (on) => this.hoverCell(cl, on),
      });
    });
    this.rope = createRope(24);
    this.plot.group.add(this.rope.group);
    this.stakes = [0, 1, 2, 3].map(() => { const s = createStake(); this.plot.group.add(s); return s; });
    // Pælene ligger i et bundt på stenens venstre ende, før de bliver slået i
    this.stakeHome = [0, 1, 2, 3].map((i) => this.toPlot(V(-0.5, TY + 0.03, TZ - 0.17 + i * 0.065)));

    // --- Bondens tavle (bagerst på stenen) ---------------------------------------
    this.farmer = createQuestionTablet();
    this.farmer.group.scale.setScalar(FARMER_SCALE);
    this.farmer.group.position.set(0.1, TY + 0.03, this.backZ + 0.02);
    this.farmer.group.rotation.x = -1.15;
    this.farmer.redraw((c, w, h) => drawFarmerTablet(c, w, h, { ...FARM, unit: HINT.skridt }));
    root.add(this.farmer.group);

    // --- Oversigten: én lille tavle pr. form (bagerst på stenen) ----------------------
    this.overview = SHAPES.map((w, i) => {
      const t = createLabelToken(70 + i, 0.17, 0.15);
      t.group.position.set(-0.45 + i * 0.25, TY + 0.03, this.backZ);
      t.group.rotation.x = -0.85;
      root.add(t.group);
      t.draw = (best = false) => {
        const l = lengthFor(ROPE, w);
        t.redraw((c, cw, ch) => drawShapeTablet(c, cw, ch, { rows: w, cols: l, label: `${w} × ${l}`, count: area(w, l), seed: 9 + i, best }));
      };
      t.draw();
      return t;
    });

    // --- Talbrikker (forrest på stenen) ---------------------------------------------
    this.tokens = Array.from({ length: 5 }, (_, i) => {
      const t = createToken(80 + i);
      t.group.rotation.x = -1.05;
      root.add(t.group);
      ctx.interaction.add(t.group, {
        onSelect: () => this.pick(t),
        onHover: (on) => { if (!t.used && !this.busy) t.setHover(on); },
      });
      return t;
    });
    // JA / NEJ til gættet i del C
    this.yesNo = [BUTTONS.ja, BUTTONS.nej].map((text, i) => {
      const t = createLabelToken(90 + i, 0.2, 0.12);
      t.setText(text);
      t.answer = i === 0 ? 'ja' : 'nej';
      t.group.position.set(-0.14 + i * 0.28, TY + 0.02, this.frontZ);
      t.group.rotation.x = -1.05;
      root.add(t.group);
      ctx.interaction.add(t.group, {
        onSelect: () => this.guess(t.answer),
        onHover: (on) => t.setHover(on),
      });
      return t;
    });

    // --- Spor i din verden: to små indhegninger med samme hegn, og et lille gulv ---------
    const U = 0.07;
    this.pens = [
      { pen: createMiniPen(4, 4, U), x: -0.36, dog: createDog('#b07a45') },
      { pen: createMiniPen(1, 7, U), x: 0.26, dog: createDog('#8a6a50') },
    ];
    this.pens.forEach((p) => {
      p.pen.position.set(p.x, TY, TZ - 0.02);
      p.dog.scale.setScalar(1.6);
      p.dog.position.set(0, 0, 0);
      p.pen.add(p.dog);
      root.add(p.pen);
    });
    this.pens[0].dog.rotation.y = 0.7;
    this.floor = createTileFloor(3, 4, 0.075);
    this.floor.position.set(0, TY, TZ - 0.02);
    root.add(this.floor);

    // Tælleren: en brik til venstre på stenen, der viser, hvor mange felter der er sået
    this.counter = createLabelToken(96, 0.24, 0.13);
    this.counter.group.position.set(-0.63, TY + 0.02, this.frontZ);
    this.counter.group.rotation.x = -1.05;
    root.add(this.counter.group);

    // Banens egen knap-brik (HVAD GØR VI?, VIDERE) yderst til højre på stenen
    this.btn = createLabelToken(53, 0.34, 0.12);
    this.btn.group.position.set(0.62, TY + 0.02, this.frontZ);
    this.btn.group.rotation.x = -1.05;
    root.add(this.btn.group);
    ctx.interaction.add(this.btn.group, { onSelect: () => this.pressButton(), onHover: (on) => this.btn.setHover(on) });

    this.reset();
  }

  toPlot(v) { return v.clone().sub(this.plot.group.position); }

  // --- Livscyklus --------------------------------------------------------------
  start() {
    this.run++;
    this.reset();
    this.main().catch((e) => { if (e !== CANCEL) console.error(e); });
  }

  /** Til test i konsollen: start banen ved et senere trin ('A', 'B', 'C', 'D' eller 'E'). */
  startAt(step) {
    this.run++;
    this.reset();
    this.main(step).catch((e) => { if (e !== CANCEL) console.error(e); });
  }

  stop() {
    this.run++;
    this.tw.clear();
    this.btnResolve = null;
    this.btn.group.visible = false;
    this.busy = false;
    this.mode = null;
  }

  reset() {
    this.tw.clear();
    this.phase = 'start';
    this.mode = null;            // hvad talbrikkerne bruges til lige nu
    this.busy = false;
    this.count = 0;
    this.tried = [];
    this.ready = false;
    this.guessed = null;
    this.shape = null;           // { rows, cols, n } for rebet, som det ligger nu
    this.btn.group.visible = false;
    this.counter.group.visible = false;
    this.plot.clear();
    this.rope.group.visible = false;
    this.stakes.forEach((s, i) => { s.position.copy(this.stakeHome[i]); s.rotation.set(0, 0, Math.PI / 2); s.visible = false; });
    this.farmer.group.visible = false;
    this.overview.forEach((t) => { t.group.visible = false; t.draw(false); t.group.scale.setScalar(1); t.face.material.emissive.set(0); });
    this.tokens.forEach((t) => { t.group.visible = false; t.used = false; t.setDim(false); t.setHover(false); });
    this.yesNo.forEach((t) => { t.group.visible = false; t.setHover(false); });
    this.pens.forEach((p) => { p.pen.visible = false; });
    this.floor.visible = false;
    this.floor.userData.tiles.forEach((t) => { t.visible = false; });
  }

  // --- Hjælpere til forløbet -------------------------------------------------------
  async w(sec) {
    const r = this.run;
    await this.tw.wait(sec);
    if (r !== this.run) throw CANCEL;
  }
  async until(pred) { while (!pred()) await this.w(0.1); }
  say(id, extra = '', footer = '') { this.ctx.say(id, extra, footer); }

  async button(text) {
    const r = this.run;
    this.btn.setText(text);
    this.btn.setHover(false);
    this.btn.group.visible = true;
    this.popIn(this.btn.group);
    await new Promise((res) => { this.btnResolve = res; });
    this.btn.group.visible = false;
    if (r !== this.run) throw CANCEL;
  }
  pressButton() {
    if (!this.btnResolve || this.busy) return;
    audioContext(); sfx.tap();
    const r = this.btnResolve; this.btnResolve = null; r();
  }

  popIn(obj, dur = 0.35, to = 1) {
    obj.scale.setScalar(0.01);
    obj.visible = true;
    return this.tw.add(dur, (k) => obj.scale.setScalar(0.01 + (to - 0.01) * ease(k)));
  }
  popOut(obj, dur = 0.3) {
    const s0 = obj.scale.x;
    return this.tw.add(dur, (k) => obj.scale.setScalar(Math.max(0.01, s0 * (1 - ease(k)))), () => { obj.visible = false; obj.scale.setScalar(1); });
  }
  pulse(obj, amount = 0.08) {
    return this.tw.add(0.5, (k) => obj.scale.setScalar(1 + Math.sin(k * Math.PI) * amount));
  }
  pulseTo(obj, base, amount) {
    return this.tw.add(0.5, (k) => obj.scale.setScalar(base * (1 + Math.sin(k * Math.PI) * amount)));
  }
  shake(obj) {
    const x0 = obj.position.x;
    this.tw.add(0.4, (k) => { obj.position.x = x0 + Math.sin(k * 40) * 0.01 * (1 - k); }, () => { obj.position.x = x0; });
  }
  fly(p, to, dur = 0.5, height = 0.3, onLand) {
    const a = p.clone(), b = to.clone();
    return this.tw.add(dur, (k) => {
      const e = ease(k);
      p.lerpVectors(a, b, e);
      p.y += Math.sin(e * Math.PI) * height;
    }, onLand);
  }

  /** Tælleren på stenen: setCounter(7) viser "7 felter", setCounter(null) skjuler den. */
  setCounter(n) {
    if (n === null) { if (this.counter.group.visible) this.popOut(this.counter.group); return; }
    this.counter.setLabel({ title: String(n), sub: HINT.felterSmaat });
    if (!this.counter.group.visible) this.popIn(this.counter.group);
    else this.pulse(this.counter.group, 0.1);
  }

  /** Vis talbrikkerne med disse tal, pænt centreret på stenens forkant. */
  showTokens(values, mode) {
    this.mode = mode;
    const gap = 0.19;
    this.tokens.forEach((t, i) => {
      const on = i < values.length;
      t.value = values[i];
      t.used = false; t.setDim(false); t.setHover(false);
      t.group.visible = on;
      if (!on) return;
      t.setText(values[i]);
      t.group.position.set((i - (values.length - 1) / 2) * gap, this.A.tableY + 0.02, this.frontZ);
      this.popIn(t.group);
    });
  }
  hideTokens() {
    this.mode = null;
    this.tokens.forEach((t) => { if (t.group.visible) this.popOut(t.group); });
  }

  // --- Rebet, pælene og felterne ------------------------------------------------------
  /** Slå pælene i og spænd rebet rundt om en mark (animeret). */
  async stretch(rows, cols, n = perimeter(rows, cols)) {
    const corners = plotCorners(rows, cols);
    this.shape = { rows, cols, n };
    this.rope.group.visible = false;
    for (let i = 0; i < 4; i++) {
      const s = this.stakes[i];
      s.visible = true;
      const from = s.position.clone();
      const r0 = s.rotation.z;
      const a = from.clone(), b = corners[i];
      this.tw.add(0.7, (k) => {
        const e = ease(k);
        s.position.lerpVectors(a, b, e);
        s.position.y += Math.sin(e * Math.PI) * 0.6;
        s.rotation.z = r0 * (1 - e);
      }, () => sfx.plop());
      await this.w(0.18);
    }
    await this.w(0.65);
    // Rebet rulles ud hele vejen rundt; en lille lyd ved hver knude
    this.rope.group.visible = true;
    let heard = 0;
    await this.tw.add(Math.max(1.4, n * 0.09), (k) => {
      this.rope.set(corners, k, n);
      const knots = Math.floor(k * n + 1e-6);
      if (knots > heard) { heard = knots; sfx.clink(); }
    });
    this.rope.set(corners, 1, n);
    if (this.run) await this.w(0.2);
  }

  /** Stil rebet med det samme (bruges af startAt). */
  placeRope(rows, cols, n = perimeter(rows, cols)) {
    const corners = plotCorners(rows, cols);
    this.shape = { rows, cols, n };
    this.stakes.forEach((s, i) => { s.visible = true; s.position.copy(corners[i]); s.rotation.set(0, 0, 0); });
    this.rope.group.visible = true;
    this.rope.set(corners, 1, n);
  }

  /** Flyt rebet til en ny form med samme længde: pælene glider, knuderne følger med. */
  async reshape(rows, cols) {
    const from = plotCorners(this.shape.rows, this.shape.cols), to = plotCorners(rows, cols);
    const n = this.shape.n;
    const cur = from.map((c) => c.clone());
    this.shape = { rows, cols, n };
    await this.tw.add(1.1, (k) => {
      const e = ease(k);
      cur.forEach((c, i) => c.lerpVectors(from[i], to[i], e));
      this.stakes.forEach((s, i) => s.position.copy(cur[i]));
      this.rope.set(cur, 1, n);
    });
    sfx.plop();
  }

  /** Vis felterne i en mark (tomme). */
  showCells(rows, cols) {
    this.plot.layout(rows, cols);
  }

  /** Så ét felt: en spire vokser op, og feltet skifter farve. */
  sow(cl) {
    const c0 = cl.color.clone();
    cl.hit.visible = false;
    cl.sown = true;
    return this.tw.add(0.4, (k) => {
      cl.sprout = Math.sin(k * Math.PI * 0.75) / Math.sin(Math.PI * 0.75) * ease(Math.min(1, k * 1.5));
      cl.color.lerpColors(c0, CELL.sown, k);
    }, () => { cl.sprout = 1; });
  }

  /** Så hele rækker animeret, række for række. Tælleren stiger efter hver række. */
  async sowRows(fromRow, rows, cols, perCell = 0.07) {
    const totals = rowTotals(rows, cols);
    for (let r = fromRow; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.sow(this.plot.cell(r, c));
        if (c % 2 === 0) sfx.pair(r * 2 + c);
        await this.w(perCell);
      }
      this.count = totals[r];
      this.setCounter(this.count);
      await this.w(0.3);
    }
    await this.w(0.3);
  }

  // --- Interaktion ---------------------------------------------------------------------
  tapCell(cl) {
    audioContext();
    if (this.phase !== 'B_saa' || !cl.target || cl.sown) return;
    cl.target = false;
    this.count++;
    sfx.pair(this.count);
    this.sow(cl);
    this.setCounter(this.count);
  }
  hoverCell(cl, on) {
    if (!cl.target || cl.sown) return;
    cl.hovered = on;
  }

  pick(t) {
    if (!this.mode || this.busy || t.used || !t.group.visible) return;
    audioContext();
    this.onPick?.(t);
  }

  guess(answer) {
    if (this.phase !== 'C_gaet') return;
    audioContext(); sfx.tap();
    this.guessed = answer;
  }

  /** Forkert brik: dæmp den og ryst den lidt. */
  wrongToken(t) {
    sfx.wrong();
    t.used = true; t.setDim(true); t.setHover(false);
    this.shake(t.group);
  }

  // --- Hele banen ------------------------------------------------------------------
  async main(from = 'A') {
    const order = ['A', 'B', 'C', 'D', 'E'];
    const at = (s) => order.indexOf(from) <= order.indexOf(s);
    if (at('A')) await this.partProblem();
    if (at('B')) await this.partMeasure();
    else this.placeRope(FARM.rows, FARM.cols);
    if (at('C')) await this.partRope();
    else { this.placeRope(4, 4, ROPE); this.guessed = 'ja'; }
    if (at('D')) await this.partPredict();
    await this.partWorld();
    this.phase = 'F';
    this.say('landmaaler_slut');
    sfx.finish();
    this.phase = 'faerdig';
    this.ctx.complete();
  }

  // --- A: problemet ----------------------------------------------------------------
  async partProblem() {
    this.phase = 'A';
    this.say('landmaaler_problem');
    await this.button(BUTTONS.hvad);
    this.say('landmaaler_reb');
    this.stakes.forEach((s) => { this.popIn(s); });
    await this.popIn(this.farmer.group, 0.45, FARMER_SCALE);
    this.pulseTo(this.farmer.group, FARMER_SCALE, 0.06);
    await this.button(BUTTONS.videre);
  }

  // --- B: mål marken op igen og tæl felterne ------------------------------------------
  async pickNumber(values, correct, mode, line, hint) {
    this.say(line);
    this.showTokens(values, mode);
    const r = this.run;
    const t = await new Promise((res) => {
      this.onPick = (tok) => {
        if (tok.value === correct) { this.onPick = null; res(tok); return; }
        this.wrongToken(tok);
        hint(tok);
      };
    });
    if (r !== this.run) throw CANCEL;
    sfx.correct();
    t.face.material.emissive.set(0x553311);
    await this.w(0.5);
    t.face.material.emissive.set(0x000000);
    this.hideTokens();
    await this.w(0.35);
    return t.value;
  }

  async partMeasure() {
    this.phase = 'B';
    if (!this.farmer.group.visible) { this.farmer.group.visible = true; this.farmer.group.scale.setScalar(FARMER_SCALE); }
    this.stakes.forEach((s) => { s.visible = true; });
    const tabletHint = () => { this.say('landmaaler_hint_tavle'); this.pulseTo(this.farmer.group, FARMER_SCALE, 0.08); };
    await this.pickNumber([2, 3, 4, 5, 6], FARM.rows, 'bredde', 'landmaaler_bredde', tabletHint);
    await this.pickNumber([2, 3, 4, 5, 6], FARM.cols, 'laengde', 'landmaaler_laengde', tabletHint);
    this.phase = 'B_spaend';
    await this.stretch(FARM.rows, FARM.cols);
    this.showCells(FARM.rows, FARM.cols);
    this.say('landmaaler_spaendt', ropeText(FARM.rows, FARM.cols));
    await this.w(0.6);
    await this.button(BUTTONS.videre);

    // Eleven sår den forreste række selv, felt for felt
    this.phase = 'B_saa';
    this.count = 0;
    for (let c = 0; c < FARM.cols; c++) {
      const cl = this.plot.cell(0, c);
      cl.target = true;
      cl.hit.visible = true;
    }
    this.say('landmaaler_saa');
    this.setCounter(0);
    await this.until(() => this.count >= FARM.cols);
    await this.w(0.6);

    // Hvor mange rækker? Så fyldes resten række for række
    this.phase = 'B_raekker';
    await this.pickNumber([2, 3, 4, 5], FARM.rows, 'raekker', 'landmaaler_raekker',
      () => this.say('landmaaler_hint_raekker'));
    this.say('landmaaler_raekker');
    await this.sowRows(1, FARM.rows, FARM.cols, 0.12);
    sfx.correct();
    this.phase = 'B_talt';
    this.say('landmaaler_15');
    await this.button(BUTTONS.videre);
    this.setCounter(null);
    this.popOut(this.farmer.group);
    this.plot.cells.forEach((cl) => { cl.target = false; cl.sown = false; });
  }

  // --- C: samme reb, forskellige marker --------------------------------------------------
  async partRope() {
    this.phase = 'C_gaet';
    this.plot.clear();
    this.plot.cells.forEach((cl) => { cl.sown = false; cl.target = false; });
    this.say('landmaaler_nyt_reb');
    this.yesNo.forEach((t) => this.popIn(t.group));
    await this.until(() => this.guessed);
    this.yesNo.forEach((t) => this.popOut(t.group));
    await this.w(0.35);

    this.phase = 'C';
    this.tried = [];
    this.ready = false;
    this.say('landmaaler_proev', ropeText(this.shape.rows, this.shape.cols));
    this.showTokens(SHAPES, 'form');
    this.onPick = (t) => {
      sfx.tap();
      this.busy = true;
      this.tokens.forEach((o) => o.setHover(false));
      const r = this.run;
      this.tryShape(t).then(() => { if (r === this.run) this.busy = false; })
        .catch((e) => { if (e !== CANCEL) console.error(e); });
    };
    await this.until(() => this.ready && !this.busy);
    await this.button(BUTTONS.videre);
    this.onPick = null;
    this.hideTokens();
    this.setCounter(null);

    // Overraskelsen: den firkantede mark gav mest
    this.phase = 'C_overraskelse';
    const best = this.overview[SHAPES.indexOf(4)];
    best.draw(true);
    best.face.material.emissive.set(0x2a1a06);
    this.pulse(best.group, 0.2);
    if (this.shape.rows !== 4) {
      this.plot.clear();
      await this.reshape(4, lengthFor(ROPE, 4));
      this.showCells(4, 4);
      await this.sowRows(0, 4, 4, 0.03);
    }
    sfx.correct();
    this.say(this.guessed === 'nej' ? 'landmaaler_ret_gaet' : 'landmaaler_overraskelse');
    await this.button(BUTTONS.videre);
  }

  async tryShape(t) {
    const rows = t.value, cols = lengthFor(ROPE, rows);
    t.face.material.emissive.set(0x553311);
    this.plot.clear();
    this.plot.cells.forEach((cl) => { cl.sown = false; });
    this.say('landmaaler_form', ropeText(rows, cols), this.footer());
    await this.reshape(rows, cols);
    this.showCells(rows, cols);
    this.setCounter(0);
    await this.w(0.3);
    await this.sowRows(0, rows, cols, 0.05);
    t.face.material.emissive.set(0x000000);
    if (!this.tried.includes(rows)) {
      const tab = this.overview[SHAPES.indexOf(rows)];
      await this.popIn(tab.group, 0.35);
    }
    this.tried.push(rows);
    this.ready = triedEnough(this.tried, { atLeast: 3, must: [1, 4] });
    let extra = `${ropeText(rows, cols)} ${fieldText(rows, cols)}`;
    const missing = [1, 4].filter((m) => !this.tried.includes(m));
    if (!this.ready && missing.length && new Set(this.tried).size >= 2) extra += ' ' + tryAlsoText(missing);
    if (this.ready) extra += ' ' + HINT.klar;
    sfx.correct();
    this.say('landmaaler_form', extra, this.footer());
  }

  footer() {
    const seen = [...new Set(this.tried)].sort((a, b) => a - b);
    return seen.length ? `${HINT.proevet} ${seen.map((w) => `${w} × ${lengthFor(ROPE, w)}`).join(' · ')}` : '';
  }

  // --- D: forudsig, før der er sået et eneste frø ----------------------------------------
  async partPredict() {
    this.phase = 'D';
    const { rows, cols } = NEIGHBOUR;
    this.plot.clear();
    this.plot.cells.forEach((cl) => { cl.sown = false; });
    this.overview.forEach((t) => { if (t.group.visible) this.popOut(t.group); });
    await this.stretch(rows, cols);
    const hints = { 20: 'landmaaler_hint_20', 10: 'landmaaler_hint_10' };
    await this.pickNumber([10, 20, area(rows, cols)], area(rows, cols), 'forudsig', 'landmaaler_forudsig',
      (t) => this.say(hints[t.value] || 'landmaaler_hint_10'));
    this.phase = 'D_saa';
    this.say('landmaaler_rigtigt');
    this.showCells(rows, cols);
    this.count = 0;
    this.setCounter(0);
    await this.sowRows(0, rows, cols, 0.04);
    sfx.correct();
    this.phase = 'D_pointe';
    this.say('landmaaler_pointe');
    await this.button(BUTTONS.videre);
    this.setCounter(null);
  }

  // --- E: spor i din verden ---------------------------------------------------------
  async partWorld() {
    this.phase = 'E';
    this.overview.forEach((t) => { if (t.group.visible) this.popOut(t.group); });
    for (const p of this.pens) { this.popIn(p.pen, 0.45); await this.w(0.2); }
    this.say('landmaaler_spor');
    await this.w(0.5);
    await this.button(BUTTONS.videre);

    this.phase = 'E_kvadratmeter';
    this.pens.forEach((p) => this.popOut(p.pen));
    await this.w(0.35);
    this.floor.visible = true;
    this.floor.scale.setScalar(1);
    this.say('landmaaler_kvadratmeter');
    for (const t of this.floor.userData.tiles) {
      this.popIn(t, 0.25);
      sfx.clink();
      await this.w(0.12);
    }
    await this.w(0.4);
    await this.button(BUTTONS.videre);
    this.popOut(this.floor);
    await this.w(0.3);
  }

  // --- Hver frame ---------------------------------------------------------------------
  update(dt) {
    this.tw.update(dt);
    const t = performance.now() / 1000;
    // Felterne, eleven skal så, gløder svagt
    let dirty = false;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
    for (const cl of this.plot.cells) {
      if (!cl.on) continue;
      if (cl.target && !cl.sown) {
        cl.color.copy(CELL.empty).lerp(cl.hovered ? CELL.hover : CELL.target, cl.hovered ? 1 : 0.4 + 0.6 * pulse);
      }
      dirty = true;
    }
    if (dirty) this.plot.sync();
    // Hundene logrer med halen
    this.pens.forEach((p, i) => { if (p.pen.visible) p.dog.userData.tail.rotation.x = Math.sin(t * 9 + i) * 0.5; });
  }
}
