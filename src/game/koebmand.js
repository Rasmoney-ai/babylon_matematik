// Bane 2: Købmanden – gruppering, og hvorfor 60 er godt at dele med.
// Ved en markedsbod uden for porten. Forbinder Hyrden (én kugle pr. får) med Skriveren (60-talssystemet).
//
// A  En uoverskuelig bunke lerkugler. Ti kugler byttes til én kegle → 3 kegler og 4 kugler.
// B  10 brød deles mellem 2-5 arbejdere (kurve). Ofte bliver der brød til overs.
// C  60 brød deles mellem 2-7 arbejdere. Alt går op undtagen 7.
// D  Babylonierne samlede i bundter på 60 – nok fordi 60 er let at dele (ingen ved det sikkert).
// E  Spor i din verden: en time har 60 minutter (halv, kvarter, tredjedel).
// F  Bro til Skriveren.
import * as THREE from 'three';
import { BUTTONS, KOEBMAND_HINT as HINT, HOUR_PARTS, shareText, tryAlsoText } from './lines.js';
import { sfx, audioContext } from '../core/sound.js';
import { createStoneBowl, stoneGeo, stoneMat } from '../objects/pottery.js';
import { createLabelToken, createToken } from '../objects/tablets.js';
import {
  coneGeo, coneMat, createBread, createBasket, basketSlots, gridSlots, createTray, hitBox, createHourDisk,
  LOAF_COLOR, LOAF_REST,
} from '../objects/goods.js';
import { bundle, dealPlan, triedEnough } from '../math/grouping.js';
import { Tweens } from './tweens.js';

const FLOCK = 34;          // kugler i bunken (3 bundter og 4 løse)
const BUNDLE = 10;
const MAX_WORKERS = 7;
const CANCEL = Symbol('banen blev stoppet');

// De to delinger: 10 brød (store) og 60 brød (små, i rækker på ti)
const SHARES = {
  ti: { total: 10, choices: [2, 3, 4, 5], size: 0.045, cols: 5, dx: 0.1, dz: 0.075, tray: [0.58, 0.2], intro: 'koebmand_brod' },
  tres: { total: 60, choices: [2, 3, 4, 5, 6, 7], size: 0.02, cols: 10, dx: 0.048, dz: 0.036, tray: [0.56, 0.27], intro: 'koebmand_60' },
};

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = (k) => k * k * (3 - 2 * k);

