# Noter til Claude

Projektet er en immersiv matematik-oplevelse til 5. klasse på Skolen ved Sorte Hest. Den foregår i oldtidens Babylon og kører med WebXR (Quest) og i almindelig browser fra samme kode.

- **Stak:** ren three.js (0.170, vendoret i `vendor/three`) via importmap. Der er ingen bundler og intet byggetrin. Hold det sådan, og tilføj kun addons ved at kopiere dem ind i `vendor/three/addons/`.
- **Sprog:** al tekst til eleverne skal være på dansk. Kodekommentarer er også på dansk.
- **Replikker** står kun i `src/game/lines.js` med faste id'er, så de kan få lydfiler i `audio/<id>.mp3`. Skriv aldrig elevtekst direkte i spilkoden. Dynamiske forklaringer med tal (`explain()` i `questions.js`) er undtagelsen.
- **Interaktion** går altid gennem `interaction.add(obj, { onSelect, onHover })`, så mus, touch og VR-controllere virker ens.
- **Matematiklogik** i `src/math` og `src/game/questions.js` må ikke importere three.js og skal have tests i `test/` (`npm test`).
- **Ingen eksterne 3D-modeller endnu.** Miljøet er simple former og canvas-teksturer, så det loader hurtigt på Quest.
- Universet skal kunne udvides med flere steder (Alexandria, maya, Indien). Hold scener og baner adskilt.
- Rasmus foretrækker enkle løsninger, iterativt arbejde og visuel kontrol af resultatet.
