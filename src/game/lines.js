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

  // --- Bane 2: Købmanden (gruppering, og hvorfor 60 er godt at dele med) ----------------
  // Tal er tilladt her, men hold dem få og store.
  koebmand_problem: {
    title: 'Hvor mange er der?',
    text: 'En stor flok er talt med lerkugler. Kan du se, hvor mange der er? Det kan købmanden heller ikke.',
  },
  koebmand_ide: {
    title: 'Byt ti til én',
    text: 'Købmanden har en idé: ti små kugler byttes til én kegle. Peg på skålen for at bytte.',
  },
  koebmand_bytter: {
    title: 'Ti bliver til én',
    text: 'Bliv ved, så længe der er ti kugler at bytte.',
  },
  koebmand_samlet: {
    title: 'Nu kan man se det!',
    text: 'Tre kegler og fire kugler: 34. Det kan man se med ét blik. At samle i bundter på ti er idéen bag vores egne tiere.',
  },
  koebmand_brod: {
    title: 'Del brødet',
    text: 'Købmanden skal dele 10 brød ligeligt mellem sine arbejdere. Hvor mange arbejdere? Peg på en brik.',
  },
  koebmand_gaar_op: {
    title: 'Det går op!',
    text: 'Alle får lige mange.',
  },
  koebmand_rest: {
    title: 'Brød til overs',
    text: 'Der er brød til overs – det giver ballade!',
  },
  koebmand_ti_svaer: {
    title: '10 er besværligt',
    text: 'Ti brød kan kun deles ligeligt mellem 2 eller 5. Købmanden prøver noget andet: en bakke med 60 brød.',
  },
  koebmand_60: {
    title: '60 brød',
    text: 'Del de 60 brød mellem arbejderne. Prøv forskellige antal.',
  },
  koebmand_udfordring: {
    title: 'Det går op igen!',
    text: 'Kan du finde en deling, der IKKE går op?',
  },
  koebmand_7: {
    title: 'Den gik ikke op!',
    text: 'Godt fundet. 60 er ikke magisk – men det kan deles på rigtig mange måder.',
  },
  koebmand_hvorfor60: {
    title: 'Bundter på 60',
    text: 'Babylonierne samlede i bundter på 60, ikke på 10. Forskerne tror, det var, fordi 60 er så let at dele. Men ingen ved det helt sikkert.',
  },
  koebmand_spor: {
    title: 'Spor i din verden',
    text: 'En time har 60 minutter. Se hvor let den er at dele: en halv time, et kvarter, en tredjedel.',
  },
  koebmand_kvarter: {
    title: 'Spor i din verden',
    text: 'Hver gang du siger »et kvarter«, regner du som en babylonier.',
  },
  koebmand_bro: {
    title: 'Men hvordan …',
    text: '… skriver man så store tal ned i ler? Det lærer du hos Skriveren.',
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
    text: 'Du kan læse babylonske tal! Læreren er tilfreds. Peg på NÆSTE for at møde Landmåleren, eller IGEN for nye tavler.',
  },

  // --- Bane 4: Landmåleren (reb, omkreds og areal) ---------------------------------
  landmaaler_problem: {
    title: 'Hvor er marken?',
    text: 'Floden er gået over sine bredder og har skyllet markskellene væk. Bonden ved ikke, hvor hans mark er, eller hvor meget korn han kan så. Hvad ville du gøre?',
  },
  landmaaler_reb: {
    title: 'Landmålerens reb',
    text: 'Landmåleren har et reb med knuder. Fra knude til knude er der ét skridt. Bondens tavle siger, hvor stor marken var.',
  },
  landmaaler_bredde: {
    title: 'Hvor bred?',
    text: 'Se på bondens tavle. Hvor mange skridt er marken bred? Peg på en brik.',
  },
  landmaaler_laengde: {
    title: 'Hvor lang?',
    text: 'Og hvor mange skridt er den lang?',
  },
  landmaaler_hint_tavle: {
    title: 'Se på tavlen',
    text: 'Bondens tavle viser det. Prøv igen.',
  },
  landmaaler_spaendt: {
    title: 'Rebet er spændt',
    text: 'Nu kan bonden se sin mark igen. Rebet deler den i felter på ét skridt gange ét skridt.',
  },
  landmaaler_saa: {
    title: 'Hvor meget korn?',
    text: 'I hvert felt kan bonden så en håndfuld korn. Så den forreste række: peg på hvert felt.',
  },
  landmaaler_raekker: {
    title: 'Én række er sået',
    text: 'Hvor mange rækker er der i alt? Peg på en brik.',
  },
  landmaaler_hint_raekker: {
    title: 'Tæl rækkerne',
    text: 'Tæl rækkerne fra den forreste og bagud.',
  },
  landmaaler_15: {
    title: '15 felter!',
    text: '3 rækker med 5 i hver giver 15 felter. Det skriver vi 3 × 5 = 15.',
  },
  landmaaler_nyt_reb: {
    title: 'Ét reb på 16 skridt',
    text: 'Bonden vil hegne en ny mark med et reb på 16 skridt. Tror du, det er lige meget, hvordan rebet ligger?',
  },
  landmaaler_proev: {
    title: 'Prøv!',
    text: 'Vælg, hvor bred marken skal være. Længden følger med, for rebet er det samme.',
  },
  landmaaler_form: {
    title: 'Samme reb',
    text: '',
  },
  landmaaler_overraskelse: {
    title: 'Overraskelse!',
    text: 'Det var ikke lige meget. Samme reb gav 7 felter eller 16 felter! Den firkantede mark giver mest korn.',
  },
  landmaaler_ret_gaet: {
    title: 'Du havde ret!',
    text: 'Samme reb gav 7 felter eller 16 felter. Den firkantede mark giver mest korn.',
  },
  landmaaler_forudsig: {
    title: 'Regn det ud først',
    text: 'Naboens mark er 5 skridt bred og 5 skridt lang. Hvor mange felter er der? Regn det ud, FØR vi sår.',
  },
  landmaaler_hint_20: {
    title: '20 er rebet',
    text: 'Rebet rundt om marken er 20 skridt. Men hvor mange felter er der inden for rebet?',
  },
  landmaaler_hint_10: {
    title: 'Ikke helt',
    text: '5 + 5 er kun to rækker. Hvor mange rækker med 5 er der?',
  },
  landmaaler_rigtigt: {
    title: 'Lad os se efter',
    text: 'Nu sår vi og ser, om du havde ret.',
  },
  landmaaler_pointe: {
    title: 'Matematik kan spå',
    text: 'Du vidste, at der var 25 felter, før der var sået et eneste frø. Sådan kunne landmåleren fortælle bonden, hvor meget korn han skulle bruge.',
  },
  landmaaler_spor: {
    title: 'Spor i din verden',
    text: 'Samme hegn kan give en hundegård med god plads eller en smal gang. Det gælder også, når man kridter en fodboldbane op.',
  },
  landmaaler_kvadratmeter: {
    title: 'Kvadratmeter',
    text: 'Når man lægger gulv eller maler en væg, tæller man felter på 1 meter gange 1 meter. Dem kalder vi kvadratmeter.',
  },
  landmaaler_slut: {
    title: 'Rejsen er slut',
    text: 'Tælle, samle i bundter, skrive ned og måle: alt sammen fandt mennesker på, fordi de havde brug for det. Nu kan du det også.',
  },

  // --- Gården, når alle fire baner er gennemført -------------------------------------
  gaard_alle_faerdige: {
    title: 'Hele rejsen er gennemført',
    text: 'Du har talt som hyrden, samlet i bundter som købmanden, skrevet som skriveren og målt som landmåleren. Peg på en brik for at prøve en bane igen.',
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
  // Lille brik under tekstpladen på alle stationer: forlad banen midtvejs (to tryk)
  forlad: '‹ TIL GÅRDEN',
  forladIgen: 'TRYK IGEN',
  // Gården: nulstil fremdriften, så næste elev kan starte forfra (to tryk)
  forfra: 'FORFRA',
  // Landmåleren: gæt før man prøver
  ja: 'JA',
  nej: 'NEJ',
};