export class KoebmandLevel {
  constructor(ctx) {
    this.ctx = ctx;
    const A = this.A = ctx.station.anchors;
    const root = ctx.root;
    this.tw = new Tweens();
    // Egen kopi af delingerne (brød, bræt og kurve hører til denne instans)
    this.S = { ti: { ...SHARES.ti }, tres: { ...SHARES.tres } };
    this.run = 0;
    const wood = new THREE.MeshStandardMaterial({ color: '#7b5434', roughness: 0.8 });
    // Brættet er lysere end hylden, så det står tydeligt
    const trayWood = new THREE.MeshStandardMaterial({ color: '#c9a06a', roughness: 0.85 });
    const CY = A.counterY, CZ = A.counterZ;

    // --- A: bunken, bytte-skålen og keglerne -------------------------------------
    this.pileCenter = V(-0.2, CY, CZ - 0.05);
    this.bowl = createStoneBowl(0);
    this.bowl.group.position.set(0.5, CY, CZ - 0.05);
    root.add(this.bowl.group);
    this.pileHit = hitBox(0.72, 0.1, 0.42);
    this.pileHit.position.add(this.pileCenter);
    root.add(this.pileHit);
    const onPile = { onSelect: () => this.tapExchange(), onHover: (on) => { this.hoverBowl = on; } };
    ctx.interaction.add(this.bowl.group, onPile);
    ctx.interaction.add(this.pileHit, onPile);
    this.balls = Array.from({ length: FLOCK }, (_, i) => {
      const m = new THREE.Mesh(stoneGeo, stoneMat);
      m.rotation.set(i * 1.3, i * 0.7, 0);
      root.add(m);
      return m;
    });
    this.pileSpots = this.makePile();
    this.cones = Array.from({ length: Math.ceil(FLOCK / BUNDLE) }, () => {
      const m = new THREE.Mesh(coneGeo, coneMat);
      root.add(m);
      return m;
    });

    // --- B og C: bræt med brød på hylden, arbejdernes kurve på disken --------------------------------------
    for (const [key, cfg] of Object.entries(this.S)) {
      cfg.key = key;
      cfg.bread = createBread(cfg.total, cfg.size);
      root.add(cfg.bread.mesh);
      cfg.trayObj = createTray(cfg.tray[0], cfg.tray[1], trayWood);
      cfg.trayObj.position.set(0, A.shelfY, A.shelfZ);
      root.add(cfg.trayObj);
      const slots = gridSlots(cfg.total, cfg.cols, cfg.dx, cfg.dz);
      cfg.bread.items.forEach((it, i) => {
        it.home = slots[i].add(cfg.trayObj.position).add(V(0, 0.02, 0));
        it.rotY = Math.PI / 2 + Math.sin(i * 1.7) * 0.15;   // på tværs, pænt i rækker
      });
    }
    this.baskets = Array.from({ length: MAX_WORKERS }, () => {
      const b = createBasket();
      root.add(b.group);
      return b;
    });

    // Talbrikker: antal arbejdere. Ligger på diskens forkant til venstre.
    this.choiceTokens = this.S.tres.choices.map((n, i) => {
      const t = createToken(60 + i);
      t.setText(n);
      t.n = n;
      t.group.position.set(-0.8 + i * 0.2, CY + 0.02, CZ + 0.22);
      t.group.rotation.x = -1.05;
      root.add(t.group);
      ctx.interaction.add(t.group, {
        onSelect: () => this.choose(n),
        onHover: (on) => { if (!this.dealing) t.setHover(on); },
      });
      return t;
    });

    // --- E: timeskiven midt på disken -----------------------------------------------------
    this.disk = createHourDisk(0.22, trayWood);
    this.disk.group.position.set(-0.05, CY, CZ - 0.12);
    this.disk.group.rotation.x = -0.18;
    root.add(this.disk.group);

    // Banens egen knap-brik (HVAD GØR VI?, VIDERE) yderst til højre på disken
    this.btn = createLabelToken(52, 0.36, 0.12);
    this.btn.group.position.set(0.64, CY + 0.02, CZ + 0.22);
    this.btn.group.rotation.x = -1.05;
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
    this.dealing = false;
    this.target = null;
  }

  reset() {
    this.tw.clear();
    this.phase = 'start';
    this.target = null;
    this.exchanging = false;
    this.dealing = false;
    this.cfg = null;
    this.tried = [];
    this.ready = false;
    this.restItems = [];
    this.btn.group.visible = false;
    this.bowl.group.visible = false;
    this.pileHit.visible = false;
    this.balls.forEach((b) => { b.visible = false; b.scale.setScalar(1); });
    this.cones.forEach((c) => { c.visible = false; c.scale.setScalar(1); });
    for (const cfg of Object.values(this.S)) {
      cfg.trayObj.visible = false;
      cfg.bread.items.forEach((it) => { it.visible = false; it.p.copy(it.home); it.color.copy(LOAF_COLOR); });
      cfg.bread.sync();
    }
    this.baskets.forEach((b) => { b.group.visible = false; b.group.scale.setScalar(1); });
    this.choiceTokens.forEach((t) => { t.group.visible = false; t.setHover(false); });
    this.disk.group.visible = false;
    this.disk.show(0);
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
    if (!this.btnResolve || this.dealing) return;
    audioContext(); sfx.tap();
    const r = this.btnResolve; this.btnResolve = null; r();
  }

  /** Lille "pop", når noget dukker op. */
  popIn(obj, dur = 0.35, to = 1) {
    obj.scale.setScalar(0.01);
    obj.visible = true;
    return this.tw.add(dur, (k) => obj.scale.setScalar(0.01 + (to - 0.01) * ease(k)));
  }
  popOut(obj, dur = 0.3) {
    const s0 = obj.scale.x;
    return this.tw.add(dur, (k) => obj.scale.setScalar(Math.max(0.01, s0 * (1 - ease(k)))), () => { obj.visible = false; obj.scale.setScalar(1); });
  }

  /** Flyv en position (Vector3, ændres på stedet) i en bue. */
  fly(p, to, dur = 0.45, height = 0.12, onLand) {
    const a = p.clone(), b = to.clone();
    const h = height + a.distanceTo(b) * 0.15;
    return this.tw.add(dur, (k) => {
      const e = ease(k);
      p.lerpVectors(a, b, e);
      p.y += Math.sin(e * Math.PI) * h;
    }, onLand);
  }

