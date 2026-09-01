/* app.js - Lunsjmeny Fornebu
   Leser public/menu.json og snakker med /api/traffic, /api/vote, /api/feedback. */

const UI = {
  no: {
    heading: 'LUNSJMENY FORNEBU',
    sub: 'Tre kantiner og et bakeri - dagens meny på ett sted.',
    showingToday: 'Viser dagens meny', oldSite: 'Bytt til gammel side', themeDark: 'Bytt til mørk modus', themeLight: 'Bytt til lys modus',
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
    staticMenu: 'Fast meny hele uken', buildingLabel: 'Bygg', cafeLabel: 'Kafé',
    openLabel: 'Åpent', lunchWindow: 'lunsjtilbudet gjelder',
    bakeryAlways: 'Bakevarer og nystekt brød hele åpningstiden.',
    bannerHide: 'Skjul melding', lunchWindowShort: 'Lunsjtilbud',
    manualFlag: 'Skrevet manuelt', bakernLink: 'Åpne Bakern sin egen meny',
    lastUpdated: 'Sist oppdatert',
    allergyTodayOnly: 'Allergener vises kun for dagens meny',
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
    aboutMadeH: 'Laget av', aboutMadeP: 'Siden er laget på fritiden av Marius Bråthen, som et hobbyprosjekt. Den er ikke et offisielt ISS- eller bedriftsverktøy.',
    aboutHostH: 'Drift og hosting', aboutHostP: 'Løsningen kjører på en egen server utenfor bedriftens nettverk. Menyene hentes automatisk fra kjøkkenets egne filer flere ganger hver dag - ingen personopplysninger lagres, kun anonyme stemmer og tilbakemeldinger.',
    aboutWebexH: 'Bli med i Webex-gruppen', aboutWebexP: 'Det finnes en åpen Webex-gruppe som varsler dagens meny automatisk. Ta kontakt, så legges du til automatisk.',
    aboutWebexCta: 'Send melding på Webex',
    aboutWebexAlt: 'Eller send e-post i stedet',
    aboutNote: 'Forslag og feil? Bruk «Gi tilbakemelding» nede til høyre.',
    footerNote: 'Menyene hentes automatisk fra kjøkkenets egne filer, som før.'
  },
  en: {
    heading: 'LUNCH MENU FORNEBU',
    sub: 'Three canteens and a bakery - today\u2019s menu in one place.',
    showingToday: 'Showing today\u2019s menu', oldSite: 'Switch to the old site', themeDark: 'Switch to dark mode', themeLight: 'Switch to light mode',
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
    staticMenu: 'Same menu all week', buildingLabel: 'Building', cafeLabel: 'Café',
    openLabel: 'Open', lunchWindow: 'lunch offer served',
    bakeryAlways: 'Pastries and freshly baked bread all day.',
    bannerHide: 'Hide message', lunchWindowShort: 'Lunch offer',
    manualFlag: 'Entered manually', bakernLink: 'Open Bakern\u2019s own menu',
    lastUpdated: 'Last updated',
    allergyTodayOnly: 'Allergens are only available for today\u2019s menu',
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
    aboutMadeH: 'Made by', aboutMadeP: 'Built in spare time by Marius Bråthen as a hobby project. It is not an official ISS or company tool.',
    aboutHostH: 'Hosting and operations', aboutHostP: 'The site runs on a private server outside the company network. Menus are pulled automatically from the ISS\u2019s site several times a day - no personal data is stored, only anonymous votes and feedback.',
    aboutWebexH: 'Join the Webex group', aboutWebexP: 'There is an open Webex space that pings every today\u2019s. Get in touch and you are added automatically.',
    aboutWebexCta: 'Message on Webex',
    aboutWebexAlt: 'Or send an email instead',
    aboutNote: 'Suggestions or bugs? Use “Give feedback” in the bottom right.',
    footerNote: 'Menus are still pulled automatically from the kitchen\u2019s own files, same as before.'
  }
};

// Bakern legger ukesmenyen sin ut som bilde i denne skjermwidgeten
const BAKERN_MENU_URL =
  'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=e7420bcd-79cf-4268-abb6-08ccca3a7e89&scaleToFit=true';

const FRIDAY_LINES = {
  no: ['Endelig fredag!', 'Ha en fin fredag!', 'Er det fredag? Ja. 🙌', 'God helg - men først lunsj.'],
  en: ['Finally Friday!', 'Have a great Friday!', 'Is it Friday? Yes. 🙌', 'Happy weekend - lunch first.']
};
const FRIDAY_IDX = Math.floor(Math.random() * 4);

