/* app.js - Lunsjmeny Fornebu
   Leser public/menu.json og snakker med /api/traffic, /api/vote, /api/feedback. */

const UI = {
  no: {
    heading: 'LUNSJMENY FORNEBU',
    sub: 'To kantiner, et bakeri og en kafé - dagens meny på ett sted.',
    showingToday: 'Viser dagens meny', themeDark: 'Bytt til mørk modus', themeLight: 'Bytt til lys modus',
    weekendKicker: 'Helg', weekendTitle: 'Kantinene er stengt',
    weekendBody: 'Det serveres ingen lunsj i helgen. Kom tilbake på mandag - eller se menyen for en ukedag nå.',
    weekendCta: 'Se mandagens meny',
    mon: 'Mandag', tue: 'Tirsdag', wed: 'Onsdag', thu: 'Torsdag', fri: 'Fredag',
    monShort: 'Man', tueShort: 'Tir', wedShort: 'Ons', thuShort: 'Tor', friShort: 'Fre',
    todaySuffix: '(dagens)', copiedToast: 'Hele menyen er kopiert', voteTodayOnly: 'Du kan bare stemme på dagens meny.',
    lunch: 'Lunsj', dinner: 'Middag', allergyToggle: 'Vis allergener',
    voteLabel: '🙋 Jeg spiser her', votedLabel: '✓ Du spiser her', votesLabel: 'stemmer i dag', votesLabelOne: 'stemme i dag',
    mapTitle: 'Hvor er kantinene?',
    mapSub: 'Hold musepekeren over en markør for å se menyen - eller trykk på den på mobil.',
    mapEmpty: 'Velg et sted i kartet over.',
    staticMenu: 'Ny meny hver dag', buildingLabel: 'Bygg', cafeLabel: 'Kafé',
    openLabel: 'Åpent', lunchWindow: 'lunsjtilbudet gjelder',
    bakeryAlways: 'Bakevarer og nystekt brød hele åpningstiden.',
    bannerHide: 'Skjul melding', lunchWindowShort: 'Lunsjtilbud',
    manualFlag: 'Skrevet manuelt', bakernLink: 'Åpne Bakern sin egen meny', bakernLinkShort: 'Se menyen', dinnerFrom: 'Middag',
    bakernPreviewTitle: 'Bakern – meny', openNewTab: 'Åpne i ny fane',
    bakernFrameHint: 'Vises ikke menyen? Åpne den i ny fane.',
    lastUpdated: 'Sist oppdatert',
    allergyTodayOnly: 'Allergener vises kun for dagens meny',
    wheelBtn: 'Velg for meg',
    wheelTitle: 'Hvor skal vi spise?',
    wheelSub: 'Klarer du ikke bestemme deg? Ta med stedene du vurderer og spinn.',
    wheelSpin: 'Spinn hjulet',
    wheelSpinning: 'Spinner ...',
    wheelAgain: 'Spinn på nytt',
    wheelNeedTwo: 'Velg minst to steder for å spinne.',
    wheelWinner: 'Dagens valg:',
    wheelClosed: 'stengt i dag',
    allergyOnHint: 'Vises bak hver rett i listen',
    allergyOffHint: 'Slå på for å se allergener i menyen',
    legendCanteens: 'Kantiner', legendBakery: 'Baker', legendCafes: 'Kafeer',
    expoFriday: 'Fredager: gratis kaffe frem til kl. 11 for Telenor-ansatte',
    expoFridayToday: 'I dag: gratis kaffe frem til kl. 11 for Telenor-ansatte',
    fridayCoffee: 'Gratis kaffe på Café Expo frem til kl. 11',
    topUpCard: 'Fyll på kantinekort', issOriginal: 'Original ISS-meny',
    copyMenu: 'Kopier hele menyen', copied: 'Kopiert!',
    install: 'Installer app',
    installIos: 'Trykk Del-ikonet nederst, og velg «Legg til på Hjem-skjerm».',
    installed: 'Snarveien er lagt til',
    copyManual: 'Marker teksten og kopier (Ctrl/Cmd + C):', close: 'Lukk',
    noMenu: 'Ingen meny publisert.',
    fbButton: 'Gi tilbakemelding', fbTitle: 'Hva synes du om endringen på nettsiden?',
    fbUp: 'Bra', fbDown: 'Dårlig', fbDetail: 'Skriv detaljert tilbakemelding',
    fbPlaceholder: 'Hva fungerer bra, hva kan bli bedre?', fbSend: 'Send',
    fbThanks: 'Takk for tilbakemeldingen!', fbSending: 'Sender …',
    fbError: 'Kunne ikke sende - prøv igjen.',
    aboutBtn: 'Om siden', aboutTitle: 'Om denne løsningen',
    aboutMadeH: 'Laget av', aboutMadeP: 'Siden er laget på fritiden av {name}, som et hobbyprosjekt. Den er ikke et offisielt ISS- eller bedriftsverktøy.',
    aboutHostH: 'Drift og hosting', aboutHostP: 'Løsningen kjører på en egen liten server utenfor bedriftens nettverk. Menyene hentes automatisk fra kjøkkenets egne filer flere ganger hver morgen - ingen personopplysninger lagres. Siden teller anonymt hvor mange som er innom og hvilke funksjoner som brukes, uten cookies, sporing eller lagring av IP-adresser.',
    aboutWebexH: 'Bli med i Webex-gruppen', aboutWebexP: 'Det finnes en åpen Webex-gruppe som varsler dagens meny automatisk. Ta kontakt, så legges du til.',
    aboutWebexCta: 'Send melding på Webex',
    aboutWebexAlt: 'Eller send e-post i stedet',
    aboutNote: 'Forslag og feil? Bruk «Gi tilbakemelding» nede til høyre.',
    opensIn: 'Åpner om {n} min', opensAt: 'Åpner kl. {t}', openNow: 'Åpent nå',
    closesIn: 'Stenger om {n} min', closedToday: 'Stengt for i dag',
    walkTitle: 'Beregnet gangtid fra A3 og J3', dinnerKicker: 'Middag',
    seasonOff: 'Skru av sesongpynt', seasonOn: 'Skru på sesongpynt',
    pushBtn: 'Varsel om dagens meny', pushTitle: 'Dagens meny som varsel',
    pushIntroOff: 'Få dagens lunsj som varsel på PC eller mobil, til tiden du velger. Varselet kommer selv om siden er lukket.',
    pushIntroOn: 'Varselet er på. Du kan endre tidspunkt og dager når du vil.',
    pushIos: 'På iPhone og iPad virker varsler bare når siden er lagt til på Hjem-skjermen: trykk Del-ikonet og velg «Legg til på Hjem-skjerm». Åpne den derfra og trykk på bjella igjen.',
    pushTimeLabel: 'Tidspunkt', pushDaysLabel: 'Dager',
    pushEnable: 'Slå på varsel', pushSaveBtn: 'Lagre endringer', pushOff: 'Slå av varsel', pushTest: 'Send et testvarsel nå',
    pushSaved: 'Lagret - du får varsel kl. {t}.', pushOffDone: 'Varselet er slått av.', pushTestSent: 'Testvarsel sendt.',
    pushDenied: 'Nettleseren har blokkert varsler for denne siden. Tillat varsler i nettleserens innstillinger og prøv igjen.',
    pushNeedDay: 'Velg minst én dag.', pushError: 'Noe gikk galt: {e}',
    footerNote: 'Menyene hentes automatisk fra kjøkkenets egne filer, som før.'
  },
  en: {
    heading: 'LUNCH MENU FORNEBU',
    sub: 'Two canteens, a bakery and a café - today\u2019s menu in one place.',
    showingToday: 'Showing today\u2019s menu', themeDark: 'Switch to dark mode', themeLight: 'Switch to light mode',
    weekendKicker: 'Weekend', weekendTitle: 'The canteens are closed',
    weekendBody: 'No lunch is served at the weekend. Come back on Monday - or browse a weekday menu now.',
    weekendCta: 'See Monday\u2019s menu',
    mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday',
    monShort: 'Mon', tueShort: 'Tue', wedShort: 'Wed', thuShort: 'Thu', friShort: 'Fri',
    todaySuffix: '(today)', copiedToast: 'The whole menu was copied', voteTodayOnly: 'You can only vote on today\u2019s menu.',
    lunch: 'Lunch', dinner: 'Dinner', allergyToggle: 'Show allergens',
    voteLabel: '🙋 Eating here', votedLabel: '✓ You\u2019re eating here', votesLabel: 'votes today', votesLabelOne: 'vote today',
    mapTitle: 'Where are the canteens?',
    mapSub: 'Hover a marker to see its menu - or tap it on mobile.',
    mapEmpty: 'Pick a spot on the map above.',
    staticMenu: 'New menu every day', buildingLabel: 'Building', cafeLabel: 'Café',
    openLabel: 'Open', lunchWindow: 'lunch offer served',
    bakeryAlways: 'Pastries and freshly baked bread all day.',
    bannerHide: 'Hide message', lunchWindowShort: 'Lunch offer',
    manualFlag: 'Entered manually', bakernLink: 'Open Bakern\u2019s own menu', bakernLinkShort: 'See menu', dinnerFrom: 'Dinner',
    bakernPreviewTitle: 'Bakern – menu', openNewTab: 'Open in new tab',
    bakernFrameHint: 'Menu not showing? Open it in a new tab.',
    lastUpdated: 'Last updated',
    allergyTodayOnly: 'Allergens are only available for today\u2019s menu',
    wheelBtn: 'Pick for me',
    wheelTitle: 'Where should we eat?',
    wheelSub: 'Can\u2019t decide? Keep the places you are considering and give it a spin.',
    wheelSpin: 'Spin the wheel',
    wheelSpinning: 'Spinning ...',
    wheelAgain: 'Spin again',
    wheelNeedTwo: 'Pick at least two places to spin.',
    wheelWinner: 'Today\u2019s pick:',
    wheelClosed: 'closed today',
    allergyOnHint: 'Shown after each dish in the list',
    allergyOffHint: 'Turn on to see allergens in the menu',
    legendCanteens: 'Canteens', legendBakery: 'Bakery', legendCafes: 'Cafés',
    expoFriday: 'Fridays: free coffee until 11:00 for Telenor employees',
    expoFridayToday: 'Today: free coffee until 11:00 for Telenor employees',
    fridayCoffee: 'Free coffee at Café Expo until 11:00',
    topUpCard: 'Top up canteen card', issOriginal: 'Original ISS menu',
    copyMenu: 'Copy whole menu', copied: 'Copied!',
    install: 'Install app',
    installIos: 'Tap the Share icon at the bottom, then choose “Add to Home Screen”.',
    installed: 'Shortcut added',
    copyManual: 'Select the text and copy (Ctrl/Cmd + C):', close: 'Close',
    noMenu: 'No menu published.',
    fbButton: 'Give feedback', fbTitle: 'What do you think of the new site?',
    fbUp: 'Good', fbDown: 'Bad', fbDetail: 'Write detailed feedback',
    fbPlaceholder: 'What works well, what could be better?', fbSend: 'Send',
    fbThanks: 'Thanks for the feedback!', fbSending: 'Sending \u2026',
    fbError: 'Could not send - please try again.',
    aboutBtn: 'About', aboutTitle: 'About this site',
    aboutMadeH: 'Made by', aboutMadeP: 'Built in spare time by {name} as a hobby project. It is not an official ISS or company tool.',
    aboutHostH: 'Hosting and operations', aboutHostP: 'The site runs on a small private server outside the company network. Menus are pulled automatically from the kitchen\u2019s own files several times each morning - no personal data is stored. The site keeps anonymous counts of visits and which features are used, with no cookies, tracking or stored IP addresses.',
    aboutWebexH: 'Join the Webex group', aboutWebexP: 'There is an open Webex space that posts today\u2019s menu automatically. Get in touch and you will be added.',
    aboutWebexCta: 'Message on Webex',
    aboutWebexAlt: 'Or send an email instead',
    aboutNote: 'Suggestions or bugs? Use “Give feedback” in the bottom right.',
    opensIn: 'Opens in {n} min', opensAt: 'Opens at {t}', openNow: 'Open now',
    closesIn: 'Closes in {n} min', closedToday: 'Closed for today',
    walkTitle: 'Estimated walking time from A3 and J3', dinnerKicker: 'Dinner',
    seasonOff: 'Turn off seasonal decorations', seasonOn: 'Turn on seasonal decorations',
    pushBtn: 'Notify me about today\u2019s menu', pushTitle: 'Today\u2019s menu as a notification',
    pushIntroOff: 'Get today\u2019s lunch as a notification on your computer or phone, at a time you choose. It arrives even when the site is closed.',
    pushIntroOn: 'Notifications are on. Change the time and days whenever you like.',
    pushIos: 'On iPhone and iPad, notifications only work when the site is added to the Home Screen: tap the Share icon and choose \u201cAdd to Home Screen\u201d. Open it from there and tap the bell again.',
    pushTimeLabel: 'Time', pushDaysLabel: 'Days',
    pushEnable: 'Turn on notifications', pushSaveBtn: 'Save changes', pushOff: 'Turn off', pushTest: 'Send a test notification now',
    pushSaved: 'Saved - you will be notified at {t}.', pushOffDone: 'Notifications are turned off.', pushTestSent: 'Test notification sent.',
    pushDenied: 'The browser has blocked notifications for this site. Allow them in the browser settings and try again.',
    pushNeedDay: 'Pick at least one day.', pushError: 'Something went wrong: {e}',
    footerNote: 'Menus are still pulled automatically from the kitchen\u2019s own files, same as before.'
  }
};