// --- Landmåleren: korte, dynamiske tekster med tal (ingen lydfil) -----------------------
/** Fx "Rebet: 2 + 6 + 2 + 6 = 16 skridt." */
export function ropeText(w, l) {
  return `Rebet: ${w} + ${l} + ${w} + ${l} = ${2 * (w + l)} skridt.`;
}
/** Fx "2 rækker med 6 i hver: 12 felter." */
export function fieldText(w, l) {
  return `${w} ${w === 1 ? 'række' : 'rækker'} med ${l} i hver: ${w * l} felter.`;
}
/** Små tilføjelser til panelet hos Landmåleren. */
export const LANDMAALER_HINT = {
  felterSmaat: 'felter',
  skridt: 'skridt',
  klar: 'Peg på VIDERE, når du er klar.',
  proevet: 'Prøvet:',
};

// --- Købmanden: korte, dynamiske tekster med tal (ingen lydfil, ligesom explain()) ------
/** Fx "20 til hver." eller "3 til hver, 1 til overs." */
export function shareText({ each, rest }) {
  return rest ? `${each} til hver, ${rest} til overs.` : `${each} til hver.`;
}
/** Fx "Prøv også 3 og 4." eller "Prøv også 4." */
export function tryAlsoText(missing) {
  return `Prøv også ${missing.join(' og ')}.`;
}
/** Små tilføjelser til panelet under delingen. */
export const KOEBMAND_HINT = {
  proev34: 'Prøv også 3 eller 4.',
  klar: 'Peg på VIDERE, når du er klar.',
  igen: 'Prøv et andet antal.',
  proevet: 'Prøvet:',
};
/** Timeskiven: fremhævet stykke og tekst under skiven. */
export const HOUR_PARTS = [
  { minutes: 30, label: 'en halv time = 30 min' },
  { minutes: 15, label: 'et kvarter = 15 min' },
  { minutes: 20, label: 'en tredjedel = 20 min' },
];
