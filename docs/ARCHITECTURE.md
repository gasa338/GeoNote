---
title: Arhitektura (vodič kroz kod)
---

# Arhitektura — vodič kroz kod (verzija 2.0 „GeoNote“)

Ovaj dokument objašnjava **kako je aplikacija složena** i **gde šta menjaš**.
Komentari u kodu su na engleskom (glavni jezik aplikacije), a vodič je na srpskom.

HTML dokumentacija iz komentara: `npm run docs` → otvori `docs/api/index.html`.

---

## 1. Princip

- **Bez apstraktnih slojeva.** `createZone()` u `data/zones.ts` pročita listu, doda zonu, sačuva listu. To je sve.
- **Jedna celina = jedan folder** u `src/features/`. Kad unapređuješ npr. „Mesta“, radiš u `src/features/places/`.
- **Fajlovi u `src/app/` su jedan red** — samo kažu koji ekran se otvara na kojoj adresi.
- **Svi tekstovi su u `i18n/en.ts` i `i18n/sr.ts`** (TypeScript proverava da prevod postoji).

---

## 2. Glavni pojam: Zona

Zona = krug na mapi + šta da zapamtiš (beleška ili lista) + kako da te podseti.

| Polje | Značenje |
|---|---|
| `name`, `address`, `latitude`, `longitude`, `radius` | gde je zona |
| `kind` | tip: Lično / Kupovina / Obaveza (ikonica i boja) |
| `contentMode`, `note`, `checklist` | beleška ili lista zadataka |
| `trigger` | pri ulasku, pri izlasku ili **oba** (`enter` / `exit` / `both`) |
| `repeat` | svaki put / samo jednom |
| `alertStyle` | obaveštenje ili alarm (vidi odeljak 5a) |
| `active` | „Podseti me pri ulasku“ |
| `resetChecklistOnTrigger` | lista se odštiklira pri svakoj poseti |
| `lastTriggerEvent` | šta je poslednje iskočilo (ulazak/izlazak) — za okidač „oba“ |

Podaci iz verzije 1.x (posebna „mesta“ i „podsetnici“) automatski se pretvaraju u zone
pri prvom pokretanju (`data/zones.ts → migrateFromV1`). Stari podaci ostaju netaknuti.

---

## 3. Struktura foldera

```
src/
├── app/                        ← RUTE (1 red po fajlu)
│   ├── _layout.tsx             ← start, alarm, tap na obaveštenje, banner
│   ├── (tabs)/_layout.tsx      ← donji meni (iz podešavanja)
│   ├── (tabs)/index.tsx        → features/map/MapScreen
│   ├── (tabs)/zones/           → lista zona + detalj zone (/zones/<id>)
│   ├── (tabs)/places/          → mesta u blizini + profil mesta (/places/<id>)
│   ├── (tabs)/following.tsx, events.tsx, account.tsx, settings.tsx, more.tsx
│   ├── edit-zone/[id].tsx      → nova zona (/edit-zone/new) / izmena
│   ├── story/[placeId].tsx     → storiji preko celog ekrana
│   ├── alarm/[id].tsx          → alarm preko celog ekrana
│   ├── permissions.tsx         → Lokacija i obaveštenja
│   ├── navigation.tsx          → Organizuj navigaciju
│   └── welcome.tsx
│
├── features/                   ← ★ CELINE
│   ├── map/                    ← početni ekran sa mapom
│   ├── zones/                  ← lista, detalj, uređivač, zoneActions (uredi/obriši), zoneVisuals
│   ├── places/                 ← mesta u blizini, profil, storiji, demoPlaces (primeri)
│   ├── following/              ← „Pratim“
│   ├── events/                 ← „Događaji“ (uskoro)
│   ├── account/                ← „Nalog“ (gost / besplatan / Pro)
│   ├── settings/               ← podešavanja, dozvole + dnevnik, navigacija
│   ├── alarm/                  ← ★ alarm: alarmConfig, alarmSound, AlarmScreen
│   ├── health/                 ← ★ čuvar: da li aplikacija stvarno radi u pozadini
│   ├── more/, welcome/
│
├── components/                 ← zajedničko
│   ├── map/WebMap.tsx          ← ★ mapa (Leaflet + OpenStreetMap, bez ključa)
│   ├── map/mapHtml.ts          ← stranica mape; ovde se menja stil/izvor pločica
│   ├── SheetScreen.tsx         ← raspored „mapa gore + list ispod“ iz dizajna
│   ├── InAppBanner.tsx         ← „Kalenić pijaca je GeoNote 👋“ dok je app otvorena
│   ├── Logo.tsx                ← ★ logo
│   └── ui/                     ← AppText, Button, Card, Chip…
├── data/                       ← zones, settings, social (praćenja), activityLog
├── geo/                        ← lokacija i okidanje
├── navigation/features.ts      ← ★ registar sekcija
├── notifications/              ← obaveštenja (kanali, tekst, odlaganje)
├── i18n/                       ← ★ prevodi
├── store/useAppStore.ts        ← stanje + akcije
└── theme/                      ← ★ boje, boja akcenta, tipografija
```