// Bakern legger ukesmenyen sin ut som bilde i denne skjermwidgeten
const BAKERN_MENU_URL =
  'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=e7420bcd-79cf-4268-abb6-08ccca3a7e89';
const BAKERN_FRAME_URL = BAKERN_MENU_URL;

// Kjøkkenets egne skjermwidgeter, til «Se menyen» på kortene.
// today = dagsmenyen (brukes når du ser på i dag), week = ukesmenyen.
// Middagens dagsmeny-side henger igjen fra dagen før, så den bruker ukesmenyen.
const INISIGN = token => 'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=' + token;
const MENU_WIDGETS = {
  m:         { today: INISIGN('4a0457f8-dbfa-4783-8ebe-b5ee0486843f'), week: INISIGN('756a5aa2-a95f-4d15-ad5a-59829741075b') },
  fresh4you: { today: INISIGN('aa1358ee-d30e-4289-a630-892cd1210857'), week: INISIGN('a8923cdb-9d92-46bc-b6a4-d026c2cf9a89') },
  dinner:    { week: INISIGN('dd6ee59b-6e03-4215-8543-a01dbda54db7') },
  bakern:    { today: BAKERN_MENU_URL, week: BAKERN_MENU_URL },
  cafem:     { today: INISIGN('44f3e542-f212-4042-b9e2-d450bd84d31c'), week: INISIGN('e7a0be40-4bb4-462a-8feb-0f9b3f5012b9') }
};

function widgetUrl(id) {
  const w = MENU_WIDGETS[id];
  if (!w) return null;
  return (showingToday() && w.today) || w.week || w.today;
}

/** «Se menyen»-lenke som åpner kjøkkenets egen side i dialogen. */
function menuLink(id, name) {
  const url = widgetUrl(id);
  if (!url) return null;
  // Bare et øye nederst til venstre - teksten ligger i title/aria-label
  const link = el('a', 'menu-eye');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.title = t().bakernLinkShort + ' – ' + name;
  link.setAttribute('aria-label', t().bakernLink.replace('Bakern', name));
  link.innerHTML = '<svg viewBox="0 0 24 24" class="ico-16"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  link.onclick = e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // la nettleseren åpne ny fane
    track('se_menyen', id);
    e.preventDefault();
    toggleBakern(true, url, name);
  };
  return link;
}

const FRIDAY_LINES = {
  no: ['Endelig fredag!', 'Ha en fin fredag!', 'Er det fredag? Ja. 🙌', 'God helg - men først lunsj.'],
  en: ['Finally Friday!', 'Have a great Friday!', 'Is it Friday? Yes. 🙌', 'Happy weekend - lunch first.']
};
const FRIDAY_IDX = Math.floor(Math.random() * 4);

// Kartposisjon og farge per sted. Juster left/top for å flytte markørene.
const GEO = {
  m:         { color: '#0080a6', dark: '#38c9e8', left: '74%', top: '56%', vote: true },
  fresh4you: { color: '#070452', dark: '#a08cff', left: '78%', top: '21%', vote: true },
  bakern:    { color: '#8a5a2b', dark: '#e0a066', left: '61%', top: '21%', vote: true },
  // Kafeer uten meny - bare navn og åpningstid
  expo:      { color: '#7a8a5e', dark: '#b3c48c', left: '86%', top: '30%', vote: false, cafe: true,
               name: 'Café Expo', hours: '08:00 – 15:00', noteKey: 'expoFriday' },
  hotspot:   { color: '#7a8a5e', dark: '#b3c48c', left: '45%', top: '50%', vote: false, cafe: true,
               name: 'Hot Spot', hours: '07:30 – 14:30' },
  // Cafe M har lunsjtilbud (nov. 2026) og vises som kort under Bakern
  cafem:     { color: '#6b7d4a', dark: '#b3c48c', left: '68%', top: '63%', vote: true,
               name: 'Cafe M', hours: '08:30 – 15:30' }
};

function isDark() {
  return document.documentElement.dataset.theme === 'dark';
}

// Eat The Street er lagt ned. Middagen er flyttet til Fresh 4 You og vises
// som en fane inne i det kortet.
const LUNCH_IDS = ['m', 'fresh4you'];
const DINNER_HOST = 'fresh4you';
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// Beregnet gangtid i minutter fra A3 og J3. Vises i kartpopupen.
const WALK = {
  bakern:    { A3: 3, J3: 4 },
  fresh4you: { A3: 4, J3: 5 },
  m:         { A3: 5, J3: 4 }
};

function walkText(id) {
  const w = WALK[id];
  return w ? '🚶 ' + Object.entries(w).map(([from, min]) => `${from}: ${min} min`).join(' · ') : '';
}

/** "10:30 – 14:00" -> [630, 780] i minutter, eller null. */
function parseHours(hours) {
  const m = String(hours || '').match(/(\d{1,2})[:.](\d{2})\s*[–-]\s*(\d{1,2})[:.](\d{2})/);
  return m ? [m[1] * 60 + +m[2], m[3] * 60 + +m[4]] : null;
}

