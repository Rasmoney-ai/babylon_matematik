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

export const sfx = {
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