  nudge(obj) {
    const x0 = obj.position.x;
    this.tw.add(0.35, (k) => { obj.position.x = x0 + Math.sin(k * 30) * 0.008 * (1 - k); }, () => { obj.position.x = x0; });
  }

  // --- Hele banen ------------------------------------------------------------------
  /** Til test i konsollen: start banen ved et senere trin ('A', 'B', 'C' eller 'E'). */
  startAt(step) {
    this.run++;
    this.reset();
    this.main(step).catch((e) => { if (e !== CANCEL) console.error(e); });
  }

  async main(from = 'A') {
    const order = ['A', 'B', 'C', 'E'];
    const at = (s) => order.indexOf(from) <= order.indexOf(s);
    if (at('A')) await this.partBundles();
    if (at('B')) {
      await this.partShare(this.S.ti);
      await this.clearShare(this.S.ti);
      this.say('koebmand_ti_svaer');
      await this.button(BUTTONS.videre);
    }
    if (at('C')) {
      await this.partShare(this.S.tres);
      await this.partWhy60();
    }
    await this.partHour();
    this.phase = 'bro';
    this.say('koebmand_bro');
    this.phase = 'faerdig';
    this.ctx.complete();
  }

  // --- A: ti kugler bliver til én kegle -------------------------------------------------
  makePile() {
    // Fast, tilfældigt udseende spredning (samme hver gang), ingen kugler oven i hinanden
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const spots = [];
    while (spots.length < FLOCK) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
      const p = V(Math.cos(a) * r * 0.3, 0.022, Math.sin(a) * r * 0.16).add(this.pileCenter);
      if (spots.every((q) => q.distanceTo(p) > 0.052)) spots.push(p);
    }
    return spots;
  }

  async partBundles() {
    this.phase = 'A';
    this.loose = this.balls.slice();
    this.coneCount = 0;
    this.balls.forEach((b, i) => { b.position.copy(this.pileSpots[i]); b.visible = true; b.scale.setScalar(1); });
    this.bowl.group.visible = true;
    this.pileHit.visible = true;
    this.say('koebmand_problem');
    await this.button(BUTTONS.hvad);
    this.say('koebmand_ide');
    this.target = 'bowl';
    await this.until(() => this.loose.length < BUNDLE && !this.exchanging);
    this.target = null;
    await this.w(0.5);

    // Slutbillede: keglerne og de løse kugler pænt på én række
    const { bundles, loose } = bundle(FLOCK, BUNDLE);
    const z = this.A.counterZ - 0.02;
    const width = (bundles - 1) * 0.1 + 0.1 + (loose - 1) * 0.065;
    let x = -0.1 - width / 2;
    for (let i = 0; i < bundles; i++) { this.fly(this.cones[i].position, V(x, this.A.counterY, z), 0.6, 0.06); x += 0.1; }
    x += 0.0;
    for (let i = 0; i < loose; i++) { this.fly(this.loose[i].position, V(x, this.A.counterY + 0.022, z), 0.6, 0.06); x += 0.065; }
    await this.w(0.8);
    sfx.correct();
    this.phase = 'A_samlet';
    this.say('koebmand_samlet');
    await this.button(BUTTONS.videre);
    // Ryd disken
    [...this.cones, ...this.loose, this.bowl.group].forEach((o) => { if (o.visible) this.popOut(o); });
    this.pileHit.visible = false;
    await this.w(0.4);
  }

  tapExchange() {
    audioContext();
    if (this.target !== 'bowl' || this.exchanging || this.loose.length < BUNDLE) { this.nudge(this.bowl.group); return; }
    this.exchange().catch((e) => { if (e !== CANCEL) console.error(e); });
  }

  async exchange() {
    this.exchanging = true;
    const mouth = this.bowl.group.position.clone().add(V(0, 0.06, 0));
    // De ti kugler, der ligger tættest på skålen, flyver derhen én efter én
    const ten = this.loose.slice().sort((a, b) => a.position.distanceTo(mouth) - b.position.distanceTo(mouth)).slice(0, BUNDLE);
    this.loose = this.loose.filter((b) => !ten.includes(b));
    for (let i = 0; i < ten.length; i++) {
      const b = ten[i];
      const spot = mouth.clone().add(V(Math.cos(i * 2.4) * 0.05, (i % 3) * 0.012, Math.sin(i * 2.4) * 0.05));
      this.fly(b.position, spot, 0.4, 0.1, () => sfx.clink());
      await this.w(0.07);
    }
    await this.w(0.45);
    // De samles i midten og bliver til én kegle
    ten.forEach((b) => {
      const a = b.position.clone();
      this.tw.add(0.3, (k) => { b.position.lerpVectors(a, mouth, ease(k)); b.scale.setScalar(1 - 0.7 * k); }, () => { b.visible = false; });
    });
    await this.w(0.3);
    const cone = this.cones[this.coneCount++];
    cone.position.copy(mouth).add(V(0, -0.03, 0));
    sfx.pair(this.coneCount * 3);
    await this.popIn(cone, 0.3, 1.25);
    cone.scale.setScalar(1);
    // Keglen lægger sig forrest til venstre på disken
    const spot = V(-0.72 + (this.coneCount - 1) * 0.1, this.A.counterY, this.A.counterZ + 0.12);
    await this.fly(cone.position, spot, 0.5, 0.1, () => sfx.plop());
    if (this.coneCount === 1) this.say('koebmand_bytter');
    this.exchanging = false;
  }

  // --- B og C: del brødet ----------------------------------------------------------
  async partShare(cfg) {
    this.phase = cfg.key;
    this.cfg = cfg;
    this.tried = [];
    this.ready = false;
    this.fairCount = 0;
    this.challenged = false;
    this.dealt = false;
    this.restItems = [];
    cfg.bread.items.forEach((it) => { it.p.copy(it.home); it.color.copy(LOAF_COLOR); it.visible = true; });
    this.popIn(cfg.trayObj);
    this.choiceTokens.forEach((t) => {
      t.group.visible = cfg.choices.includes(t.n);
      t.setHover(false);
      if (t.group.visible) this.popIn(t.group);
    });
    this.say(cfg.intro);
    await this.until(() => this.ready);
    await this.button(BUTTONS.videre);
    this.choiceTokens.forEach((t) => { if (t.group.visible) this.popOut(t.group); });
  }

  async clearShare(cfg) {
    await this.collect(cfg);
    this.baskets.forEach((b) => { if (b.group.visible) this.popOut(b.group); });
    cfg.bread.items.forEach((it) => { it.visible = false; });
    this.popOut(cfg.trayObj);
    await this.w(0.35);
  }

  choose(n) {
    if (!this.cfg || this.dealing || !this.cfg.choices.includes(n)) return;
    audioContext(); sfx.tap();
    this.dealing = true;
    const r = this.run;
    this.deal(n)
      .then(() => { if (r === this.run) this.dealing = false; })
      .catch((e) => { if (e !== CANCEL) console.error(e); });
  }

  basketPos(i, n) {
    const step = n <= 5 ? 0.3 : 0.245;
    return V((i - (n - 1) / 2) * step, this.A.counterY, this.A.counterZ - 0.06);
  }

  /** Alle brød tilbage på brættet. */
  async collect(cfg) {
    if (!this.dealt) return;
    this.restItems = [];
    cfg.bread.items.forEach((it, i) => {
      it.color.copy(LOAF_COLOR);
      if (it.p.distanceTo(it.home) > 0.001) this.tw.add(i * 0.006, null, () => this.fly(it.p, it.home, 0.4, 0.08));
    });
    await this.w(0.4 + cfg.total * 0.006 + 0.1);
    this.dealt = false;
  }

  async deal(n) {
    const cfg = this.cfg;
    const tok = this.choiceTokens.find((t) => t.n === n);
    tok.setHover(false);
    this.choiceTokens.forEach((t) => { if (t !== tok) t.setHover(false); });
    tok.face.material.emissive.set(0x553311);
    await this.collect(cfg);

    // Kurvene: én pr. arbejder, pænt fordelt på disken
    let popped = false;
    this.baskets.forEach((b, i) => {
      if (i < n) {
        const p = this.basketPos(i, n);
        if (!b.group.visible) { b.group.position.copy(p); this.popIn(b.group); popped = true; }
        else if (b.group.position.distanceTo(p) > 0.001) this.fly(b.group.position, p, 0.35, 0.03);
      } else if (b.group.visible) this.popOut(b.group);
    });
    await this.w(popped ? 0.45 : 0.4);

    // Del ud: ét brød ad gangen rundt til kurvene
    const plan = dealPlan(cfg.total, n);
    const slots = basketSlots(plan.each, cfg.size);
    const fill = new Array(n).fill(0);
    const interval = Math.min(0.28, 4.5 / plan.order.length);
    for (let k = 0; k < plan.order.length; k++) {
      const b = plan.order[k];
      const it = cfg.bread.items[k];
      const to = this.basketPos(b, n).add(slots[fill[b]++]);
      this.fly(it.p, to, 0.42, 0.1, () => { if (cfg.total <= 10 || k % 3 === 0) sfx.clink(); });
      await this.w(interval);
    }
    await this.w(0.6);
    this.dealt = true;
    tok.face.material.emissive.set(0x000000);

    // Resultatet
    this.tried.push(n);
    let id, extra = shareText(plan);
    if (plan.fair) {
      sfx.correct();
      this.fairCount++;
      id = 'koebmand_gaar_op';
    } else {
      sfx.wrong();
      this.restItems = cfg.bread.items.slice(plan.order.length);
      this.restItems.forEach((it) => it.color.copy(LOAF_REST));
      id = cfg.total === 60 ? 'koebmand_7' : 'koebmand_rest';
      if (cfg.total !== 60) extra += ' ' + HINT.igen;
    }
    if (cfg.total === 10) {
      this.ready = triedEnough(this.tried, { atLeast: 2, anyOf: [3, 4] });
      if (!this.ready && plan.fair && !this.tried.some((x) => x === 3 || x === 4)) extra += ' ' + HINT.proev34;
    } else {
      this.ready = triedEnough(this.tried, { atLeast: 4, must: [3, 4] });
      const missing = [3, 4].filter((m) => !this.tried.includes(m));
      if (!this.ready && missing.length && new Set(this.tried).size >= 3) extra += ' ' + tryAlsoText(missing);
    }
    if (this.ready) extra += ' ' + HINT.klar;
    this.say(id, extra, this.footer());

    // Udfordringen: når 60 er gået op et par gange – kan hun finde en, der IKKE går op?
    if (cfg.total === 60 && plan.fair && this.fairCount >= 2 && !this.challenged && !this.tried.includes(7)) {
      const r = this.run, count = this.tried.length;
      this.tw.add(3.2, null, () => {
        if (r !== this.run || this.tried.length !== count || this.dealing || this.challenged) return;
        this.challenged = true;
        this.say('koebmand_udfordring', '', this.footer());
      });
    }
  }

  footer() {
    const seen = [...new Set(this.tried)].sort((a, b) => a - b);
    return seen.length ? `${HINT.proevet} ${seen.join(' · ')}` : '';
  }

  // --- D: hvorfor 60? -------------------------------------------------------------
  async partWhy60() {
    this.phase = 'D';
    const cfg = this.S.tres;
    await this.collect(cfg);
    this.baskets.forEach((b) => { if (b.group.visible) this.popOut(b.group); });
    this.say('koebmand_hvorfor60');
    await this.w(0.4);
    await this.button(BUTTONS.videre);
    cfg.bread.items.forEach((it) => { it.visible = false; });
    this.popOut(cfg.trayObj);
    await this.w(0.35);
  }

  // --- E: spor i din verden – timen -------------------------------------------------
  async partHour() {
    this.phase = 'E';
    this.disk.show(0);
    await this.popIn(this.disk.group, 0.45);
    this.say('koebmand_spor');
    await this.w(1.6);
    for (const part of HOUR_PARTS) {
      this.disk.show(part.minutes, part.label);
      sfx.pair(part.minutes / 5);
      this.pulse(this.disk.group);
      await this.w(2.6);
    }
    // Slut på kvarteret
    const q = HOUR_PARTS.find((p) => p.minutes === 15);
    this.disk.show(q.minutes, q.label);
    this.phase = 'E_kvarter';
    this.say('koebmand_kvarter');
    await this.button(BUTTONS.videre);
  }

  pulse(obj) {
    this.tw.add(0.45, (k) => obj.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.05));
  }

  // --- Hver frame ---------------------------------------------------------------------
  update(dt) {
    this.tw.update(dt);
    const t = performance.now() / 1000;

    // Bytte-skålen gløder svagt, når eleven skal pege på den
    const on = this.target === 'bowl';
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
    const k = on ? 0.05 + 0.06 * pulse + (this.hoverBowl ? 0.08 : 0) : 0;
    this.bowl.mat.emissive.setRGB(k, k * 0.5, k * 0.15);

    // Brød til overs hopper lidt, så man ikke kan overse dem
    this.restItems.forEach((it, i) => { it.p.y = it.home.y + Math.abs(Math.sin(t * 4 + i * 0.7)) * 0.025; });

    // Brødene tegnes om hver frame (70 matricer – det koster næsten intet)
    for (const cfg of Object.values(this.S)) cfg.bread.sync();
  }
}