---

## 4. Kako radi okidanje (i zašto ponekad ne iskoči)

Dva „čuvara“ rade zajedno:

| | Kad radi | Brzina |
|---|---|---|
| `geo/foregroundWatcher.ts` | **dok je aplikacija otvorena** (Expo Go i APK) | par sekundi |
| sistemski geofencing (`geofenceManager.ts` + `geofenceTask.ts`) | **kad je zatvorena** (samo APK) | Android: 1–3 min |

Oba šalju događaj u `geo/reminderEngine.ts → handleGeofenceEvent()`, koji:
1. proverava da li je to pravi ulazak/izlazak (ne „početno stanje“ posle pokretanja),
2. proverava zonu (aktivna, pravi okidač, nije iskočila za **isti** događaj u poslednjih 10 min),
3. proverava dozvolu za obaveštenja,
4. prikazuje obaveštenje ili alarm i ažurira zonu.

**Svaka odluka se upisuje u dnevnik** (`data/activityLog.ts`) — vidi se u
Podešavanja → Lokacija i obaveštenja → Aktivnost. Tu piše npr.
„Kalenić pijaca: arrived, but the zone is paused“.

**Okidač „oba“:** iskoči i kad uđeš i kad izađeš. Naslov se pravi po stvarnom događaju
(„… je GeoNote 👋“ / „Napuštaš …“). Zona „samo jednom“ sa okidačem „oba“ se gasi tek posle izlaska.

**Zona sačuvana dok stojiš u njoj** odmah iskoči (`store → fireIfAlreadyInside`).
Otvaranje aplikacije dok si u zoni **ne** pravi zvuk.

Xiaomi / Samsung / Huawei gase aplikacije u pozadini — ekran dozvola to prepozna i objasni šta da uključiš.

---

## 4a. Čuvar — „Da li GeoNote radi?“ (`src/features/health/`)

Telefoni (Xiaomi, Samsung, Huawei…) mogu da uspavaju aplikaciju zbog baterije — tada podsetnici
**tiho** ne iskaču. Čuvar to otkriva na četiri načina:

| Način | Šta radi |
|---|---|
| **Provera** (`healthCheck.ts → runHealthCheck`) | dozvole, lokacija uključena, da li telefon još prati zone (ako ne — sam ih ponovo pokrene), optimizacija baterije, štednja baterije |
| **Provera u pozadini** (`healthTask.ts`) | ista provera otprilike jednom na sat (expo-background-task / WorkManager) |
| **Pas čuvar (watchdog)** | svaki „znak života“ pomera zakazano obaveštenje 12 h unapred. Ako je aplikacija uspavana, niko ga ne pomeri i **telefon sam prikaže** „GeoNote možda spava“ |
| **Rupa i zakašnjenje** | pri otvaranju: „GeoNote je bio uspavan od … do …“; a ako GPS odmah po otvaranju nađe da si u zoni koju sistem nije javio → „Podsetnik je zakasnio“ |

Ozbiljni problemi pronađeni u pozadini javljaju se tihim obaveštenjem (kanal `app-status`,
najviše jednom dnevno po problemu). Sve se vidi u kartici **„Da li GeoNote radi?“** na ekranu
Lokacija i obaveštenja (dugme „Popravi“ otvara pravo podešavanje), a traka na dnu mape
upozori kad nešto nije u redu. Vremena i granice: `healthConfig.ts`.

---

## 5a. Alarm (nezavisan modul)

Sve o alarmu je u `src/features/alarm/`:

| Fajl | Šta |
|---|---|
| `alarmConfig.ts` | ★ podešavanja: boja, trajanje (3 min), vibracija, jačina, odlaganje (5 min) |
| `alarmSound.ts` | pušta zvuk u petlji + vibracija dok je aplikacija otvorena |
| `AlarmScreen.tsx` | ceo ekran: **Isključi alarm** · **Odloži 5 min** · Otvori zonu |

Kad je aplikacija zatvorena, zvoni zvuk samog obaveštenja (kanal `geo-alarms-v1` u
`notifications/notifications.ts`). Ideje za kasnije (biranje zvuka, postepeno pojačavanje,
gašenje mućkanjem…) dodaješ ovde, bez diranja lokacije i obaveštenja.

