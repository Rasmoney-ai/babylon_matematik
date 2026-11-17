# Tavlehuset i Babylon

En immersiv matematik-oplevelse i det gamle Babylon. Den virker i VR (Meta Quest-browseren) og i en almindelig browser.

Matematikken i spillet bygger på én idé: **matematik er noget, mennesker fandt på, fordi de havde brug for det.** Eleven møder et problem i byen, før værktøjet findes ("hvad ville du gøre?"), løser det med hænderne og slutter hver bane med et kort *spor i din egen verden*: hvor gør vi det samme i dag? Kort tekst, korte replikker, hurtig succes.

## Banerne

Man starter i gården ved skriverbordet. Her ligger fire lerbrikker, én pr. bane. Baner, der ikke er bygget endnu, er dæmpede ("kommer snart"), og gennemførte baner får et lille blåt segl (gemt i `localStorage`). Efter en bane fører NÆSTE videre til den næste (Hyrden → Købmanden → Skriveren).

Under tekstpladen på hver station hænger en lille, mørkere brik **‹ TIL GÅRDEN**, så man kan forlade en bane midtvejs. Den kræver to tryk (første tryk viser TRYK IGEN), så den ikke trykkes ved et uheld.

1. **Hyrden** – hvorfor tæller vi? (bygget) Ved en fårefold uden for porten. Fårene kommer hjem, men der findes ingen tal. Eleven lægger én lerkugle i krukken for hvert får, kontrollerer ved at parre kugler og får én-til-én, og opdager næste aften, at kuglen der bliver til overs, er fåret der mangler. Der vises ingen tal i banen.
2. **Købmanden** – gruppering, og hvorfor 60. (bygget) Ved en markedsbod uden for porten, på den anden side af vejen. En uoverskuelig bunke på 34 lerkugler bliver overskuelig, når ti kugler byttes til én kegle (3 kegler og 4 kugler – idéen bag vores tiere). Så deler eleven brød mellem arbejdere (kurve): 10 brød går sjældent op, 60 brød går op med 2, 3, 4, 5 og 6 – men ikke 7. Babylonierne samlede i bundter på 60, måske fordi 60 er så let at dele (ingen ved det sikkert). Spor i din verden: en time har 60 minutter, og et kvarter er 15.
3. **Skriveren** – pladsværdi: læs kileskrift-tal i 60-talssystemet. (bygget) Otte tavler i stigende sværhedsgrad: kiler (1), vinkler (10), pladsen til venstre (60) og flere 60'ere. De forkerte svar bygger på typiske misforståelser, fx at læse 1|15 som 16.
4. **Landmåleren** – reb og areal. (kommer)

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
src/main.js             renderer, WebXR, game loop, registrering af baner
src/scene/eduba.js      gården, porten, zigguraten (station "gaard")
src/scene/fold.js       fårefolden uden for porten (station "fold")
src/scene/market.js     markedsboden på den anden side af vejen (station "marked")
src/scene/props.js      fælles byggeklodser: mure, palmer, krukker, lamper, flammer
src/scene/shadows.js    bløde "blob"-skygger (ingen shadow maps)
src/objects/            lertavler, brikker, tekstplade, får, krukke og skål, købmandens varer (goods.js)
src/core/               pege-og-vælg (mus + VR), browser-styring, fade, lyd
src/game/levels.js      bane-manager: stationer, aktiv bane, fremdrift
src/game/hub.js         banevælgeren i gården
src/game/hyrde.js       bane 1     src/game/koebmand.js  bane 2     src/game/skriver.js  bane 3
src/game/lines.js       alle replikker (præfiks pr. bane)
src/math/               ren logik: 60-talssystemet, én-til-én-parring, bundter og deling med rest
tools/audio-readme.mjs  genererer audio/README.md (npm run audio-readme)
test/                   node-tests: npm test
```

## Sådan tilføjer man en bane

1. Hvis banen skal et nyt sted hen, så byg stedet i `src/scene/<sted>.js` og returnér en station: `{ id, position, yaw, bounds, view, lights, anchors: { panel, panelYaw?, panelScale?, buttons, ... } }`. Alt i stationen er i lokale koordinater (eleven står i 0,0,0 og ser mod -z). Tilføj den i `stations` i `main.js`.
2. Skriv banen som en klasse i `src/game/<bane>.js` med `constructor(ctx)`, `start()`, `stop()` og `update(dt)`. Byg alt i `ctx.root` (sidder på stationen), vis tekst med `ctx.say(id)` og kald `ctx.complete()`, når banen er gennemført.
3. Læg replikkerne i `lines.js` med banens præfiks og kør `npm run audio-readme`. Ren matematiklogik går i `src/math` med tests.
4. Sæt `Level` på banens linje i `main.js` (fx `{ id: 'koebmand', station: 'marked', Level: KoebmandLevel }`). Så bliver brikken i gården aktiv, og NÆSTE dukker op efter banen før.

## Test i konsollen

`__babylon.levels.open('hyrde')` åbner en bane, `__babylon.levels.timeScale = 6` spoler den aktive bane frem, og `__babylon.level('hyrde')` giver bane-objektet (fx `.tapBowl()`, `.pressButton()`). Købmanden kan startes ved et senere trin: `__babylon.level('koebmand').startAt('C')` (A, B, C eller E).

## Idéer til næste skridt

- Bane 4 Landmåleren.
- Skriveren: *skriv* tal ved at trykke kiler og vinkler ind i ler.
- Flere steder i samme univers: Alexandria, mayaerne, Indien (nullet).