/** Åpner/stenger-tekst for dagens tidspunkt, eller null når den ikke gjelder. */
function openState(hours) {
  const span = parseHours(hours);
  if (!span || !showingToday()) return null;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [open, close] = span;
  const fmt = (s, v) => t()[s].replace('{n}', v).replace('{t}', v);
  if (mins < open - 90) {
    const hh = String(Math.floor(open / 60)).padStart(2, '0') + ':' + String(open % 60).padStart(2, '0');
    return { cls: 'later', text: fmt('opensAt', hh) };
  }
  if (mins < open) return { cls: 'soon', text: fmt('opensIn', open - mins) };
  if (mins >= close) return { cls: 'closed', text: t().closedToday };
  if (close - mins <= 45) return { cls: close - mins <= 15 ? 'closing' : 'open', text: fmt('closesIn', close - mins) };
  return { cls: 'open', text: t().openNow };
}

/** Liten status-tekst som oppdateres av klokka hvert halve minutt. */
function openBadge(hours) {
  const span = el('span', 'open-state');
  span.dataset.hours = hours || '';
  fillOpenBadge(span);
  return span;
}

function fillOpenBadge(span) {
  const s = openState(span.dataset.hours);
  span.hidden = !s;
  if (s) {
    span.className = 'open-state is-' + s.cls;
    span.textContent = s.text;
  }
}

setInterval(() => { $$('.open-state').forEach(fillOpenBadge); renderTip(); }, 30000);

// Dagens tips fra /admin - vises bare på dagens meny og fram til kl. 12
function renderTip() {
  const box = document.getElementById('lunchTip');
  if (!box) return;
  const tip = state.tip;
  const show = !!tip && showingToday() && new Date().getHours() < 12;
  box.hidden = !show;
  if (!show) return;
  box.innerHTML = CLOCK;
  box.appendChild(el('span', null, (state.lang === 'en' && tip.textEn) ? tip.textEn : tip.text));
}

async function loadTip() {
  try {
    const r = await fetch('api/tip', { cache: 'no-store' });
    state.tip = (await r.json()).tip;
  } catch (e) {
    state.tip = null;
  }
  renderTip();
}

/** Fresh 4 You viser middagen (i kort og kart) når middagsfanen er valgt. */
function shownPlace(id) {
  const info = placeInfo(id);
  if (id !== DINNER_HOST || f4yTab() !== 'dinner') return info;
  return { ...placeInfo('dinner'), id, color: info.color, left: info.left, top: info.top,
           name: info.name, building: info.building, isDinner: true };
}

const state = {
  lang: 'no',
  day: null,
  f4yTab: null, // null = automatisk: middag etter kl. 14 i dag, ellers lunsj
  allergens: false,
  data: null,
  votes: {},
  myVote: null,
  hovered: null,
  selected: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  copied: false
};

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const t = () => UI[state.lang];

// ------------------------------------------------------------------ url

function readUrl() {
  const p = new URLSearchParams(location.search);
  const lang = p.get('lang');
  const day = p.get('day');
  if (lang === 'en' || lang === 'no') state.lang = lang;
  if (DAY_KEYS.includes(day)) state.day = day;
  if (p.get('allergens') === '1') state.allergens = true;
}

function writeUrl() {
  const p = new URLSearchParams();
  if (state.lang !== 'no') p.set('lang', state.lang);
  if (state.day) p.set('day', state.day);
  if (state.allergens) p.set('allergens', '1');
  const qs = p.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  document.documentElement.lang = state.lang;
}

// ------------------------------------------------------------------ data

function todayWeekKey() {
  const wd = new Date().getDay(); // 0 = søndag
  return wd >= 1 && wd <= 5 ? DAY_KEYS[wd - 1] : null;
}

/** Sant i helgen, så lenge brukeren ikke selv har valgt en ukedag. */
function isWeekend() {
  return !todayWeekKey() && !state.day;
}

/** Valgt dag, eller dagens ukedag når ingenting er valgt. */
function activeDay() {
  return state.day || todayWeekKey() || 'mon';
}

/** Sant når vi viser dagens dato - da gjelder dagfilene. */
function showingToday() {
  const today = todayWeekKey();
  return !!today && activeDay() === today;
}

/** Stemmetelling med riktig entalls-/flertallsform. */
function votesText(n) {
  return n + ' ' + (n === 1 ? t().votesLabelOne : t().votesLabel);
}

// Allergenkodene (1-14) fra kjøkkenet, oversatt til valgt språk
const ALLERGEN_NAMES = {
  no: ['', 'Egg', 'Fisk', 'Gluten', 'Melk', 'Nøtter', 'Peanøtter', 'Selleri', 'Sennep',
       'Sesamfrø', 'Skalldyr', 'Soya', 'Sulfitter', 'Bløtdyr', 'Lupin'],
  en: ['', 'Egg', 'Fish', 'Gluten', 'Milk', 'Nuts', 'Peanuts', 'Celery', 'Mustard',
       'Sesame seed', 'Shellfish', 'Soy', 'Sulphites', 'Molluscs', 'Lupine']
};

/** Rettene og deres allergenkoder for et sted på valgt dag, i valgt språk. */
function menuFor(id) {
  const data = state.data;
  if (!data || !data.places[id]) return { items: [], codes: [] };

  // Dagfilene er ferskere enn ukesmenyen - bruk dem når valgt dag er i dag
  if (showingToday()) {
    // Manuelt skrevet meny fra /admin vinner over alt (har ingen koder)
    const manual = data.manual?.[id]?.items;
    if (manual && manual.length) return { items: manual, codes: [] };

    const override = data.todayOverride?.[state.lang]?.[id];
    if (override?.items?.length) return { items: override.items, codes: override.codes || [] };
  }

  const place = data.places[id];
  const day = activeDay();
  return {
    items: place.week?.[state.lang]?.[day] || [],
    codes: place.weekCodes?.[state.lang]?.[day] || []
  };
}

/** Rettene som tekst - med allergener bak hver rett når de er slått på. */
function dishesFor(id) {
  const { items, codes } = menuFor(id);
  if (!state.allergens) return items;
  const names = ALLERGEN_NAMES[state.lang] || ALLERGEN_NAMES.no;
  return items.map((item, i) => {
    const list = (codes[i] || []).map(c => names[c]).filter(Boolean);
    return list.length ? `${item} (${list.join(', ')})` : item;
  });
}

function placeInfo(id) {
  const p = state.data?.places[id];
  const geo = GEO[id] || {};
  return {
    id,
    name: p?.name || geo.name || id,
    hours: p?.hours || geo.hours || '',
    lunchHours: p?.lunchHours || '',
    building: p?.building || '',
    color: (isDark() ? geo.dark : geo.color) || '#1c16c5',
    left: geo.left,
    top: geo.top,
    cafe: !!geo.cafe,
    manual: showingToday() && !!state.data?.manual?.[id]?.items?.length,
    note: geo.noteKey ? t()[geo.noteKey] : '',
    dishes: geo.cafe ? [] : dishesFor(id)
  };
}

// ------------------------------------------------------------------ render

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

const CLOCK = '<svg viewBox="0 0 24 24" class="ico-14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

// Navnet i «Om siden» settes av serveren fra AUTHOR_NAME i .env
function authorName() {
  const v = document.querySelector('meta[name="author-name"]')?.content || '';
  return v && !v.includes('__AUTHOR_NAME__') ? v
    : (state.lang === 'en' ? 'a colleague at Fornebu' : 'en kollega på Fornebu');
}

function renderStrings() {
  $$('[data-t]').forEach(n => { n.textContent = (t()[n.dataset.t] || '').replace('{name}', authorName()); });
  $('#copyBtn').title = t().copyMenu;
  $('#copyBtn').setAttribute('aria-label', t().copyMenu);
  const inst = $('#installBtn');
  if (inst) {
    inst.title = t().install;
    inst.setAttribute('aria-label', t().install);
  }
  $('#fbMessage').placeholder = t().fbPlaceholder;
  if (state.banner) renderBanner();
  const now = new Date();
  $('#datestamp').textContent = now.toLocaleDateString(
    state.lang === 'en' ? 'en-GB' : 'nb-NO',
    { weekday: 'long', day: 'numeric', month: 'long' }
  ) + ' (' + (state.lang === 'en' ? 'Week ' : 'Uke ') + isoWeek(now) + ')';
  document.title = state.lang === 'en' ? 'Lunch Menu Fornebu' : 'Lunsjmeny Fornebu';
  syncThemeLabel();
  if (typeof syncSeasonBtn === 'function') syncSeasonBtn();
  if (typeof syncPushBtn === 'function') syncPushBtn();

  const brand = $('.nav-brand');
  if (brand) brand.textContent = '🍽️ ' + (state.lang === 'en' ? 'Lunch Menu Fornebu' : 'Lunsjmeny Fornebu');

  const isFriday = todayWeekKey() === 'fri';
  const lines = FRIDAY_LINES[state.lang];
  $('#fridayLine').textContent = lines[FRIDAY_IDX % lines.length];
  $('#fridayBanner').hidden = !isFriday;
  const coffee = $('#fridayCoffee');
  if (coffee) {
    coffee.textContent = t().fridayCoffee;
    coffee.hidden = !isFriday;
  }
}