---

## 5. Mapa

### Pomerljivi list (sheet)
`components/DraggableSheet.tsx` — list ispod mape se povlači gore/dole i staje na 3 visine
(malo · kao u dizajnu · visoko). Brz potez pomera za jedan korak, dodir na ručicu ide na sledeću visinu.
Koriste ga `SheetScreen` (svi ekrani sa mapom gore) i `MapScreen`. Visine se menjaju u `snapPoints`.

### Pločice mape
- **Sa CARTO ključem** (`EXPO_PUBLIC_CARTO_KEY` u `.env`) — svetli/tamni izgled iz dizajna.
  Ključ je besplatan: https://carto.com/basemaps/apikey/ (od avgusta 2026. CARTO bez ključa prikazuje „API key required“).
- **Bez ključa** — obične OpenStreetMap pločice (u tamnom režimu potamnjene filterom). Dobro za testiranje.

- `components/map/WebMap.tsx` prikazuje stranicu (`mapHtml.ts`) sa Leaflet bibliotekom u WebView-u.
- Leaflet je ugrađen u aplikaciju (`components/map/generated/`, pravi ga `npm run generate:map`).
- Izbor pločica je u `mapHtml.ts → getTileLayer()`.
- Nova ikonica za marker: dodaj ime u `scripts/generate-map-assets.js` i pokreni `npm run generate:map`.

---

## 6. Navigacija

- Registar `navigation/features.ts`: id, ruta, ikonice, `status`, `showInMore`.
- Donji meni = `settings.tabBar` (podrazumevano Mapa · Moje zone) + uvek „Više“.
- Sekcije van menija postoje i otvaraju se iz „Više“ (meni ostaje vidljiv).
- „Moje zone“ i „Mesta“ su mali stack-ovi (lista + detalj), zato je meni vidljiv i na detalju.

**Dugme nazad.** `SheetScreen` crta belo „← Naziv“ dugme kad ima `backLabel`. Ekran otvoren sa
`?from=<ruta>` (npr. detalj zone sa mape: `from: '/'`) uvek dobija „← Nazad“ koje vraća tačno tamo.
Napuštanjem taba njegov mali stack se vraća na listu (`popToTopOnBlur`).

**Biranje mesta zone:** u uređivaču se mesto bira na **velikoj mapi iza lista** (dodir ili
prevlačenje pina, dugme „moja lokacija“). Radijus i ostali podaci ostaju u listu ispod.

**Uredi / obriši zonu:** `features/zones/zoneActions.ts` — koristi ga detalj zone (dugmad
„Uredi zonu“ / „Obriši zonu“), dugme „⋮“ (ili dugi pritisak) u svakom redu liste, i uređivač.

**Nova sekcija:** `FeatureId` u `data/types.ts` → folder u `features/` → ruta u `app/(tabs)/` →
zapis u `FEATURES` → tekstovi u `features.<id>` u `en.ts` i `sr.ts`.

---

## 7. Česte izmene

| Šta | Gde |
|---|---|
| Logo | `components/Logo.tsx` (ili `assets/images/logo.png` + `USE_IMAGE_LOGO = true`) |
| Boje / boje akcenta | `theme/index.ts` (`lightColors`, `darkColors`, `ACCENTS`) |
| Ikonica i boja tipa zone | `features/zones/zoneVisuals.ts → ZONE_KINDS` |
| Opseg radijusa | `geo/constants.ts → MIN_RADIUS`, `features/zones/components/RadiusSlider.tsx → MAX_RADIUS` |
| Tekstovi | `i18n/en.ts`, `i18n/sr.ts` |
| Primeri mesta, objave, storiji | `features/places/demoPlaces.ts` |
| Ponašanje alarma | `features/alarm/alarmConfig.ts` |
| Zvuk alarma | `assets/sounds/alarm.wav` + promeni `ALARM_CHANNEL_ID` u `notifications/notifications.ts` |

---

## 8. Django (faza 2)

- `data/api/mappers.ts → ZoneDTO` je tačan opis serializera.
- Nalozi (gost / besplatan / Pro) — `features/account/AccountScreen.tsx`; ograničenje od 3 zone za gosta
  se uključuje kad nalozi postoje (`GUEST_ZONE_LIMIT_ENFORCED`).
- Mesta, objave i storiji dolaze sa servera umesto iz `demoPlaces.ts` (isti oblici podataka).
- Lokalna kopija zona ostaje izvor za okidanje (pozadina mora da radi bez interneta) + sinhronizacija.
