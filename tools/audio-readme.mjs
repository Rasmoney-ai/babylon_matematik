// Genererer audio/README.md ud fra LINES i src/game/lines.js.
// Kør:  npm run audio-readme
import { writeFileSync } from 'node:fs';
import { LINES } from '../src/game/lines.js';

const GROUPS = [
  ['gaard_', 'Gården (startsted og banevælger)'],
  ['hyrde_', 'Bane 1: Hyrden'],
  ['koebmand_', 'Bane 2: Købmanden'],
  ['skriver_', 'Bane 3: Skriveren'],
  ['landmaaler_', 'Bane 4: Landmåleren'],
];
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const text = (l) => [l.title, l.text].filter(Boolean).join(' – ');

let md = `# Lydfiler til replikker

> Denne fil genereres af \`npm run audio-readme\` ud fra \`src/game/lines.js\`. Ret teksterne dér, ikke her.

Læg en lydfil her med samme navn som replikkens id, så afspilles den automatisk, når teksten vises.
Findes filen ikke, vises kun teksten. Format: \`.mp3\`. Hold dem korte.
`;
const ids = Object.keys(LINES);
const used = new Set();
for (const [prefix, title] of GROUPS) {
  const mine = ids.filter((id) => id.startsWith(prefix));
  if (!mine.length) continue;
  md += `\n## ${title}\n\n| Fil | Tekst |\n|---|---|\n`;
  for (const id of mine) { md += `| \`${id}.mp3\` | ${esc(text(LINES[id]))} |\n`; used.add(id); }
}
const rest = ids.filter((id) => !used.has(id));
if (rest.length) {
  md += `\n## Andre\n\n| Fil | Tekst |\n|---|---|\n`;
  for (const id of rest) md += `| \`${id}.mp3\` | ${esc(text(LINES[id]))} |\n`;
}
md += `\nForklaringen efter et rigtigt svar hos Skriveren (fx "60 + 15 = 75") bygges med tallene og har derfor ingen lydfil. Den vises kun som tekst.\n`;
writeFileSync(new URL('../audio/README.md', import.meta.url), md);
console.log(`audio/README.md skrevet (${ids.length} replikker)`);