function renderTabs() {
  $$('[data-lang]').forEach(b => {
    b.className = 'btn btn-sm ' + (b.dataset.lang === state.lang ? 'btn-secondary' : 'btn-ghost');
  });
  // Allergener vises på valgt språk for alle dager (kodene ligger i menu.json)
  const allergyBtn = $('#allergyToggle');
  allergyBtn.classList.toggle('is-on', state.allergens);
  allergyBtn.disabled = false;
  allergyBtn.setAttribute('aria-pressed', state.allergens ? 'true' : 'false');
  allergyBtn.title = state.allergens ? t().allergyOnHint : t().allergyOffHint;

  const active = activeDay();
  const group = $('#weekTabs');
  group.textContent = '';
  const today = todayWeekKey();
  DAY_KEYS.forEach(k => {
    const b = el('button', 'btn ' + (active === k ? 'btn-primary' : 'btn-ghost'));
    b.type = 'button';
    const isToday = k === today;
    if (isToday) b.classList.add('is-today');

    const long = el('span', 'd-long', t()[k]);
    const short = el('span', 'd-short', t()[k + 'Short']);
    if (isToday) {
      long.appendChild(el('span', 'today-suffix', ' ' + t().todaySuffix));
      short.appendChild(el('span', 'today-dot'));
    }
    b.appendChild(long);
    b.appendChild(short);
    b.onclick = () => { if (state.day !== k) track('dag'); state.day = k; state.selected = null; writeUrl(); render(); };
    group.appendChild(b);
  });

  const weekend = isWeekend();
  $('.day-row').hidden = weekend;
  $('.section-row').hidden = weekend;
  $('#weekendCard').hidden = !weekend;
  $('#lunchSection').hidden = weekend;
}

/** Fanen i Fresh 4 You-kortet. Uten eget valg: middag etter kl. 14 i dag. */
function f4yTab() {
  if (state.f4yTab) return state.f4yTab;
  return showingToday() && new Date().getHours() >= 14 ? 'dinner' : 'lunch';
}

function dishList(info) {
  const box = el('div', 'dishes');
  if (!info.dishes.length) {
    box.appendChild(el('div', 'empty', t().noMenu));
    return box;
  }
  info.dishes.forEach(d => {
    const row = el('div', 'dish');
    const dot = el('span', 'dot');
    dot.style.background = info.color;
    row.appendChild(dot);
    row.appendChild(el('span', null, d));
    box.appendChild(row);
  });
  return box;
}

function canteenCard(info, withVote) {
  const card = el('div', 'card elev-sm canteen');
  card.style.borderTopColor = info.color;
  const head = el('div', 'card-head');
  const kicker = el('div', 'card-kicker', t().buildingLabel + ' ' + info.building);
  if (info.manual) kicker.appendChild(el('span', 'manual-flag', t().manualFlag));
  head.appendChild(kicker);
  card.appendChild(head);
  card.appendChild(el('div', 'card-title', info.name));

  let shown = info;
  if (info.id === DINNER_HOST) {
    const tab = f4yTab();
    const seg = el('div', 'card-seg');
    seg.setAttribute('role', 'tablist');
    [['lunch', t().lunch], ['dinner', t().dinner]].forEach(([k, label]) => {
      const b = el('button', 'card-seg-opt' + (tab === k ? ' is-on' : ''), label);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', tab === k ? 'true' : 'false');
      b.onclick = () => { if (k === 'dinner' && state.f4yTab !== 'dinner') track('middagsfane'); state.f4yTab = k; renderCanteens(); renderMap(); };
      seg.appendChild(b);
    });
    head.appendChild(seg);
    if (tab === 'dinner') shown = { ...placeInfo('dinner'), color: info.color };
  }

  const hours = el('div', 'hours');
  hours.innerHTML = CLOCK;
  hours.appendChild(el('span', null, shown.hours));
  hours.appendChild(openBadge(shown.hours));
  card.appendChild(hours);

  card.appendChild(dishList(shown));

  card.style.setProperty('--place', info.color);   // hover-farge på «Se menyen»
  const link = menuLink(shown.isDinner || (info.id === DINNER_HOST && f4yTab() === 'dinner') ? 'dinner' : info.id, info.name);
  if (link) card.appendChild(link);

  // Stemmingen gjelder lunsjen - ikke vis den på middagsfanen
  const showingDinner = info.id === DINNER_HOST && f4yTab() === 'dinner';
  if (withVote && !showingDinner) card.appendChild(voteFoot(info));
  return card;
}

function voteFoot(info) {
  {
    const count = state.votes[info.id] || 0;
    const mine = state.myVote === info.id;

    const foot = el('div', 'vote-foot');
    foot.appendChild(el('span', 'vote-count', votesText(count)));

    const btn = el('button', 'btn btn-sm ' + (mine ? 'btn-secondary' : 'btn-ghost'),
      mine ? t().votedLabel : t().voteLabel);
    btn.type = 'button';
    btn.onclick = () => castVote(info.id, btn);
    btn.onmouseenter = () => setHover(info.id);
    btn.onmouseleave = () => setHover(null);
    btn.onfocus = () => setHover(info.id);
    btn.onblur = () => setHover(null);
    foot.appendChild(btn);
    return foot;
  }
}

function renderCanteens() {
  const grid = $('#canteenCards');
  grid.textContent = '';
  LUNCH_IDS.forEach(id => grid.appendChild(canteenCard(placeInfo(id), showingToday())));
  renderSideCards(); // stemmetallene i Bakern- og Cafe M-kortet følger kantinene
}

// Midlertidig banner satt fra /admin. Skjules per bruker via localStorage,
// nøkkelen inneholder bannerets id så et nytt banner alltid vises igjen.
async function loadBanner() {
  const box = $('#siteBanner');
  if (!box) return;
  try {
    const r = await fetch('api/banner', { cache: 'no-store' });
    const { banner } = await r.json();
    if (!banner) { box.hidden = true; return; }

    let hidden = null;
    try { hidden = localStorage.getItem('lunsj-banner-hidden'); } catch (e) {}
    if (hidden === banner.id) { box.hidden = true; return; }

    state.banner = banner;
    renderBanner();
  } catch (e) {
    box.hidden = true;
  }
}

function renderBanner() {
  const box = $('#siteBanner');
  const banner = state.banner;
  if (!box || !banner) return;
  box.className = 'site-banner tone-' + banner.tone;
  $('#siteBannerEmoji').textContent = banner.emoji || '';
  $('#siteBannerText').textContent =
    (state.lang === 'en' && banner.textEn) ? banner.textEn : banner.text;
  const x = $('#siteBannerClose');
  x.hidden = !banner.dismissible;
  x.title = t().bannerHide;
  x.setAttribute('aria-label', t().bannerHide);
  x.onclick = () => {
    box.hidden = true;
    try { localStorage.setItem('lunsj-banner-hidden', banner.id); } catch (e) {}
  };
  box.hidden = false;
}

// Bakern og Cafe M står under hverandre i en sidekolonne ved siden av de to
// kantinene - tonet i stedets farge så de skiller seg fra kantinekortene.
const SIDE_CARDS = [
  { id: 'bakern', el: '#bakeryCard', noteKey: 'bakeryAlways' },
  { id: 'cafem', el: '#cafemCard' }
];

function renderSideCards() {
  SIDE_CARDS.forEach(renderSideCard);
}

function renderSideCard({ id, el: sel, noteKey }) {
  const info = placeInfo(id);
  const card = $(sel);
  if (!card) return;
  card.textContent = '';
  card.style.setProperty('--place', info.color);

  const top = el('div', 'bakery-top');
  top.appendChild(el('div', 'card-kicker', t().buildingLabel + ' ' + info.building));
  card.appendChild(top);
  card.appendChild(el('div', 'card-title', info.name));

  const hours = el('div', 'hours');
  hours.innerHTML = CLOCK;
  hours.appendChild(el('span', 'nowrap', info.hours));
  hours.appendChild(openBadge(info.hours));
  card.appendChild(hours);
  // Først det som gjelder hele dagen, så lunsjtilbudet og rettene
  if (noteKey) card.appendChild(el('p', 'bakery-note', t()[noteKey]));
  if (info.lunchHours) {
    const w = el('div', 'bakery-window', t().lunchWindowShort + ' ');
    w.appendChild(el('span', 'nowrap', info.lunchHours));
    card.appendChild(w);
  }

  card.appendChild(dishList(info));

  // Forhåndsvisning i dialog; ny fane som reserve inne i dialogen
  const link = menuLink(id, info.name);
  if (link) card.appendChild(link);

  if (showingToday()) card.appendChild(voteFoot(info));
}

/** Sist endret på kildefila menyen faktisk kommer fra. */
function updatedFor(id) {
  const data = state.data;
  if (!data) return '';
  const daily = data.todayOverride?.no?.[id]?.items?.length;
  return (showingToday() && daily && data.dailyUpdated)
    ? data.dailyUpdated
    : data.places?.[id]?.updated || '';
}