// Kartposisjon og farge per sted. Juster left/top for å flytte markørene.
const GEO = {
  street:    { color: '#1c16c5', dark: '#6f92ff', left: '30%', top: '80%', vote: true },
  m:         { color: '#0080a6', dark: '#38c9e8', left: '74%', top: '56%', vote: true },
  fresh4you: { color: '#070452', dark: '#a08cff', left: '78%', top: '21%', vote: true },
  bakern:    { color: '#8a5a2b', dark: '#e0a066', left: '61%', top: '21%', vote: false },
  // Kafeer uten meny - bare navn og åpningstid
  expo:      { color: '#7a8a5e', dark: '#b3c48c', left: '86%', top: '30%', vote: false, cafe: true,
               name: 'Café Expo', hours: '08:00 – 15:00', noteKey: 'expoFriday' },
  hotspot:   { color: '#7a8a5e', dark: '#b3c48c', left: '45%', top: '50%', vote: false, cafe: true,
               name: 'Hot Spot', hours: '07:30 – 14:30' },
  cafem:     { color: '#7a8a5e', dark: '#b3c48c', left: '68%', top: '63%', vote: false, cafe: true,
               name: 'Cafe M', hours: '08:30 – 15:30' }
};

function isDark() {
  return document.documentElement.dataset.theme === 'dark';
}

