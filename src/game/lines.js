// Alle replikker i spillet, samlet ét sted.
// Hvert id kan få en lydfil: læg den som  audio/<id>.mp3  så afspilles den automatisk.
// Findes filen ikke, vises kun teksten. Se audio/README.md (genereres: npm run audio-readme).
//
// Id'erne har præfiks pr. bane: gaard_ (startstedet), hyrde_, koebmand_, skriver_, landmaaler_.
// VIGTIGT for hyrde_: ingen tal eller cifre – heller ikke talord som "tolv".

export const LINES = {
  // --- Gården: startsted og banevælger --------------------------------------------
  gaard_velkommen: {
    title: 'Tavlehuset i Babylon',
    text: 'Matematik er noget, mennesker fandt på, fordi de havde brug for det. Peg på en lerbrik på bordet for at vælge en bane. Begynd gerne hos Hyrden.',
  },
  gaard_kommer_snart: {
    title: 'Kommer snart',
    text: 'Den bane er ikke bygget endnu. Vælg en af de andre brikker.',
  },

  // --- Bane 1: Hyrden (hvorfor tæller vi?) ------------------------------------------
  hyrde_problem: {
    title: 'Kommer alle fårene hjem?',
    text: 'Hyrden driver fårene hjem fra græsning. I morgen aften vil han vide, om de alle er kommet hjem igen. Men der findes ingen tal endnu! Hvad ville du gøre?',
  },
  hyrde_metode: {
    title: 'Én kugle for hvert får',
    text: 'Hyrden har en idé: Læg én lerkugle i krukken for hvert får, der går ind gennem lågen. Peg på skålen, hver gang et får går ind.',
  },
  hyrde_aften1: {
    title: 'Fårene kommer',
    text: 'Peg på skålen, når et får går ind gennem lågen.',
  },
  hyrde_parring: {
    title: 'Passer det?',
    text: 'Lad os se efter: hver kugle skal have sit eget får.',
  },
  hyrde_parring_ok: {
    title: 'Det passer!',
    text: 'Hvert får har sin kugle, og ingen kugle er til overs. Nu husker krukken flokken for os.',
  },
  hyrde_for_mange: {
    title: 'Kugler til overs',
    text: 'Nogle kugler har ikke noget får. Læg kun én kugle, når et får går ind. Vi prøver igen.',
  },
  hyrde_for_faa: {
    title: 'Får uden kugle',
    text: 'Nogle får har ikke fået en kugle. Peg på skålen, hver gang et får går ind. Vi prøver igen.',
  },
  hyrde_igen: {
    title: 'En gang til',
    text: 'Fårene er ude igen. Denne gang går de lidt langsommere.',
  },
  hyrde_naeste_aften: {
    title: 'Næste aften',
    text: '',
  },
  hyrde_aften2: {
    title: 'Er alle kommet hjem?',
    text: 'Nu gør vi det omvendt: tag én kugle OP af krukken for hvert får, der går ind. Peg på krukken.',
  },
  hyrde_aften2_gang: {
    title: 'Fårene kommer',
    text: 'Peg på krukken, når et får går ind gennem lågen.',
  },
  hyrde_aften2_for_mange: {
    title: 'Kugler uden får',
    text: 'Du tog nogle kugler op, som ikke har et får. De skal tilbage i krukken.',
  },
  hyrde_aften2_for_faa: {
    title: 'Får uden kugle',
    text: 'Nogle får gik ind, uden at du tog en kugle op. Peg på krukken én gang for hvert af dem.',
  },
  hyrde_mangler: {
    title: 'Der mangler et får!',
    text: 'Alle fårene er gået ind, men der ligger stadig en kugle i krukken. Kuglen til overs er et får, der mangler! Lyt efter … kan du finde det?',
  },
  hyrde_lyt_hint: {
    title: 'Lyt efter brægen',
    text: 'Fåret er et sted i nærheden. Kig dig omkring – måske bag muren ved palmen?',
  },
  hyrde_fundet: {
    title: 'Der var det!',
    text: 'Fåret løber hjem til de andre. Tag nu den sidste kugle op af krukken.',
  },
  hyrde_pointe: {
    title: 'Hele flokken er hjemme',
    text: 'Du holdt styr på en hel flok uden et eneste tal. Det her er begyndelsen på matematikken.',
  },
  hyrde_spor: {
    title: 'Spor i din verden',
    text: 'Når du sætter streger for at tælle, eller tæller på fingrene, gør du det samme: én for hver.',
  },
  hyrde_bro: {
    title: 'Men hvad nu …',
    text: '… hvis der er rigtig mange får? Krukken bliver hurtigt fuld. Det finder Købmanden en løsning på.',
  },

  // --- Bane 3: Skriveren (pladsværdi i 60-talssystemet) ----------------------------
  skriver_velkommen: {
    title: 'Velkommen til tavlehuset',
    text: 'Du er ny lærling i Babylons skriverskole. Ingen gider trykke 95 kiler i leret, så skriverne fandt på noget smartere: her regner vi i 60’ere. Peg på lertavlen BEGYND for at starte.',
  },
  skriver_intro_kiler: {
    title: 'Kiler tæller 1',
    text: 'Hver lodret kile er 1. Tæl kilerne på tavlen og vælg det rigtige tal.',
  },
  skriver_intro_vinkler: {
    title: 'Vinkler tæller 10',
    text: 'Nu kommer vinklen ‹. Den er 10. Tæl vinklerne først, så kilerne.',
  },
  skriver_intro_60: {
    title: 'Pladsen til venstre',
    text: 'Se godt efter: der står noget på pladsen til venstre. Dér er hver kile ikke 1, men 60!',
  },
  skriver_spoergsmaal: { title: 'Hvilket tal står der?', text: 'Læs tavlen og peg på det rigtige tal.' },
  skriver_hint_kiler: { title: 'Prøv igen', text: 'Tæl de lodrette kiler. Hver kile er 1.' },
  skriver_hint_vinkler: { title: 'Prøv igen', text: 'En vinkel ‹ er 10. En lodret kile er 1. Tæl vinklerne først.' },
  skriver_hint_60: { title: 'Prøv igen', text: 'Se på pladsen til venstre: dér er hver kile 60, ikke 1!' },
  skriver_rigtigt_1: { title: 'Rigtigt!', text: '' },
  skriver_rigtigt_2: { title: 'Flot læst!', text: '' },
  skriver_rigtigt_3: { title: 'Præcis!', text: '' },
  skriver_faerdig: {
    title: 'Første prøve bestået',
    text: 'Du kan læse babylonske tal! Læreren er tilfreds. Peg på IGEN for nye tavler eller TIL GÅRDEN for at vælge en anden bane.',
  },
};