function stampText(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const locale = state.lang === 'en' ? 'en-GB' : 'no-NO';
  return t().lastUpdated + ' ' + d.toLocaleString(locale, {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

function applyMapTransform() {
  const inner = $('#mapInner');
  inner.style.transform =
    `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
  $('#mapZoomOut').disabled = state.zoom <= 1;
  $('#mapZoomIn').disabled = state.zoom >= 4;
  $('#map').classList.toggle('zoomed', state.zoom > 1);
}

/** Holder kartet innenfor rammen når man zoomer eller drar. */
function clampPan() {
  const box = $('#map').getBoundingClientRect();
  const maxX = (box.width * (state.zoom - 1)) / 2;
  const maxY = (box.height * (state.zoom - 1)) / 2;
  state.panX = Math.max(-maxX, Math.min(maxX, state.panX));
  state.panY = Math.max(-maxY, Math.min(maxY, state.panY));
}

function setZoom(next, originX, originY) {
  const prev = state.zoom;
  state.zoom = Math.max(1, Math.min(4, next));
  if (state.zoom === 1) {
    state.panX = 0;
    state.panY = 0;
  } else if (originX != null) {
    // Zoom mot punktet under pekeren
    const k = state.zoom / prev;
    state.panX = originX - k * (originX - state.panX);
    state.panY = originY - k * (originY - state.panY);
    clampPan();
  } else {
    clampPan();
  }
  applyMapTransform();
}

function renderLegend() {
  const box = $('#mapLegend');
  if (!box) return;
  box.textContent = '';
  const c = id => placeInfo(id).color;
  const groups = [
    { label: t().legendCanteens, fill: 'linear-gradient(100deg, ' + c('m') + ' 0 50%, ' + c('fresh4you') + ' 50% 100%)' },
    { label: t().legendBakery, fill: c('bakern') },
    { label: t().legendCafes, fill: c('expo') }
  ];
  groups.forEach(g => {
    const chip = el('span', 'legend-chip', g.label);
    chip.style.background = g.fill;
    box.appendChild(chip);
  });
}

function renderMap() {
  const map = $('#mapInner');
  map.textContent = '';

  const img = el('img');
  img.src = 'fornebu-kart.png';
  img.alt = 'Kart over Fornebu';
  img.draggable = false;
  map.appendChild(img);

  Object.keys(GEO).forEach(id => {
    const info = shownPlace(id);
    const holder = el('div', 'pin-holder' + (state.hovered === id ? ' hot' : ''));
    holder.style.left = info.left;
    holder.style.top = info.top;
    holder.onmouseenter = () => setHover(id);
    holder.onmouseleave = () => setHover(null);

    const pin = el('button', 'pin');
    pin.type = 'button';
    pin.style.background = info.color;
    pin.appendChild(el('span', 'dot'));
    pin.appendChild(el('span', 'pin-label', info.name));
    if (state.myVote === id) pin.appendChild(el('span', 'pin-star', '★'));
    pin.onclick = () => {
      // Trykk på samme markør igjen lukker den - både på mobil og PC
      if (state.selected === id) {
        state.selected = null;
        setHover(null);
      } else {
        state.selected = id;
        setHover(id);
        track('kart', id);
      }
      renderMap();
    };
    pin.onfocus = () => setHover(id);
    pin.onblur = () => setHover(null);
    holder.appendChild(pin);

    // Motvirk skaleringen så markørene beholder lesbar størrelse
    holder.style.setProperty('--pin-scale', (1 / state.zoom).toFixed(3));

    const narrow = window.matchMedia('(max-width: 620px)').matches;
    const above = parseFloat(info.top) >= 45;
    // Ankre popupen mot nærmeste kartkant, ellers stikker den utenfor bildet
    const left = parseFloat(info.left);
    const side = left > 60 ? 'to-right' : (left < 40 ? 'to-left' : 'centered');
    const pop = el('div', 'pin-pop ' + (above ? 'above' : 'below') + ' ' + side +
      (narrow ? ' compact' : ''));

    // På mobil er kartet lavt - kicker og åpningstid utgår, de står i
    // detaljkortet under kartet. Bare navn og retter får plass.
    if (!narrow) {
      pop.appendChild(el('div', 'pin-pop-kicker',
        (info.cafe ? t().cafeLabel : t().buildingLabel + ' ' + info.building) +
        (info.isDinner ? ' · ' + t().dinnerKicker : '')));
    }
    pop.appendChild(el('div', 'pin-pop-name', info.name));
    if (!narrow || info.cafe) {
      const ph = el('div', 'pin-pop-hours', info.hours);
      ph.appendChild(openBadge(info.hours));
      pop.appendChild(ph);
    }
    if (!narrow && WALK[id]) {
      const walk = el('div', 'pin-pop-walk', walkText(id));
      walk.title = t().walkTitle;
      pop.appendChild(walk);
    }
    if (info.lunchHours && !narrow) {
      pop.appendChild(el('div', 'pin-pop-window',
        '(' + t().lunchWindow + ' ' + info.lunchHours + ')'));
    }
    if (info.cafe) {
      if (info.note) {
        const fri = todayWeekKey() === 'fri';
        pop.appendChild(el('div', 'pin-pop-note' + (fri ? ' hot' : ''),
          fri ? t().expoFridayToday : info.note));
      }
    } else {
      const dishes = el('div', 'pin-pop-dishes');
      if (info.dishes.length) {
        info.dishes.forEach(d => dishes.appendChild(el('div', null, d)));
      } else {
        dishes.appendChild(el('div', 'empty', t().noMenu));
      }
      pop.appendChild(dishes);
    }
    holder.appendChild(pop);

    map.appendChild(holder);
  });

  applyMapTransform();
  renderMapDetail();
}

function renderMapDetail() {
  const detail = $('#mapDetail');
  detail.textContent = '';
  const shownId = state.selected || state.hovered;
  if (!shownId) {
    detail.appendChild(el('p', 'map-hint', t().mapEmpty));
    return;
  }
  const info = shownPlace(shownId);
  const card = el('div', 'card map-detail');
  card.appendChild(el('div', 'card-kicker',
    (info.cafe ? t().cafeLabel : t().buildingLabel + ' ' + info.building) +
    (info.isDinner ? ' · ' + t().dinnerKicker : '')));
  card.appendChild(el('div', 'card-title', info.name));
  const dh = el('div', 'detail-hours', info.hours);
  dh.appendChild(openBadge(info.hours));
  card.appendChild(dh);
  if (WALK[shownId]) {
    const walk = el('div', 'detail-walk', walkText(shownId));
    walk.title = t().walkTitle;
    card.appendChild(walk);
  }
  if (info.lunchHours) {
    card.appendChild(el('div', 'detail-window',
      '(' + t().lunchWindow + ' ' + info.lunchHours + ')'));
  }
  if (info.cafe) {
    if (info.note) {
      const fri = todayWeekKey() === 'fri';
      card.appendChild(el('div', 'detail-note' + (fri ? ' hot' : ''),
        fri ? t().expoFridayToday : info.note));
    }
  } else {
    const dishes = el('div', 'detail-dishes');
    info.dishes.forEach(d => dishes.appendChild(el('div', null, d)));
    card.appendChild(dishes);
  }
  if (GEO[shownId]?.vote) {
    card.appendChild(el('div', 'card-meta', votesText(state.votes[shownId] || 0)));
  }
  detail.appendChild(card);
}

function setHover(id) {
  state.hovered = id;
  $$('.pin-holder').forEach((n, i) => {
    n.classList.toggle('hot', Object.keys(GEO)[i] === id);
  });
  renderMapDetail();
}

/** Nyeste endring på tvers av alle menyfilene, til bunnlinja. */
function renderLastStamp() {
  const box = $('#lastStamp');
  const data = state.data;
  if (!box || !data) return;
  const all = [data.generated, data.dailyUpdated,
    ...Object.values(data.places || {}).map(p => p.updated)]
    .map(s => new Date(s)).filter(d => !isNaN(d));
  if (!all.length) { box.textContent = ''; return; }
  box.textContent = stampText(new Date(Math.max(...all)).toISOString());
}

/** ISO 8601-ukenummer (norsk standard: uka starter mandag). */
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  return Math.ceil(((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7);
}

function render() {
  renderStrings();
  renderLastStamp();
  renderTabs();
  // Hjulet tegnes på nytt ved språk- og temabytte mens dialogen står åpen.
  if (wheelModal && !wheelModal.hidden) renderWheel();
  renderCanteens();
  renderMap();
  renderLegend();
  renderTip();
}

// ------------------------------------------------------------------ voting

async function loadTraffic() {
  try {
    const r = await fetch('/api/traffic');
    if (!r.ok) { state.offline = true; return; }
    const d = await r.json();
    state.votes = d.votes || {};
    state.myVote = d.myVote || null;
    renderCanteens();
    renderMap();
  } catch { /* trafikk er ikke kritisk */ }
}

/** Liten konfettifontene fra stemmeknappen - 14 biter, ~900 ms, ryddes bort. */
function microConfetti(origin) {
  if (!origin || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = el('div', 'confetti');
  box.style.left = origin.x + 'px';
  box.style.top = origin.y + 'px';
  const tones = ['#c67139', '#7a8a5e', '#1c16c5', '#e0a066', '#0080a6'];
  for (let i = 0; i < 14; i++) {
    const bit = el('i');
    const ang = (-90 + (Math.random() * 120 - 60)) * Math.PI / 180;
    const dist = 26 + Math.random() * 34;
    bit.style.background = tones[i % tones.length];
    bit.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    bit.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
    bit.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
    bit.style.animationDelay = (Math.random() * 70) + 'ms';
    box.appendChild(bit);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 1100);
}

/** Teller stemmen lokalt når API-et ikke svarer (forhåndsvisning uten server). */
function voteOffline(id) {
  const v = { ...state.votes };
  if (state.myVote) v[state.myVote] = Math.max(0, (v[state.myVote] || 1) - 1);
  if (state.myVote === id) {
    state.myVote = null;
  } else {
    v[id] = (v[id] || 0) + 1;
    state.myVote = id;
  }
  state.votes = v;
}

function postVote(id) {
  return fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ place: id })
  });
}

/** Avvist stemme (for rask, sperret, for mange): si det i stedet for å late
    som den ble registrert lokalt. */
function showVoteError(msg) {
  const box = el('div', 'vote-error');
  box.textContent = msg;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3200);
}

async function castVote(id, anchor) {
  const wasMine = state.myVote === id;
  if (!wasMine) track('stem', id);
  // Posisjonen må leses nå - etter render er knappen byttet ut og måler 0.
  let origin = null;
  if (anchor) {
    const r = anchor.getBoundingClientRect();
    origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  try {
    if (state.offline) throw new Error('offline');
    let r = await postVote(id);

    // Sesjonscookien mangler eller er utløpt: hent /api/traffic (som utsteder
    // en ny) og prøv én gang til.
    if (r.status === 403) {
      const d = await r.clone().json().catch(() => ({}));
      if (d.retry) {
        await fetch('/api/traffic');
        r = await postVote(id);
      }
    }

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      if (d.error) { showVoteError(d.error); return; }
      throw new Error(r.status);
    }
    const d = await r.json();
    state.votes = d.votes || {};
    state.myVote = d.myVote || null;
  } catch {
    state.offline = true;
    voteOffline(id);
  }
  renderCanteens();
  renderMap();
  if (!wasMine && state.myVote === id) microConfetti(origin);
}

// ------------------------------------------------------------------ copy

function menuAsText() {
  const lines = [t().heading + ' - ' + $('#datestamp').textContent, ''];
  [...LUNCH_IDS, 'bakern', 'cafem', 'dinner'].forEach(id => {
    const info = placeInfo(id);
    lines.push(`${info.name} (${t().buildingLabel} ${info.building}, ${info.hours})`);
    if (info.dishes.length) {
      info.dishes.forEach(d => lines.push('  • ' + d));
    } else {
      lines.push('  ' + t().noMenu);
    }
    lines.push('');
  });
  return lines.join('\n').trim();
}

let toastTimer = null;

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  // to frames så overgangen faktisk kjører
  requestAnimationFrame(() => toast.classList.add('on'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('on');
    setTimeout(() => { toast.hidden = true; }, 250);
  }, 2400);
}

function flashCopied() {
  showToast(t().copiedToast);
}

function copyMenu() {
  track('kopier');
  const text = menuAsText();
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    if (ok) {
      flashCopied();
    } else {
      $('#copyFallbackText').value = text;
      $('#copyFallback').hidden = false;
    }
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(flashCopied).catch(fallback);
  } else {
    fallback();
  }
}

// ------------------------------------------------------------------ feedback

async function sendFeedback(kind, message) {
  track('tilbakemelding');
  const status = $('#fbStatus');
  status.textContent = t().fbSending;
  try {
    const r = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, message })
    });
    if (!r.ok) throw new Error(r.status);
    status.textContent = t().fbThanks;
    if (message) {
      // Fritekst er sendt - da er vi ferdige
      $('#fbVotes').hidden = true;
      $('#fbText').hidden = true;
      $('#fbDetail').hidden = true;
      $('#fbMessage').value = '';
    } else {
      // Tommelen er registrert, men fritekstfeltet skal bli stående
      $('#fbText').hidden = false;
      $('#fbDetail').hidden = true;
    }
  } catch {
    status.textContent = t().fbError;
  }
}

function resetFeedback() {
  state.fbKind = null;
  $$('[data-fb]').forEach(b => b.classList.remove('picked'));
  $('#fbVotes').hidden = false;
  $('#fbText').hidden = true;
  $('#fbDetail').hidden = false;
  $('#fbStatus').textContent = '';
}

// --------------------------------------------------------------- statistikk
// Anonym telling til egen server (ingen cookies, ingen tredjepart).
// Grove kjennetegn som skiller nettlesere bak samme IP-adresse fra hverandre.
// Sendes bare med for å telle unike riktig - serveren lagrer dem ikke.
function clientHint() {
  try {
    return [screen.width + 'x' + screen.height, devicePixelRatio,
      (navigator.languages || [navigator.language]).join(','),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency || ''].join('|');
  } catch (e) {
    return '';
  }
}

function track(e, p) {
  const body = JSON.stringify(e === 'view'
    ? { t: 'view', lang: state.lang, day: state.day, fp: clientHint(),
        mobile: matchMedia('(max-width: 700px)').matches,
        app: matchMedia('(display-mode: standalone)').matches }
    : { t: 'event', e, p: p || '' });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/stats', new Blob([body], { type: 'text/plain' }))) return;
    fetch('/api/stats', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  } catch (err) {}
}

// ------------------------------------------------------------------ wiring

$$('[data-lang]').forEach(b => {
  b.onclick = () => { if (state.lang !== b.dataset.lang) track('sprak'); state.lang = b.dataset.lang; writeUrl(); render(); };
});

// Trykk utenfor en markør lukker popupen og detaljkortet
document.addEventListener('pointerdown', e => {
  if (e.target.closest && e.target.closest('.pin-holder')) return;
  if (state.selected || state.hovered) {
    state.selected = null;
    state.hovered = null;
    renderMap();
  }
});

$('#allergyToggle').onclick = () => {
  state.allergens = !state.allergens;
  if (state.allergens) track('allergener');
  writeUrl();
  render();
};

$('#weekendCta').onclick = () => {
  state.day = 'mon';
  writeUrl();
  render();
};

$('#mapZoomIn').onclick = () => setZoom(state.zoom + 0.5);
$('#mapZoomOut').onclick = () => setZoom(state.zoom - 0.5);
$('#mapZoomReset').onclick = () => setZoom(1);

const mapBox = $('#map');

mapBox.addEventListener('wheel', e => {
  if (!e.ctrlKey && Math.abs(e.deltaY) < 2) return;
  e.preventDefault();
  const box = mapBox.getBoundingClientRect();
  const ox = e.clientX - box.left - box.width / 2;
  const oy = e.clientY - box.top - box.height / 2;
  setZoom(state.zoom + (e.deltaY < 0 ? 0.3 : -0.3), ox, oy);
}, { passive: false });

let drag = null;

mapBox.addEventListener('pointerdown', e => {
  if (state.zoom <= 1 || e.target.closest('.pin')) return;
  drag = { x: e.clientX, y: e.clientY, px: state.panX, py: state.panY };
  mapBox.setPointerCapture(e.pointerId);
  mapBox.classList.add('dragging');
});

mapBox.addEventListener('pointermove', e => {
  if (!drag) return;
  state.panX = drag.px + (e.clientX - drag.x);
  state.panY = drag.py + (e.clientY - drag.y);
  clampPan();
  applyMapTransform();
});

mapBox.addEventListener('pointerup', () => {
  drag = null;
  mapBox.classList.remove('dragging');
});

// Dobbelttrykk = zoom inn/ut
mapBox.addEventListener('dblclick', e => {
  const box = mapBox.getBoundingClientRect();
  const ox = e.clientX - box.left - box.width / 2;
  const oy = e.clientY - box.top - box.height / 2;
  setZoom(state.zoom > 1 ? 1 : 2, ox, oy);
});

const themeBtn = $('#themeToggle');

function syncThemeLabel() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const label = dark ? t().themeLight : t().themeDark;
  themeBtn.title = label;
  themeBtn.setAttribute('aria-label', label);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#16181d' : '#1c16c5';
}

themeBtn.onclick = () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  if (!dark) track('mork_modus');
  if (dark) {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = 'dark';
  }
  try { localStorage.setItem('lunsj-theme', dark ? 'light' : 'dark'); } catch {}
  syncThemeLabel();
  render(); // markørfarger og kort må tegnes på nytt for det nye temaet
};

$('#copyBtn').onclick = copyMenu;
$('#closeFallback').onclick = () => { $('#copyFallback').hidden = true; };

$('#fbLaunch').onclick = () => {
  const panel = $('#fbPanel');
  panel.hidden = !panel.hidden;
  if (!panel.hidden) resetFeedback();
};
$('#fbClose').onclick = () => { $('#fbPanel').hidden = true; };
$('#fbDetail').onclick = () => {
  $('#fbVotes').hidden = true;
  $('#fbText').hidden = false;
  $('#fbDetail').hidden = true;
  $('#fbMessage').focus();
};
$$('[data-fb]').forEach(b => {
  b.onclick = () => {
    state.fbKind = b.dataset.fb;
    $$('[data-fb]').forEach(x => x.classList.toggle('picked', x === b));
    sendFeedback(b.dataset.fb);
  };
});
$('#fbSend').onclick = () => {
  const msg = $('#fbMessage').value.trim();
  if (msg) sendFeedback(state.fbKind || 'text', msg);
};

// ------------------------------------------------------------------ install
//
// Chrome/Edge/Android gir oss beforeinstallprompt og en ekte installdialog.
// iOS Safari har ikke noe API, så der forklarer vi framgangsmåten i stedet.

const installBtn = $('#installBtn');
let installPrompt = null;

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

if (installBtn) {
  if (isIos() && !isStandalone()) installBtn.hidden = false;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    installBtn.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installBtn.hidden = true;
    showToast(t().installed);
  });

  installBtn.onclick = async () => {
    track('installer');
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      installPrompt = null;
      if (outcome === 'accepted') installBtn.hidden = true;
    } else {
      showToast(t().installIos);
    }
  };
}

// ------------------------------------------------------------------ hjulet
//
// «Velg for meg»: et lykkehjul mellom stedene brukeren vurderer. Hvilke steder
// som er med lagres i localStorage, så valget står til neste besøk.

const WHEEL_IDS = [...LUNCH_IDS, 'bakern', 'cafem'];
const WHEEL_KEY = 'lunsj-wheel-picks';

const wheelModal = $('#wheelModal');
const wheelBackdrop = $('#wheelBackdrop');
const wheelCanvas = $('#wheelCanvas');

const wheel = { picks: [...WHEEL_IDS], angle: 0, spinning: false, winner: null, timer: null };

try {
  const saved = JSON.parse(localStorage.getItem(WHEEL_KEY) || 'null');
  if (Array.isArray(saved)) {
    const kept = saved.filter(id => WHEEL_IDS.includes(id));
    if (kept.length) wheel.picks = kept;
  }
} catch {}

function savePicks() {
  try { localStorage.setItem(WHEEL_KEY, JSON.stringify(wheel.picks)); } catch {}
}

/** Stedene på hjulet, i fast rekkefølge, med navn og farge fra menydataene. */
function wheelSlices() {
  return WHEEL_IDS.filter(id => wheel.picks.includes(id)).map(id => {
    const p = placeInfo(id);
    return { id, name: p.name, color: p.color };
  });
}

function renderWheelOpts() {
  const box = $('#wheelOpts');
  box.textContent = '';
  WHEEL_IDS.forEach(id => {
    const p = placeInfo(id);
    const on = wheel.picks.includes(id);
    const b = el('button', 'wheel-opt' + (on ? ' is-on' : ''));
    b.type = 'button';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.disabled = wheel.spinning;

    const dot = el('span', 'wheel-dot');
    dot.style.background = on ? p.color : 'transparent';
    dot.style.borderColor = p.color;
    b.appendChild(dot);
    b.appendChild(el('span', null, p.name));

    b.onclick = () => {
      if (wheel.spinning) return;
      wheel.picks = on ? wheel.picks.filter(x => x !== id) : [...wheel.picks, id];
      savePicks();
      wheel.winner = null;
      renderWheel();
    };
    box.appendChild(b);
  });
}

function drawWheel() {
  const ctx = wheelCanvas.getContext('2d');
  const size = wheelCanvas.width;
  const r = size / 2;
  const slices = wheelSlices();

  ctx.clearRect(0, 0, size, size);
  wheelCanvas.style.transform = `rotate(${wheel.angle}deg)`;

  if (slices.length < 2) {
    ctx.beginPath();
    ctx.arc(r, r, r - 8, 0, Math.PI * 2);
    ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.07)' : 'rgba(11,16,32,0.06)';
    ctx.fill();
    return;
  }

  const step = (Math.PI * 2) / slices.length;
  const hub = 44;
  const textOuter = r - 34;
  const room = textOuter - hub - 8; // radial plass mellom nav og ytterkant

  slices.forEach((s, i) => {
    const from = -Math.PI / 2 + i * step;

    ctx.beginPath();
    ctx.moveTo(r, r);
    ctx.arc(r, r, r - 8, from, from + step);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = isDark() ? '#12161f' : '#ffffff';
    ctx.stroke();
  });

  // Navet først, så teksten - ellers spiser fyllet de første bokstavene.
  ctx.beginPath();
  ctx.arc(r, r, hub, 0, Math.PI * 2);
  ctx.fillStyle = isDark() ? '#12161f' : '#ffffff';
  ctx.fill();

  slices.forEach((s, i) => {
    const from = -Math.PI / 2 + i * step;

    // Navnet skrives langs radien, med bunnen mot sentrum. Lange navn
    // krympes til de får plass mellom nav og ytterkant.
    let size = 34;
    ctx.font = `700 ${size}px Figtree, system-ui, sans-serif`;
    while (size > 16 && ctx.measureText(s.name).width > room) {
      size -= 1;
      ctx.font = `700 ${size}px Figtree, system-ui, sans-serif`;
    }

    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(from + step / 2);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.name, textOuter, 0);
    ctx.restore();
  });
}

function renderWheel() {
  renderWheelOpts();
  drawWheel();

  const slices = wheelSlices();
  const spin = $('#wheelSpin');
  spin.disabled = slices.length < 2 || wheel.spinning;
  spin.textContent = wheel.spinning
    ? t().wheelSpinning
    : (wheel.winner ? t().wheelAgain : t().wheelSpin);

  const out = $('#wheelResult');
  out.textContent = '';
  out.className = 'wheel-result';

  if (slices.length < 2) {
    out.className = 'wheel-result is-hint';
    out.textContent = t().wheelNeedTwo;
    return;
  }
  if (wheel.winner && !wheel.spinning) {
    const p = placeInfo(wheel.winner);
    out.className = 'wheel-result is-win';
    out.appendChild(el('span', 'wheel-result-kicker', t().wheelWinner));
    const name = el('span', 'wheel-result-name', p.name);
    name.style.color = p.color;
    out.appendChild(name);
    const meta = [p.building, p.lunchHours || p.hours].filter(Boolean).join(' · ');
    if (meta) out.appendChild(el('span', 'wheel-result-meta', meta));
  }
}

function spinWheel() {
  const slices = wheelSlices();
  if (slices.length < 2 || wheel.spinning) return;
  track('hjul');

  const i = Math.floor(Math.random() * slices.length);
  const step = 360 / slices.length;
  const center = i * step + step / 2; // grader fra pinnen, med klokka
  const target = wheel.angle - (wheel.angle % 360) + 360 * 4 + ((360 - center) % 360);

  wheel.winner = null;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const land = () => {
    clearTimeout(wheel.timer);
    wheel.timer = null;
    wheel.spinning = false;
    wheel.winner = slices[i].id;
    renderWheel();
  };

  if (still) {
    wheel.angle = target;
    land();
    return;
  }

  wheel.spinning = true;
  wheel.angle = target;
  renderWheel();
  // Klokka avslutter spinnen. transitionend er upålitelig her: den kommer
  // ikke i alle nettlesere, og uteblir helt om dialogen lukkes underveis.
  wheel.timer = setTimeout(land, 4000);
}

function toggleWheel(open) {
  if (!wheelModal) return;
  // En spinn som ble avbrutt ved lukking skal ikke etterlate knappen låst.
  if (!open && wheel.spinning) {
    clearTimeout(wheel.timer);
    wheel.timer = null;
    wheel.spinning = false;
  }
  wheelModal.hidden = !open;
  wheelBackdrop.hidden = !open;
  if (open) {
    renderWheel();
    $('#wheelClose').focus();
  }
}

if (wheelModal) {
  $('#wheelBtn').onclick = () => toggleWheel(true);
  $('#wheelClose').onclick = () => toggleWheel(false);
  wheelBackdrop.onclick = () => toggleWheel(false);
  $('#wheelSpin').onclick = spinWheel;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !wheelModal.hidden) toggleWheel(false);
  });
}

// ------------------------------------------------------------------ bakern-meny
//
// Bakern legger ukemenyen ut som en skjermwidget. Den vises i en iframe i en
// dialog; src settes først ved åpning så siden ikke laster widgeten unødig.

// Skjermen widgeten er laget for. Iframen får denne størrelsen og skaleres
// ned til rammen, så hele menyen synes uten scrolling eller beskjæring.
const BAKERN_W = 1080;
const BAKERN_H = 1920;

function fitBakern() {
  const frame = $('#bakernFrame');
  if (!frame || bakernModal.hidden) return;
  const s = frame.parentElement.clientWidth / BAKERN_W;
  frame.style.transform = 'scale(' + s + ')';
}

const bakernModal = $('#bakernModal');
const bakernBackdrop = $('#bakernBackdrop');

function toggleBakern(open, url = BAKERN_FRAME_URL, name = 'Bakern') {
  if (!bakernModal) return;
  const frame = $('#bakernFrame');
  if (open && frame.src !== url) frame.src = url;
  if (open) {
    $('#bakernExternal').href = url;
    $('#bakernTitle').textContent = t().bakernPreviewTitle.replace('Bakern', name);
    frame.title = name;
  }
  bakernModal.hidden = !open;
  bakernBackdrop.hidden = !open;
  if (open) {
    fitBakern();
    $('#bakernClose').focus();
  }
}

if (bakernModal) {
  $('#bakernClose').onclick = () => toggleBakern(false);
  bakernBackdrop.onclick = () => toggleBakern(false);
  window.addEventListener('resize', fitBakern);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !bakernModal.hidden) toggleBakern(false);
  });
}

// ------------------------------------------------------------------ om siden

const aboutModal = $('#aboutModal');
const aboutBackdrop = $('#aboutBackdrop');

function toggleAbout(open) {
  if (!aboutModal) return;
  aboutModal.hidden = !open;
  aboutBackdrop.hidden = !open;
  if (open) $('#aboutClose').focus();
  else $('#aboutBtn').focus();
}

// Kontaktknappene fylles med CONTACT_EMAIL av serveren. Er den ikke satt,
// skjules de i stedet for å peke på en adresse som ikke finnes.
(() => {
  const link = $('#aboutWebexLink');
  if (!link) return;
  const email = (link.getAttribute('href') || '').split('email=')[1] || '';
  if (!email || email.includes('__CONTACT_EMAIL__')) {
    link.hidden = true;
    const alt = document.querySelector('.about-alt');
    if (alt) alt.hidden = true;
  }
})();

if (aboutModal) {
  $('#aboutBtn').onclick = () => toggleAbout(true);
  $('#aboutClose').onclick = () => toggleAbout(false);
  aboutBackdrop.onclick = () => toggleAbout(false);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !aboutModal.hidden) toggleAbout(false);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ------------------------------------------------------------------ sesongpynt
//
// Serveren setter data-season på <html> (høst, vinter, jul, påske, 17. mai).
// Her legges snø/løv i bakgrunnen, og brukeren kan skru pynten av og på.
// Partiklene ligger bak innholdet, så de aldri dekker tekst.

const SEASON_ICON = { host: '🍂', vinter: '❄️', jul: '🎄', paske: '🐣', '17mai': '🇳🇴' };
const SEASON_FX = {
  host: { count: 9, glyphs: ['🍂', '🍁', '🍂'] },
  vinter: { count: 18 },
  jul: { count: 22 }
};

function renderSeasonFx() {
  document.querySelector('.season-fx')?.remove();
  const season = document.documentElement.dataset.season;
  const fx = SEASON_FX[season];
  if (!fx) return;
  const layer = el('div', 'season-fx');
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < fx.count; i++) {
    const p = el('i', fx.glyphs ? 'leaf' : 'flake');
    if (fx.glyphs) p.textContent = fx.glyphs[i % fx.glyphs.length];
    const size = fx.glyphs ? 12 + Math.random() * 8 : 3 + Math.random() * 4;
    p.style.left = (Math.random() * 100).toFixed(1) + '%';
    p.style.setProperty('--size', size.toFixed(1) + 'px');
    p.style.setProperty('--drift', ((Math.random() - 0.5) * 120).toFixed(0) + 'px');
    p.style.animationDuration = (fx.glyphs ? 16 + Math.random() * 12 : 12 + Math.random() * 14).toFixed(1) + 's';
    p.style.animationDelay = (-Math.random() * 26).toFixed(1) + 's';
    layer.appendChild(p);
  }
  document.body.prepend(layer);
}

const seasonBtn = $('#seasonToggle');

function syncSeasonBtn() {
  const avail = document.documentElement.dataset.seasonAvail;
  if (!seasonBtn) return;
  seasonBtn.hidden = !avail;
  if (!avail) return;
  const on = !!document.documentElement.dataset.season;
  seasonBtn.querySelector('.season-ico').textContent = SEASON_ICON[avail] || '✨';
  seasonBtn.classList.toggle('is-off', !on);
  const label = on ? t().seasonOff : t().seasonOn;
  seasonBtn.title = label;
  seasonBtn.setAttribute('aria-label', label);
  seasonBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
}

if (seasonBtn) {
  seasonBtn.onclick = () => {
    const root = document.documentElement;
    const on = !!root.dataset.season;
    track(on ? 'sesong_av' : 'sesong_pa');
    if (on) delete root.dataset.season;
    else root.dataset.season = root.dataset.seasonAvail;
    try { localStorage.setItem('lunsj-season', on ? 'off' : 'on'); } catch (e) {}
    renderSeasonFx();
    syncSeasonBtn();
  };
}

// ------------------------------------------------------------------ push
//
// Daglig varsel med dagens meny, til et tidspunkt og dager hver bruker velger
// selv. Abonnementet lagres på serveren (uten navn eller e-post - bare
// nettleserens push-adresse), som sender varselet via Web Push.

const pushBtn = $('#pushBtn');
const pushModal = $('#pushModal');
const pushBackdrop = $('#pushBackdrop');
const PUSH = { key: null, sub: null, on: false, time: '10:25', days: [0, 1, 2, 3, 4], iosHint: false };
const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function b64ToBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function pushApi(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'HTTP ' + r.status);
  return data;
}

async function initPush() {
  if (!pushBtn) return;
  if (!pushSupported) {
    // iPhone uten Hjem-skjerm: vis bjella, men forklar hva som må til
    if (isIos() && !isStandalone()) { PUSH.iosHint = true; pushBtn.hidden = false; syncPushBtn(); }
    return;
  }
  try {
    const r = await fetch('/api/push/key');
    if (!r.ok) return;               // serveren har ikke push skrudd på
    PUSH.key = (await r.json()).key;
  } catch (e) { return; }
  pushBtn.hidden = false;
  try {
    const reg = await navigator.serviceWorker.ready;
    PUSH.sub = await reg.pushManager.getSubscription();
    if (PUSH.sub) {
      const r = await pushApi('/api/push/lookup', { endpoint: PUSH.sub.endpoint });
      if (r.found) Object.assign(PUSH, { on: true, time: r.time, days: r.days });
    }
  } catch (e) {}
  syncPushBtn();
}

function syncPushBtn() {
  if (!pushBtn) return;
  pushBtn.classList.toggle('btn-secondary', PUSH.on);
  pushBtn.classList.toggle('btn-ghost', !PUSH.on);
  pushBtn.title = t().pushBtn;
  pushBtn.setAttribute('aria-label', t().pushBtn);
}

function pushMsg(text, bad) {
  const m = $('#pushMsg');
  m.textContent = text || '';
  m.className = 'push-msg' + (bad ? ' bad' : text ? ' ok' : '');
}

function renderPushModal() {
  $('#pushIntro').textContent = PUSH.iosHint ? t().pushIos : (PUSH.on ? t().pushIntroOn : t().pushIntroOff);
  $('#pushSettings').hidden = PUSH.iosHint;
  $('#pushSave').hidden = PUSH.iosHint;
  $('#pushSave').textContent = PUSH.on ? t().pushSaveBtn : t().pushEnable;
  $('#pushOff').hidden = !PUSH.on;
  $('#pushTest').hidden = !PUSH.on;

  const sel = $('#pushTime');
  if (!sel.options.length) {
    for (let m = 7 * 60; m <= 14 * 60; m += 5) {
      const v = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
      sel.appendChild(new Option(v, v));
    }
  }
  sel.value = PUSH.time;

  const days = $('#pushDays');
  days.textContent = '';
  DAY_KEYS.forEach((k, i) => {
    const b = el('button', 'wheel-opt' + (PUSH.days.includes(i) ? ' is-on' : ''), t()[k + 'Short']);
    b.type = 'button';
    b.setAttribute('aria-pressed', PUSH.days.includes(i) ? 'true' : 'false');
    b.onclick = () => {
      PUSH.days = PUSH.days.includes(i) ? PUSH.days.filter(d => d !== i) : [...PUSH.days, i].sort();
      renderPushModal();
    };
    days.appendChild(b);
  });
}

function togglePush(open) {
  if (!pushModal) return;
  pushModal.hidden = !open;
  pushBackdrop.hidden = !open;
  if (open) {
    pushMsg('');
    renderPushModal();
    $('#pushClose').focus();
  } else {
    pushBtn.focus();
  }
}

async function savePush() {
  PUSH.time = $('#pushTime').value;
  if (!PUSH.days.length) return pushMsg(t().pushNeedDay, true);
  track('push_pa');
  const btn = $('#pushSave');
  btn.disabled = true;
  try {
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return pushMsg(t().pushDenied, true);
    }
    const reg = await navigator.serviceWorker.ready;
    PUSH.sub = await reg.pushManager.getSubscription() ||
      await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(PUSH.key) });
    await pushApi('/api/push/subscribe', {
      subscription: PUSH.sub.toJSON(), time: PUSH.time, days: PUSH.days, lang: state.lang
    });
    PUSH.on = true;
    renderPushModal();
    syncPushBtn();
    pushMsg(t().pushSaved.replace('{t}', PUSH.time));
  } catch (e) {
    pushMsg(t().pushError.replace('{e}', e.message), true);
  } finally {
    btn.disabled = false;
  }
}

async function disablePush() {
  track('push_av');
  try {
    if (PUSH.sub) {
      await pushApi('/api/push/unsubscribe', { endpoint: PUSH.sub.endpoint }).catch(() => {});
      await PUSH.sub.unsubscribe().catch(() => {});
    }
    PUSH.sub = null;
    PUSH.on = false;
    renderPushModal();
    syncPushBtn();
    pushMsg(t().pushOffDone);
  } catch (e) {
    pushMsg(t().pushError.replace('{e}', e.message), true);
  }
}

async function testPush() {
  const btn = $('#pushTest');
  btn.disabled = true;
  pushMsg('…');
  try {
    await pushApi('/api/push/test', { endpoint: PUSH.sub?.endpoint, lang: state.lang });
    pushMsg(t().pushTestSent);
  } catch (e) {
    btn.disabled = false;
    pushMsg(t().pushError.replace('{e}', e.message), true);
  } finally {
    btn.disabled = false;
  }
}

if (pushModal) {
  pushBtn.onclick = () => togglePush(true);
  $('#pushClose').onclick = () => togglePush(false);
  pushBackdrop.onclick = () => togglePush(false);
  $('#pushSave').onclick = savePush;
  $('#pushOff').onclick = disablePush;
  $('#pushTest').onclick = testPush;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !pushModal.hidden) togglePush(false);
  });
}

// ------------------------------------------------------------------ boot

async function boot() {
  readUrl();
  writeUrl();
  renderStrings();
  try {
    const r = await fetch('menu.json?v=' + Date.now());
    state.data = await r.json();
  } catch (e) {
    console.error('Kunne ikke laste menu.json', e);
  }
  render();
  track('view');
  loadTraffic();
  loadBanner();
  loadTip();
  renderSeasonFx();
  initPush();
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderMap, 200);
});

boot();
