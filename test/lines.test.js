import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LINES, BUTTONS, LEVEL_TITLES } from '../src/game/lines.js';

const PREFIXES = ['gaard_', 'hyrde_', 'koebmand_', 'skriver_', 'landmaaler_'];

test('alle replikker har et banepræfiks og en titel', () => {
  for (const [id, l] of Object.entries(LINES)) {
    assert.ok(PREFIXES.some((p) => id.startsWith(p)), `mangler præfiks: ${id}`);
    assert.equal(typeof l.title, 'string');
    assert.equal(typeof l.text, 'string');
  }
});

test('Hyrden viser ingen tal: ingen cifre eller talord i hyrde_-replikker og knapper', () => {
  const WORDS = ['to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti', 'elleve', 'tolv', 'tretten',
    'fjorten', 'femten', 'tyve', 'hundrede', 'første', 'anden', 'andet', 'tredje', 'fjerde'];
  const texts = Object.entries(LINES).filter(([id]) => id.startsWith('hyrde_')).map(([, l]) => `${l.title} ${l.text}`);
  texts.push(BUTTONS.hvad, BUTTONS.lukInd, BUTTONS.proevIgen, BUTTONS.videre, BUTTONS.gaarden, BUTTONS.naeste, LEVEL_TITLES.hyrde);
  for (const t of texts) {
    assert.doesNotMatch(t, /\d/, t);
    const words = t.toLowerCase().split(/[^a-zæøåé]+/);
    for (const w of WORDS) assert.ok(!words.includes(w), `talord "${w}" i: ${t}`);
  }
});