/** Banernes navne, som de står på lerbrikkerne i gården (ingen lyd). */
export const LEVEL_TITLES = {
  hyrde: 'Hyrden',
  koebmand: 'Købmanden',
  skriver: 'Skriveren',
  landmaaler: 'Landmåleren',
};

/** Skriveren: hvilken intro der hører til hvert trin (vises første gang trinnet dukker op). */
export const STAGE_INTRO = { A: 'skriver_intro_kiler', B: 'skriver_intro_vinkler', C: 'skriver_intro_60' };
export const STAGE_HINT = { A: 'skriver_hint_kiler', B: 'skriver_hint_vinkler', C: 'skriver_hint_60', D: 'skriver_hint_60' };
export const PRAISE = ['skriver_rigtigt_1', 'skriver_rigtigt_2', 'skriver_rigtigt_3'];

/** Tekst på knap-brikker (ingen lyd). */
export const BUTTONS = {
  start: 'BEGYND',
  igen: 'IGEN',
  naeste: 'NÆSTE',
  gaarden: 'TIL GÅRDEN',
  kommerSnart: 'kommer snart',
  // Hyrden
  hvad: 'HVAD GØR VI?',
  lukInd: 'LUK FÅRENE IND',
  proevIgen: 'PRØV IGEN',
  videre: 'VIDERE',
};
