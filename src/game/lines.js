// Alle replikker i spillet, samlet ét sted.
// Hvert id kan få en lydfil: læg den som  audio/<id>.mp3  så afspilles den automatisk.
// Findes filen ikke, vises kun teksten. Se audio/README.md.

export const LINES = {
  velkommen: {
    title: 'Velkommen til tavlehuset',
    text: 'Du er ny lærling i Babylons skriverskole. Her regner vi i 60’ere. Peg på lertavlen BEGYND for at starte.',
  },
  intro_kiler: {
    title: 'Kiler tæller 1',
    text: 'Hver lodret kile er 1. Tæl kilerne på tavlen og vælg det rigtige tal.',
  },
  intro_vinkler: {
    title: 'Vinkler tæller 10',
    text: 'Nu kommer vinklen ‹. Den er 10. Tæl vinklerne først, så kilerne.',
  },
  intro_60: {
    title: 'Pladsen til venstre',
    text: 'Se godt efter: der står noget på pladsen til venstre. Dér er hver kile ikke 1, men 60!',
  },
  spoergsmaal: { title: 'Hvilket tal står der?', text: 'Læs tavlen og peg på det rigtige tal.' },
  hint_kiler: { title: 'Prøv igen', text: 'Tæl de lodrette kiler. Hver kile er 1.' },
  hint_vinkler: { title: 'Prøv igen', text: 'En vinkel ‹ er 10. En lodret kile er 1. Tæl vinklerne først.' },
  hint_60: { title: 'Prøv igen', text: 'Se på pladsen til venstre: dér er hver kile 60, ikke 1!' },
  rigtigt_1: { title: 'Rigtigt!', text: '' },
  rigtigt_2: { title: 'Flot læst!', text: '' },
  rigtigt_3: { title: 'Præcis!', text: '' },
  faerdig: {
    title: 'Første prøve bestået',
    text: 'Du kan læse babylonske tal! Læreren er tilfreds. Peg på IGEN for at prøve nye tavler.',
  },
};

/** Hvilken intro der hører til hvert trin (vises første gang trinnet dukker op). */
export const STAGE_INTRO = { A: 'intro_kiler', B: 'intro_vinkler', C: 'intro_60' };
export const STAGE_HINT = { A: 'hint_kiler', B: 'hint_vinkler', C: 'hint_60', D: 'hint_60' };
/** Tekst på knap-brikker (ingen lyd). */
export const BUTTONS = { start: 'BEGYND', igen: 'IGEN' };

export const PRAISE = ['rigtigt_1', 'rigtigt_2', 'rigtigt_3'];
