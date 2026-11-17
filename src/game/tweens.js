// Små tidsstyrede animationer og ventetider, drevet af banens update(dt).
// Fordi alt går gennem dt, kan en bane spoles hurtigere frem i test (timeScale).
export class Tweens {
  constructor() { this.list = []; this.gen = 0; }

  /** Kør step(k) med k fra 0 til 1 over `dur` sekunder, derefter end(). Returnerer et promise. */
  add(dur, step = null, end = null) {
    return new Promise((res) => this.list.push({ t: 0, dur: Math.max(1e-4, dur), step, end, res }));
  }

  wait(sec) { return this.add(sec); }

  /** Glem alt, der kører. Ventende promises løses aldrig (banen er stoppet). */
  clear() { this.list = []; this.gen++; }

  update(dt) {
    const now = this.list, gen = this.gen;
    this.list = [];
    const keep = [];
    for (const a of now) {
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      a.step?.(k);
      if (k >= 1) { a.end?.(); a.res(); } else keep.push(a);
      if (gen !== this.gen) return;      // clear() blev kaldt undervejs
    }
    // Nye tweens, der blev lagt til undervejs, kommer med i næste frame
    this.list = keep.concat(this.list);
  }
}
