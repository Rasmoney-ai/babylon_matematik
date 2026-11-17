// Lyd: små syntetiske effekter + valgfri indtalte replikker (audio/<id>.mp3).

let ctx = null;
export function audioContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'sine', gain = 0.18) {
  const c = audioContext();
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
}

// Bræg: savtand med hurtig tremolo ("bæ-æ-æ") gennem et båndpasfilter. pan: -1 venstre .. 1 højre.
function bleat(pan = 0, pitch = 1, gain = 0.22) {
  const c = audioContext();
  const t0 = c.currentTime, dur = 0.75;
  const o = c.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(330 * pitch, t0);
  o.frequency.linearRampToValueAtTime(380 * pitch, t0 + 0.12);
  o.frequency.linearRampToValueAtTime(300 * pitch, t0 + dur);
  const trem = c.createOscillator(); trem.frequency.value = 19;
  const tremGain = c.createGain(); tremGain.gain.value = 0.45;
  const amp = c.createGain(); amp.gain.value = 0.55;
  trem.connect(tremGain).connect(amp.gain);
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100 * pitch; bp.Q.value = 1.4;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
  const env = c.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + 0.05);
  env.gain.setValueAtTime(gain, t0 + dur * 0.6);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let out = env;
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); env.connect(p); out = p; }
  o.connect(amp).connect(bp).connect(lp).connect(env);
  out.connect(c.destination);
  o.start(t0); trem.start(t0); o.stop(t0 + dur + 0.05); trem.stop(t0 + dur + 0.05);
}

export const sfx = {
  bleat,
  // Lerkugle falder ned i krukken: dyb, hul "klonk"
  plop() { tone(220, 0, 0.16, 'sine', 0.2); tone(140, 0.02, 0.2, 'triangle', 0.1); },
  // Lerkugle tages op: lysere klik
  clink() { tone(620, 0, 0.07, 'triangle', 0.1); tone(930, 0.03, 0.08, 'sine', 0.06); },
  // Blød "pling", når en kugle finder sit får under parringen
  pair(step = 0) { tone(523 * Math.pow(1.03, step % 12), 0, 0.22, 'sine', 0.07); },
  correct() { tone(523, 0, 0.35, 'triangle'); tone(659, 0.09, 0.35, 'triangle'); tone(784, 0.18, 0.5, 'triangle'); },
  wrong() { tone(196, 0, 0.3, 'sawtooth', 0.07); tone(165, 0.12, 0.35, 'sawtooth', 0.07); },
  tap() { tone(880, 0, 0.08, 'sine', 0.08); },
  finish() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.6, 'triangle', 0.14)); },
};

// --- Indtalte replikker -----------------------------------------------------
const cache = new Map();   // id -> HTMLAudioElement | null (null = findes ikke)
let current = null;

export async function speak(id) {
  if (current) { current.pause(); current = null; }
  if (cache.get(id) === null) return;
  let el = cache.get(id);
  if (!el) {
    el = new Audio(`audio/${id}.mp3`);
    const ok = await new Promise((res) => {
      el.addEventListener('canplaythrough', () => res(true), { once: true });
      el.addEventListener('error', () => res(false), { once: true });
    });
    if (!ok) { cache.set(id, null); return; }
    cache.set(id, el);
  }
  el.currentTime = 0;
  current = el;
  el.play().catch(() => {});
}
