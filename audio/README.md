# Lydfiler til replikker

Læg en lydfil her med samme navn som replikkens id, så afspilles den automatisk, når teksten vises.
Findes filen ikke, vises kun teksten. Teksterne redigeres i `src/game/lines.js`.

Format: `.mp3`. Hold dem korte.

| Fil | Tekst |
|---|---|
| `velkommen.mp3` | Velkommen til tavlehuset – Du er ny lærling i Babylons skriverskole. Her regner vi i 60’ere. Peg på lertavlen BEGYND for at starte. |
| `intro_kiler.mp3` | Kiler tæller 1 – Hver lodret kile er 1. Tæl kilerne på tavlen og vælg det rigtige tal. |
| `intro_vinkler.mp3` | Vinkler tæller 10 – Nu kommer vinklen ‹. Den er 10. Tæl vinklerne først, så kilerne. |
| `intro_60.mp3` | Pladsen til venstre – Se godt efter: der står noget på pladsen til venstre. Dér er hver kile ikke 1, men 60! |
| `spoergsmaal.mp3` | Hvilket tal står der? – Læs tavlen og peg på det rigtige tal. |
| `hint_kiler.mp3` | Prøv igen – Tæl de lodrette kiler. Hver kile er 1. |
| `hint_vinkler.mp3` | Prøv igen – En vinkel ‹ er 10. En lodret kile er 1. Tæl vinklerne først. |
| `hint_60.mp3` | Prøv igen – Se på pladsen til venstre: dér er hver kile 60, ikke 1! |
| `rigtigt_1.mp3` | Rigtigt! |
| `rigtigt_2.mp3` | Flot læst! |
| `rigtigt_3.mp3` | Præcis! |
| `faerdig.mp3` | Første prøve bestået – Du kan læse babylonske tal! Læreren er tilfreds. Peg på IGEN for at prøve nye tavler. |

Forklaringen efter et rigtigt svar (fx "60 + 15 = 75") bygges med tallene og har derfor ingen lydfil. Den vises kun som tekst.