const LUNCH_IDS = ['street', 'm', 'fresh4you'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

const state = {
  lang: 'no',
  day: null,
  section: 'lunch',
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

/** Rettene for et sted på valgt dag, i valgt språk. */
function dishesFor(id) {
  const data = state.data;
  if (!data || !data.places[id]) return [];

  // Dagfilene er ferskere enn ukesmenyen - bruk dem når valgt dag er i dag
  if (showingToday()) {
    // Manuelt skrevet meny fra /admin vinner over alt
    const manual = data.manual?.[id]?.items;
    if (manual && manual.length) return manual;

    // Allergenfila er menyen med allergener påført hver rett
    if (state.allergens) {
      const al = data.todayOverride?.allergens?.[id]?.items;
      if (al && al.length) return al;
    }
    const override = data.todayOverride?.[state.lang]?.[id]?.items;
    if (override && override.length) return override;
  }

  return data.places[id].week?.[state.lang]?.[activeDay()] || [];
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

function renderStrings() {
  $$('[data-t]').forEach(n => { n.textContent = t()[n.dataset.t] || ''; });
  $('#copyBtn').title = t().copyMenu;
  $('#copyBtn').setAttribute('aria-label', t().copyMenu);
  const inst = $('#installBtn');
  if (inst) {
    inst.title = t().install;
    inst.setAttribute('aria-label', t().install);
  }
  $('#fbMessage').placeholder = t().fbPlaceholder;
  if (state.banner) renderBanner();
  $('#datestamp').textContent = new Date().toLocaleDateString(
    state.lang === 'en' ? 'en-GB' : 'nb-NO',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );
  document.title = state.lang === 'en' ? 'Lunch Menu Fornebu' : 'Lunsjmeny Fornebu';
  syncThemeLabel();

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
  // Allergenene finnes bare i dagsfila, så knappen gjelder kun dagens meny.
  // Den blir stående, men utilgjengelig, på andre dager.
  const isTodayView = showingToday();
  if (!isTodayView) state.allergens = false;
  const allergyBtn = $('#allergyToggle');
  allergyBtn.classList.toggle('is-on', state.allergens);
  allergyBtn.disabled = !isTodayView;
  allergyBtn.setAttribute('aria-pressed', state.allergens ? 'true' : 'false');
  allergyBtn.title = isTodayView ? '' : t().allergyTodayOnly;

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
    b.onclick = () => { state.day = k; state.selected = null; writeUrl(); render(); };
    group.appendChild(b);
  });

  const weekend = isWeekend();
  $('.day-row').hidden = weekend;
  $('.section-row').hidden = weekend;
  $('#weekendCard').hidden = !weekend;
  $('#lunchSection').hidden = weekend || state.section !== 'lunch';
  $('#dinnerSection').hidden = weekend || state.section !== 'dinner';

  $$('[data-section]').forEach(b => {
    b.className = 'btn ' + (b.dataset.section === state.section ? 'btn-primary' : 'btn-ghost');
  });
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
  const kicker = el('div', 'card-kicker', t().buildingLabel + ' ' + info.building);
  if (info.manual) kicker.appendChild(el('span', 'manual-flag', t().manualFlag));
  card.appendChild(kicker);
  card.appendChild(el('div', 'card-title', info.name));

  const hours = el('div', 'hours');
  hours.innerHTML = CLOCK;
  hours.appendChild(el('span', null, info.hours));
  card.appendChild(hours);

  card.appendChild(dishList(info));

  if (withVote) {
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

    card.appendChild(foot);
  }
  return card;
}

function renderCanteens() {
  const grid = $('#canteenCards');
  grid.textContent = '';
  LUNCH_IDS.forEach(id => grid.appendChild(canteenCard(placeInfo(id), showingToday())));
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

// Bakern er ikke en ordinær kantine, og får derfor sin egen smale stripe
// på tvers under kantinekortene - ikke et kort i rutenettet.
function renderBakery() {
  const info = placeInfo('bakern');
  const card = $('#bakeryCard');
  if (!card) return;
  card.textContent = '';
  card.style.borderTopColor = info.color;

  const head = el('div', 'bakery-head');
  head.appendChild(el('span', 'bakery-name', info.name));
  head.appendChild(el('span', 'sep', '·'));
  head.appendChild(el('span', null, t().buildingLabel + ' ' + info.building));

  const hours = el('span', 'bakery-hours');
  hours.innerHTML = CLOCK;
  hours.appendChild(el('span', 'nowrap', info.hours));
  head.appendChild(hours);

  head.appendChild(el('span', 'tag tag-neutral', t().staticMenu));
  card.appendChild(head);

  const dishes = el('div', 'bakery-dishes');
  if (info.dishes.length) {
    info.dishes.forEach(d => {
      const item = el('span', 'bakery-dish');
      const dot = el('span', 'dot');
      dot.style.background = info.color;
      item.appendChild(dot);
      item.appendChild(el('span', null, d));
      dishes.appendChild(item);
    });
  } else {
    dishes.appendChild(el('span', 'empty', t().noMenu));
  }
  card.appendChild(dishes);

  const link = el('a', 'bakery-link');
  link.href = BAKERN_MENU_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  link.title = t().bakernLink;
  link.setAttribute('aria-label', t().bakernLink);
  link.innerHTML = '<svg viewBox="0 0 24 24" class="ico-14"><path d="M15 3h6v6"/><path d="M10 14 21 3"/>' +
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>';
  card.appendChild(link);

  const note = el('div', 'bakery-note');
  note.appendChild(el('span', null, t().bakeryAlways));
  if (info.lunchHours) {
    note.appendChild(el('span', 'sep', ' · '));
    const w = el('span', 'bakery-window', t().lunchWindowShort + ' ');
    w.appendChild(el('span', 'nowrap', info.lunchHours));
    note.appendChild(w);
  }
  card.appendChild(note);
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

function renderDinner() {
  const info = placeInfo('dinner');
  const wrap = $('#dinnerCard');
  wrap.textContent = '';
  info.color = GEO.street.color;
  const card = canteenCard(info, false);
  const stamp = stampText(updatedFor('dinner'));
  if (stamp) card.appendChild(el('div', 'card-stamp', stamp));
  wrap.appendChild(card);
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
    { label: t().legendCanteens, fill: 'linear-gradient(100deg, ' + c('street') + ' 0 34%, ' + c('m') + ' 34% 67%, ' + c('fresh4you') + ' 67% 100%)' },
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
    const info = placeInfo(id);
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
        info.cafe ? t().cafeLabel : t().buildingLabel + ' ' + info.building));
    }
    pop.appendChild(el('div', 'pin-pop-name', info.name));
    if (!narrow || info.cafe) {
      pop.appendChild(el('div', 'pin-pop-hours', info.hours));
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
  const info = placeInfo(shownId);
  const card = el('div', 'card map-detail');
  card.appendChild(el('div', 'card-kicker',
    info.cafe ? t().cafeLabel : t().buildingLabel + ' ' + info.building));
  card.appendChild(el('div', 'card-title', info.name));
  card.appendChild(el('div', 'detail-hours', info.hours));
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

function render() {
  renderStrings();
  renderTabs();
  renderCanteens();
  renderBakery();
  renderDinner();
  renderMap();
  renderLegend();
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
  [...LUNCH_IDS, 'bakern', 'dinner'].forEach(id => {
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

// ------------------------------------------------------------------ wiring

$$('[data-lang]').forEach(b => {
  b.onclick = () => { state.lang = b.dataset.lang; writeUrl(); render(); };
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
  if (!showingToday()) return;
  state.allergens = !state.allergens;
  writeUrl();
  render();
};

$$('[data-section]').forEach(b => {
  b.onclick = () => { state.section = b.dataset.section; render(); };
});

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
  loadTraffic();
  loadBanner();
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderMap, 200);
});

boot();
