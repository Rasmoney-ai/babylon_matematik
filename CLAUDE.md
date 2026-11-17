# Noter til Claude

Projektet er en immersiv matematik-oplevelse til 5. klasse på Skolen ved Sorte Hest. Den foregår i oldtidens Babylon og kører med WebXR (Quest) og i almindelig browser fra samme kode.

**Didaktisk ramme (besluttet):** "Matematik er noget, mennesker fandt på, fordi de havde brug for det." Eleven oplever behovet, før værktøjet findes. Hver bane: (1) et problem i byen ("hvad ville du gøre?"), (2) eleven løser det med hænderne, (3) et kort "spor i din egen verden". Lidt tekst, korte replikker, hurtig succes. Fire baner: 1 Hyrden, 2 Købmanden, 3 Skriveren, 4 Landmåleren. Scenen er i tusmørke og skal blive ved med det.

- **Stak:** ren three.js (0.170, vendoret i `vendor/three`) via importmap. Der er ingen bundler og intet byggetrin. Hold det sådan, og tilføj kun addons ved at kopiere dem ind i `vendor/three/addons/`.
- **Sprog:** al tekst til eleverne skal være på dansk. Kodekommentarer er også på dansk.
- **Baner og stationer:** `src/game/levels.js` styrer én aktiv bane ad gangen; baner registreres i `main.js` (`Level: null` = kommer snart). En bane bygger alt i `ctx.root` i stationens lokale koordinater. Se "Sådan tilføjer man en bane" i README.
- **Hyrden viser ingen tal**, heller ikke i tekst (testet i `test/lines.test.js`).
- **Lys og skygger:** højst 4 PointLights; to af dem flyttes til den aktive station. Ingen shadow maps, kun blob-skygger (`src/scene/shadows.js`).
- **Replikker** står kun i `src/game/lines.js` med faste id'er og præfiks pr. bane (`hyrde_`, `skriver_` …), så de kan få lydfiler i `audio/<id>.mp3`. Kør `npm run audio-readme` efter ændringer. Skriv aldrig elevtekst direkte i spilkoden. Dynamiske forklaringer med tal (`explain()` i `questions.js`) er undtagelsen.
- **Interaktion** går altid gennem `interaction.add(obj, { onSelect, onHover })`, så mus, touch og VR-controllere virker ens.
- **Matematiklogik** i `src/math` og `src/game/questions.js` må ikke importere three.js og skal have tests i `test/` (`npm test`).
- **Ingen eksterne 3D-modeller endnu.** Miljøet er simple former og canvas-teksturer, så det loader hurtigt på Quest.
- Universet skal kunne udvides med flere steder (Alexandria, maya, Indien). Hold scener og baner adskilt.
- Rasmus foretrækker enkle løsninger, iterativt arbejde og visuel kontrol af resultatet.
