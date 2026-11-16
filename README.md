# Tavlehuset i Babylon

En immersiv matematik-oplevelse i det gamle Babylon. Den virker i VR (Meta Quest-browseren) og i en almindelig browser.

Eleven er lærling i *eduba*, Babylons skriverskole ("tavlehuset"). Bag gårdens blå port rejser zigguraten sig. På skriverbordet ligger lertavler med kileskrift-tal, som eleven skal lære at læse i 60-talssystemet, som babylonierne brugte. Det er derfor, vi i dag har 60 minutter i en time.

## Bane 1: Læs tavlen

Der er otte tavler i stigende sværhedsgrad:

1. **Kiler**: en lodret kile er 1.
2. **Vinkler**: en vinkel ‹ er 10.
3. **Pladsværdi**: på pladsen til venstre er hver kile 60.
4. **Flere 60'ere**: tal op til 599.

De forkerte svar er bygget på typiske misforståelser, fx at læse 1|15 som 16, fordi man glemmer pladsværdien. Efter et forkert svar kommer et hint, og efter et rigtigt svar forklares regnestykket (60 + 15 = 75).

## Kør det

Det er en ren statisk side uden byggetrin. three.js ligger i `vendor/`, så siden virker også på et skolenetværk uden adgang til CDN'er.

```bash
npm start            # eller: python3 -m http.server 8080
```

Åbn http://localhost:8080. VR kræver https, så brug GitHub Pages til headsettet.

**Styring i browser:** træk for at kigge, WASD/piletaster for at gå, klik på tavlerne.
**Styring i VR:** peg med controlleren og tryk på aftrækkeren.

## Tekst og lyd

Alle replikker står i `src/game/lines.js`, og hver replik har et id. Læg en indtalt fil som `audio/<id>.mp3`, så afspilles den automatisk. Se [audio/README.md](audio/README.md).

## Struktur

```
index.html              importmap + hjælpetekst
src/main.js             renderer, WebXR, game loop
src/scene/eduba.js      miljøet: gård, port, ziggurat, palmer
src/objects/            lertavler, svarbrikker, tekstplade (canvas-teksturer)
src/core/               pege-og-vælg (mus + VR), browser-styring, lyd
src/game/               baner, opgavegenerator, replikker
src/math/               60-talssystemet (ren logik)
test/                   node-tests: npm test
```

## Idéer til næste skridt

- Bane 2: *skriv* tal ved at trykke kiler og vinkler ind i ler.
- Bane 3: opmåling af marker (areal) og fordeling af korn (division).
- Flere steder i samme univers: Alexandria, mayaerne, Indien (nullet).
