/**
 * Serbian texts (Latin script) — the **second language** of the app.
 *
 * Must have exactly the same keys as `en.ts`. If you add a text in English
 * and forget it here, `npx tsc --noEmit` shows an error on this file.
 *
 * @module i18n/sr
 * @category Translations
 */
import type { Dictionary } from './en';

/**
 * Picks the correct Serbian word form for a number:
 * 1 zona, 2 zone, 5 zona / 1 mesto, 2 mesta, 5 mesta.
 *
 * @param one  Form for 1, 21, 31… (e.g. "zona")
 * @param few  Form for 2–4, 22–24… (e.g. "zone")
 * @param many Form for 0, 5–20, 25… (e.g. "zona")
 */
export function serbianPlural(count: number, one: string, few: string, many: string): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) return one;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) return few;
  return many;
}

const zones = (n: number) => `${n} ${serbianPlural(n, 'zona', 'zone', 'zona')}`;

export const sr: Dictionary = {
  languageName: 'Srpski',

  common: {
    cancel: 'Otkaži',
    delete: 'Obriši',
    save: 'Sačuvaj',
    add: 'Dodaj',
    edit: 'Uredi',
    back: 'Nazad',
    allow: 'Dozvoli',
    allowed: 'Dozvoljeno',
    openSettings: 'Otvori podešavanja',
    comingSoon: 'Uskoro',
    minWalk: (minutes) => `${minutes} min hoda`,
    hoursAgo: (hours) => (hours < 24 ? `Pre ${hours} h` : `Pre ${Math.round(hours / 24)} d`),
  },

  brand: {
    tagline: 'Pravo mesto. Pravi trenutak.',
  },

  features: {
    map: { title: 'Mapa', tabTitle: 'Mapa', description: 'Tvoje zone na mapi.' },
    zones: { title: 'Moje zone', tabTitle: 'Moje zone', description: 'Svi tvoji lični podsetnici.' },
    places: { title: 'Mesta', tabTitle: 'Mesta', description: 'Kultura i prodavnice u blizini' },
    following: { title: 'Pratim', tabTitle: 'Pratim', description: 'Objave i storiji mesta koja pratiš' },
    events: { title: 'Događaji', tabTitle: 'Događaji', description: 'Programi u tvom komšiluku' },
    account: { title: 'Nalog', tabTitle: 'Nalog', description: 'Tvoj profil i prijava' },
    settings: { title: 'Podešavanja', tabTitle: 'Podešavanja', description: 'Izgled aplikacije i dozvole' },
  },

  welcome: {
    title: 'Podsetnici koji znaju gde si',
    subtitle: 'Nacrtaj zonu oko mesta i dobij pravu poruku čim stigneš.',
    features: [
      { title: 'Nacrtaj svoje zone', text: 'Pijaca, posao, biblioteka — izaberi ih na mapi.' },
      { title: 'Beleška ili lista zadataka', text: 'Zapamti šta treba kupiti ili uraditi u svakoj zoni.' },
      { title: 'Iskoči u pravom trenutku', text: 'Kad uđeš u zonu ili izađeš iz nje, telefon te podseti.' },
    ],
    permissionsNote: 'Zatim ćemo tražiti pristup lokaciji i obaveštenjima.',
    getStarted: 'Počni',
  },

  kinds: {
    personal: 'Lično',
    shopping: 'Kupovina',
    task: 'Obaveza',
  },

  map: {
    searchPlaceholder: 'Pronađi mesto ili adresu',
    allZones: (count) => `Sve zone · ${count}`,
    nearby: 'U blizini',
    newZone: 'Nova zona',
    yourPlaces: 'Tvoja mesta',
    allZonesLink: (count) => `Sve zone (${count})`,
    emptyTitle: 'Još nema zona',
    emptyText: 'Dodirni „Nova zona“ i nacrtaj krug oko mesta koje posećuješ.',
    nearbyEmpty: 'Nema zona u krugu od 1 km.',
    searchNotFound: 'Ništa nije pronađeno. Probaj ulicu, broj i grad.',
    locate: 'Moja lokacija',
    profile: 'Nalog',
  },

  zoneRow: {
    itemsLeft: (count) =>
      `${count} ${serbianPlural(count, 'preostao', 'preostala', 'preostalih')} ${serbianPlural(count, 'zadatak', 'zadatka', 'zadataka')}`,
    allDone: 'sve završeno',
    inZone: 'U zoni',
    active: 'Aktivna',
    paused: 'Pauzirana',
  },

  status: {
    ok: 'Lokacija je uključena · Podsetnici rade u pozadini',
    okWhileOpen: 'Lokacija je uključena · Podsetnici rade dok je aplikacija otvorena',
    needsAlways: 'Dozvoli lokaciju „Uvek“ da bi podsetnici radili u pozadini',
    noLocation: 'Pristup lokaciji je isključen — dodirni da dozvoliš',
    locationOff: 'Lokacija je isključena na telefonu',
    noNotifications: 'Obaveštenja su isključena — podsetnici ne mogu da iskoče',
    idle: 'Nema aktivnih zona',
    error: 'Praćenje je zaustavljeno zbog greške — dodirni za detalje',
    watching: (count) => `Pratim ${zones(count)}`,
    worksInBackground: 'Radi i kada je aplikacija zatvorena.',
    worksWhileOpen: 'Radi dok je aplikacija otvorena (test režim).',
    mayBeLate: 'Telefon može da odloži ili blokira podsetnike — dodirni za detalje',
  },

  banner: {
    entered: 'GeoNote · ULAZAK U ZONU',
    left: 'GeoNote · IZLAZAK IZ ZONE',
    now: 'sada',
    openList: 'Otvori listu',
    snooze: 'Za 15 min',
    snoozed: 'Važi — podsetićemo te za 15 minuta.',
  },

  zones: {
    title: 'Moje zone',
    subtitle: (count) => zones(count),
    filterAll: 'Sve',
    filterActive: 'Aktivne',
    filterPaused: 'Pauzirane',
    emptyTitle: 'Ovde nema zona',
    emptyText: 'Napravi zonu oko nekog mesta i dodaj šta želiš da zapamtiš.',
    options: 'Opcije zone',
  },

  zoneDetail: {
    title: 'Detalj zone',
    fromYou: (distance, minutes) => `${distance} od tebe · ${minutes} min hoda`,
    radius: (radius) => `Radijus ${radius}`,
    onEnter: 'Pri ulasku u zonu',
    onExit: 'Pri izlasku iz zone',
    onBoth: 'Pri ulasku i izlasku',
    alongTheWay: 'Usput obavi',
    progress: (done, total) => `${done} od ${total} završeno`,
    note: 'Beleška',
    emptyContent: 'Još nema šta da se zapamti. Dodirni „Uredi“ da dodaš belešku ili listu.',
    activeTitle: 'Podsetnik je aktivan',
    pausedTitle: 'Podsetnik je pauziran',
    activeText: (trigger, repeat, alarm) =>
      `${alarm ? 'Zazvonićemo' : 'Javićemo ti'} kada ${trigger === 'enter' ? 'uđeš u zonu' : trigger === 'exit' ? 'izađeš iz zone' : 'uđeš u zonu i kada izađeš iz nje'}. ` +
      (repeat === 'always' ? 'Ponavlja se pri sledećoj poseti.' : 'Samo jednom.'),
    pausedText: 'Uključi ga da te ovde ponovo podseti.',
    directions: 'Pokaži put do mesta',
    editZone: 'Uredi zonu',
    deleteZone: 'Obriši zonu',
    missing: 'Ova zona više ne postoji.',
  },

  zoneEditor: {
    titleNew: 'Nova zona',
    titleEdit: 'Uredi zonu',
    where: 'Gde želiš podsetnik?',
    namePlaceholder: 'Naziv mesta, npr. Kalenić pijaca',
    search: 'Pretraži adresu',
    pickOnMap: 'Dodirni mapu iznad ili prevuci pin. Povuci ovaj deo nadole da vidiš više mape.',
    movePin: 'Dodirni mapu ili prevuci pin',
    myLocation: 'Moja lokacija',
    radius: 'Radijus zone',
    walk: (minutes) => `Oko ${minutes} min hoda`,
    whatToRemember: 'Šta želiš da zapamtiš?',
    note: 'Beleška',
    list: 'Lista zadataka',
    notePlaceholder: 'Napiši belešku…',
    addTask: 'Dodaj zadatak',
    addTaskPlaceholder: 'npr. mleko, hleb',
    moreOptions: 'Dodatne opcije',
    zoneType: 'Tip zone',
    when: 'Kada',
    onEnter: 'Pri ulasku',
    onExit: 'Pri izlasku',
    onBoth: 'Oba',
    onEnterDesc: 'Kad stigneš',
    onExitDesc: 'Kad odeš',
    onBothDesc: 'Dolazak i odlazak',
    repeat: 'Koliko često',
    everyTime: 'Svaki put',
    onlyOnce: 'Samo jednom',
    alert: 'Kako da te podseti',
    notification: 'Obaveštenje',
    alarm: 'Alarm',
    notificationDesc: 'Obično obaveštenje sa zvukom',
    alarmDesc: 'Zvoni preko celog ekrana dok ga ne isključiš',
    alarmHint: 'Alarm zvoni dok ne pritisneš „Isključi“.',
    alarmExpoGo: 'U test režimu (Expo Go) alarm zvoni samo dok je aplikacija otvorena.',
    resetList: 'Resetuj listu pri svakoj poseti',
    resetListHint: 'Zgodno za nedeljnu listu za kupovinu.',
    smallRadiusWarning:
      'Mala zona zavisi od tačnosti GPS-a (u zatvorenom ±10–30 m). Dok je aplikacija otvorena radi dobro, a u pozadini telefon može da zakasni.',
    save: 'Sačuvaj zonu',
    delete: 'Obriši zonu',
    deleteTitle: 'Obrisati ovu zonu?',
    deleteText: 'Ovo ne može da se poništi.',
    nameRequiredTitle: 'Unesi naziv',
    nameRequiredText: 'Na primer „Kalenić pijaca“ ili „Biblioteka“.',
    notFoundTitle: 'Adresa nije pronađena',
    notFoundText: 'Probaj preciznije: ulica, broj i grad.',
    searchFailedTitle: 'Pretraga nije uspela',
    searchFailedText: 'Proveri internet konekciju.',
    locationUnavailableTitle: 'Lokacija nije dostupna',
    locationUnavailableText: 'Proveri da li je lokacija uključena i dozvoljena za ovu aplikaciju.',
    missing: 'Ova zona više ne postoji.',
  },

  more: {
    title: 'Više',
    tabTitle: 'Više',
    back: 'Više',
    guestTitle: 'Koristiš GeoNote kao gost',
    guestText: 'Tvoje zone ostaju na ovom uređaju.',
    signIn: 'Prijavi se',
    footer: 'Lični podsetnici su i dalje u Mojim zonama.',
    organize: 'Organizuj navigaciju',
    inTabBar: 'U meniju',
  },

  places: {
    title: 'Mesta u blizini',
    subtitle: 'Otkrij javna mesta i njihove objave. Odvojeno od tvojih ličnih zona.',
    searchPlaceholder: 'Naziv mesta ili adresa',
    filterAll: 'Sve',
    filterCulture: 'Kultura',
    filterShops: 'Prodavnice',
    aroundYou: (area) => `Oko tebe · ${area}`,
    nearestFirst: 'Najbliže prvo',
    follow: 'Zaprati',
    following: 'Pratiš',
    noResults: 'Nijedno mesto ne odgovara pretrazi.',
    disclaimer: 'Primeri mesta i adresa su izmišljeni za ovaj prikaz.',
  },

  placeProfile: {
    back: 'Mesta',
    stats: (followers, posts) => `${followers} pratilaca · ${posts} objava`,
    posts: 'Objave',
    events: 'Događaji',
    soon: 'Uskoro',
    exampleProgram: 'PRIMER PROGRAMA',
    eventsSoon: 'Ovde će se pojaviti događaji ovog mesta.',
    disclaimer: 'Izmišljeno mesto i program · konceptualni prikaz.',
    shareMessage: (name, address) => `${name} — ${address}`,
    missing: 'Ovo mesto više ne postoji.',
  },

  post: {
    likes: (count) => `${count} sviđanja`,
    save: 'Sačuvaj',
    saved: 'Sačuvano',
  },

  story: {
    viewPlace: 'Pogledaj mesto',
    disclaimer: 'Primer storija · izmišljeno mesto i kulturni program.',
    close: 'Zatvori',
  },

  following: {
    title: 'Pratim',
    count: (count) => `${count} ${serbianPlural(count, 'mesto', 'mesta', 'mesta')}`,
    emptyTitle: 'Još ne pratiš nijedno mesto',
    emptyText: 'Zaprati mesta u blizini da bi ovde video njihove objave i storije.',
    explore: 'Istraži mesta',
    disclaimer: 'Primeri objava izmišljenih mesta. Programi nisu stvarne najave.',
  },

  events: {
    badge: 'U pripremi',
    title: 'Događaji · Uskoro',
    text: 'Još jedan način da otkriješ komšiluk. Ovaj deo aplikacije još nije dostupan.',
    exampleBadge: 'Primer prikaza',
    exampleMeta: 'Radionica · Kultura',
    exampleTitle: 'Od skice do otiska',
    exampleLine: 'Atelje Krug · Subota, 17 h · Vračar',
    infoTitle: 'Jednog dana, baš kad si GeoNote',
    infoText: 'U budućnosti ćeš moći da dobiješ obaveštenje kada prođeš GeoNote događaja. Ova mogućnost još nije uključena.',
    disclaimer: 'Prikazani program je izmišljen. Tvoji lični podsetnici u Mojim zonama ostaju zasebni.',
    explore: 'Istraži mesta',
  },

  account: {
    title: 'Nalog',
    yourSpace: 'Tvoj prostor',
    guest: 'Gost',
    current: 'Trenutno',
    guestText: 'Do 3 zone · samo na ovom uređaju',
    free: 'Besplatan nalog',
    freePrice: '0 RSD',
    freeText: 'Do 10 zona, sinhronizacija i rezervna kopija.',
    register: 'Registruj se',
    orSignIn: 'ili se prijavi',
    pro: 'GeoNote Pro',
    proPrice: '299 RSD / mes.',
    proText: 'Neograničene zone, deljenje lista i podsetnici po danima i vremenu.',
    explorePro: 'Istraži Pro',
    soonTitle: 'Uskoro',
    soonText: 'Nalozi stižu zajedno sa serverom (faza 2). Za sada sve ostaje na ovom telefonu i nema ograničenja broja zona.',
  },

  settings: {
    title: 'Podešavanja',
    appearance: 'Izgled aplikacije',
    appearanceHint: 'Automatski sa uređajem',
    device: 'Uređaj',
    light: 'Svetla',
    dark: 'Tamna',
    accent: 'Boja akcenta',
    accentNames: { blue: 'Plava', purple: 'Ljubičasta', green: 'Zelena', orange: 'Narandžasta', pink: 'Roze' },
    language: 'Jezik',
    navigation: 'Navigacija',
    organizeHint: 'Izaberi koje sekcije su u donjem meniju.',
    locationRow: 'Lokacija i obaveštenja',
    locationAlways: 'Uvek dozvoljeno',
    locationWhileUsing: 'Dok se aplikacija koristi',
    locationOff: 'Lokacija nije dozvoljena',
    notificationsOn: 'obaveštenja uključena',
    notificationsOff: 'obaveštenja isključena',
    about: (version) => `GeoNote ${version} · tvoji podaci se čuvaju samo na ovom telefonu.`,
  },

  permissions: {
    title: 'Lokacija i obaveštenja',
    sectionPermissions: 'Dozvole',
    location: 'Lokacija',
    locationHint: 'Za mapu i tvoje zone.',
    always: 'Lokacija — uvek',
    alwaysHint: 'Da podsetnici rade i kad je aplikacija zatvorena.',
    notifications: 'Obaveštenja',
    notificationsHint: 'Da bi podsetnici mogli da iskoče.',
    requestAll: 'Zatraži sve dozvole',
    alwaysAlertTitle: 'Dozvoli lokaciju „Uvek“',
    alwaysAlertText: 'U podešavanjima telefona izaberi Lokacija → „Dozvoli uvek“ (Android) ili „Uvek“ (iPhone).',
    locationServicesOff: 'Lokacija je isključena na nivou telefona.',
    batteryTitle: (brand) => `Štednja baterije na ${brand} telefonu`,
    batteryText:
      'Ovaj telefon gasi aplikacije u pozadini da bi štedeo bateriju. Otvori Podešavanja → Aplikacije → GeoNote → Ušteda baterije → „Bez ograničenja“ i uključi „Automatsko pokretanje“.',

    sectionTracking: 'Praćenje lokacije',
    testMode: 'Test režim (Expo Go): podsetnici iskaču dok je aplikacija otvorena. APK radi i kada je aplikacija zatvorena.',
    backgroundDelay: 'Kad je aplikacija zatvorena, Androidu može trebati 1–3 minuta da primeti da si ušao u zonu.',
    refreshRegionHint: 'Imaš više zona nego što telefon može da prati odjednom, pa se prate najbliže.',
    lastRefresh: (date) => `Poslednje osvežavanje: ${date}`,
    refresh: 'Osveži praćenje',
    testNotification: 'Pošalji test obaveštenje',
    testAlarm: 'Pošalji test alarm',
    testFailedTitle: 'Obaveštenje nije poslato',

    sectionTesting: 'Testiranje',
    testingHint: 'Simuliraj ulazak u zonu. Podsetnik iskače kao da si stvarno tamo.',
    simulateArrival: (name) => `Uđi u: ${name}`,
    liveDistance: 'Udaljenost uživo',
    waitingForGps: 'Čekam GPS…',
    gpsAccuracy: (meters, time) => `Tačnost GPS-a ±${meters} m · ${time}`,
    inside: 'U zoni',
    outside: 'Van zone',

    sectionLog: 'Aktivnost',
    logHint: 'Zašto je podsetnik iskočio ili nije. Najnovije prvo.',
    logEmpty: 'Još ništa.',
    clearLog: 'Obriši',
  },

  navigationEditor: {
    title: 'Organizuj navigaciju',
    intro: 'Izaberi do 4 sekcije za donji meni i poređaj ih. „Više“ je uvek poslednje i prikazuje sve sekcije.',
    preview: 'Pregled',
    sectionInBar: (count, max) => `U meniju · ${count} od ${max}`,
    sectionOther: 'Ostale sekcije',
    emptyBar: 'U meniju nema sekcija. Sve je u „Više“.',
    barFull: 'Meni je pun. Ukloni jednu sekciju da bi dodao drugu.',
    moveUp: 'Pomeri gore',
    moveDown: 'Pomeri dole',
    remove: 'Ukloni iz menija',
    add: 'Dodaj u meni',
    reset: 'Vrati podrazumevano',
  },

  notifications: {
    arrivedTitle: (zone) => `${zone} je GeoNote 👋`,
    leavingTitle: (zone) => `Napuštaš: ${zone}`,
    itemsWaiting: (count) =>
      `Tu si! Još ${count} ${serbianPlural(count, 'stvar', 'stvari', 'stvari')} sa tvoje liste ${serbianPlural(count, 'čeka', 'čekaju', 'čeka')} na tebe.`,
    listDone: 'Lista je završena ✓',
    youAreHere: 'Tu si!',
    youAreLeaving: 'Ne zaboravi ništa!',
    andMore: (count) => `…i još ${count}`,
    testTitle: 'Test obaveštenje',
    testBody: 'Ako vidiš ovo, obaveštenja rade. 👍',
    channelName: 'Podsetnici zona',
    channelDescription: 'Iskače kada uđeš u zonu ili izađeš iz nje',
    alarmChannelName: 'Alarmi zona',
    alarmChannelDescription: 'Zvoni kao alarm dok ga ne isključiš',
    statusChannelName: 'Stanje aplikacije',
    statusChannelDescription: 'Javlja kada podsetnici možda ne rade',
    stopAction: 'Isključi',
    testAlarmTitle: 'Test alarm',
    testAlarmBody: 'Pritisni „Isključi“ da ga ugasiš.',
  },

  health: {
    title: 'Da li GeoNote radi?',
    allGood: 'Sve radi',
    lastCheck: (time) => `Poslednja provera: ${time}`,
    lastBackground: (time) => `Poslednja provera u pozadini: ${time}`,
    noBackgroundYet: 'Provera u pozadini još nije pokrenuta (telefon je pokreće otprilike jednom na sat).',
    problemsFound: (count) => (count === 1 ? '1 stvar traži pažnju' : `${count} stvari traže pažnju`),
    idle: 'Nema aktivnih zona — nema šta da se prati.',
    checkNow: 'Proveri ponovo',
    fix: 'Popravi',
    seen: 'U redu',
    expoGo: 'U test režimu (Expo Go) GeoNote radi samo dok je otvoren, pa je čuvar u pozadini isključen.',
    watchdogTitle: 'GeoNote možda spava',
    watchdogBody: (time) =>
      `Nema znaka života od ${time}. Telefon je možda ugasio aplikaciju zbog štednje baterije — otvori GeoNote da podsetnici ponovo rade.`,
    problemNoticeTitle: 'Podsetnici možda neće iskočiti',
    asleepTitle: 'GeoNote je bio uspavan',
    asleepText: (from, to) =>
      `Od ${from} do ${to} telefon nije dozvolio da GeoNote radi u pozadini. Podsetnici u tom periodu su možda propušteni.`,
    later: 'Kasnije',
    howToFix: 'Kako da popravim',
    lateTitle: 'Zakasnili podsetnici',
    lateItem: (zone, time) => `${zone} · ${time}`,
    problems: {
      'location-off': { title: 'Lokacija je isključena na telefonu', text: 'Uključi lokaciju u brzim podešavanjima.' },
      'no-location': { title: 'Nema dozvole za lokaciju', text: 'GeoNote ne može da zna gde si.' },
      'no-background': { title: 'Lokacija nije dozvoljena „Uvek“', text: 'Bez toga podsetnici rade samo dok je aplikacija otvorena.' },
      'no-notifications': { title: 'Obaveštenja su isključena', text: 'Podsetnici ne mogu da iskoče.' },
      'tracking-stopped': { title: 'Telefon je prestao da prati zone', text: 'Ponovno pokretanje nije uspelo. Otvori podešavanja aplikacije i proveri lokaciju.' },
      'background-restricted': { title: 'Rad u pozadini je ograničen', text: 'Telefon ne dozvoljava da GeoNote proverava sebe u pozadini.' },
      'battery-optimized': { title: 'Optimizacija baterije je uključena za GeoNote', text: 'Telefon može da uspava GeoNote. Podesi bateriju na „Bez ograničenja“.' },
      'power-saver': { title: 'Uključena je štednja baterije', text: 'Dok je uključena, podsetnici mogu da kasne.' },
      'was-asleep': { title: 'GeoNote je bio uspavan', text: 'Neko vreme telefon nije dozvolio da radi. Vremena su ispod.' },
      'caught-late': { title: 'Podsetnik je zakasnio', text: 'Telefon nije javio dolazak — GeoNote ga je našao tek kad si otvorio aplikaciju.' },
    },
  },

  alarm: {
    label: 'Podsetnik',
    stop: 'Isključi alarm',
    openZone: 'Otvori zonu',
    snooze: (minutes) => `Odloži ${minutes} min`,
    stillToDo: 'Još treba',
  },
};
