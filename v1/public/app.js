/* app.js — Lunsjmeny Fornebu
   Leser public/menu.json og snakker med /api/traffic, /api/vote, /api/feedback. */

const UI = {
  no: {
    heading: 'LUNSJMENY FORNEBU',
    sub: 'Tre kantiner og et bakeri — dagens meny på ett sted.',
    showingToday: 'Viser dagens meny', oldSite: 'Bytt til gammel side', themeDark: 'Bytt til mørk modus', themeLight: 'Bytt til lys modus',
    weekendKicker: 'Helg', weekendTitle: 'Kantinene er stengt',
    weekendBody: 'Det serveres ingen lunsj i helgen. Kom tilbake på mandag — eller se menyen for en ukedag nå.',
    weekendCta: 'Se mandagens meny',
    mon: 'Mandag', tue: 'Tirsdag', wed: 'Onsdag', thu: 'Torsdag', fri: 'Fredag',
    monShort: 'Man', tueShort: 'Tir', wedShort: 'Ons', thuShort: 'Tor', friShort: 'Fre',
    todaySuffix: '(dagens)', copiedToast: 'Hele menyen er kopiert', voteTodayOnly: 'Du kan bare stemme på dagens meny.',
    lunch: 'Lunsj', dinner: 'Middag', allergyToggle: 'Allergener',
    voteLabel: '🙋 Jeg spiser her', votedLabel: '✓ Du spiser her', votesLabel: 'stemmer i dag',
    mapTitle: 'Hvor er kantinene?',
    mapSub: 'Hold musepekeren over en markør for å se menyen — eller trykk på den på mobil.',
    mapEmpty: 'Velg et sted i kartet over.',
    staticMenu: 'Fast meny hele uken', buildingLabel: 'Bygg',
    topUpCard: 'Fyll på kantinekort', issOriginal: 'Original ISS-meny',
    copyMenu: 'Kopier hele menyen', copied: 'Kopiert!',
    copyManual: 'Marker teksten og kopier (Ctrl/Cmd + C):', close: 'Lukk',
    noMenu: 'Ingen meny publisert.',
    fbButton: 'Gi tilbakemelding', fbTitle: 'Hva synes du om endringen på nettsiden?',
    fbUp: 'Bra', fbDown: 'Dårlig', fbDetail: 'Skriv detaljert tilbakemelding',
    fbPlaceholder: 'Hva fungerer bra, hva kan bli bedre?', fbSend: 'Send',
    fbThanks: 'Takk for tilbakemeldingen!', fbSending: 'Sender …',
    fbError: 'Kunne ikke sende — prøv igjen.',
    footerNote: 'Menyene hentes automatisk fra kjøkkenets egne filer, som før.'
  },
  en: {
    heading: 'LUNCH MENU FORNEBU',
    sub: 'Three canteens and a bakery — today\u2019s menu in one place.',
    showingToday: 'Showing today\u2019s menu', oldSite: 'Switch to the old site', themeDark: 'Switch to dark mode', themeLight: 'Switch to light mode',
    weekendKicker: 'Weekend', weekendTitle: 'The canteens are closed',
    weekendBody: 'No lunch is served at the weekend. Come back on Monday — or browse a weekday menu now.',
    weekendCta: 'See Monday\u2019s menu',
    mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday',
    monShort: 'Mon', tueShort: 'Tue', wedShort: 'Wed', thuShort: 'Thu', friShort: 'Fri',
    todaySuffix: '(today)', copiedToast: 'The whole menu was copied', voteTodayOnly: 'You can only vote on today\u2019s menu.',
    lunch: 'Lunch', dinner: 'Dinner', allergyToggle: 'Allergens',
    voteLabel: '🙋 Eating here', votedLabel: '✓ You\u2019re eating here', votesLabel: 'votes today',
    mapTitle: 'Where are the canteens?',
    mapSub: 'Hover a marker to see its menu — or tap it on mobile.',
    mapEmpty: 'Pick a spot on the map above.',
    staticMenu: 'Same menu all week', buildingLabel: 'Building',
    topUpCard: 'Top up canteen card', issOriginal: 'Original ISS menu',
    copyMenu: 'Copy whole menu', copied: 'Copied!',
    copyManual: 'Select the text and copy (Ctrl/Cmd + C):', close: 'Close',
    noMenu: 'No menu published.',
    fbButton: 'Give feedback', fbTitle: 'What do you think of the new site?',
    fbUp: 'Good', fbDown: 'Bad', fbDetail: 'Write detailed feedback',
    fbPlaceholder: 'What works well, what could be better?', fbSend: 'Send',
    fbThanks: 'Thanks for the feedback!', fbSending: 'Sending \u2026',
    fbError: 'Could not send — please try again.',
    footerNote: 'Menus are still pulled automatically from the kitchen\u2019s own files, same as before.'
  }
};

const FRIDAY_LINES = {
  no: ['Endelig fredag!', 'Ha en fin fredag!', 'Er det fredag? Ja. 🙌', 'God helg — men først lunsj.'],
  en: ['Finally Friday!', 'Have a great Friday!', 'Is it Friday? Yes. 🙌', 'Happy weekend — lunch first.']
};
const FRIDAY_IDX = Math.floor(Math.random() * 4);

// Kartposisjon og farge per sted. Juster left/top for å flytte markørene.
const GEO = {
  street:    { color: '#1c16c5', dark: '#6f92ff', left: '30%', top: '80%', vote: true },
  m:         { color: '#0080a6', dark: '#38c9e8', left: '74%', top: '56%', vote: true },
  fresh4you: { color: '#070452', dark: '#a08cff', left: '78%', top: '21%', vote: true },
  bakern:    { color: '#8a5a2b', dark: '#e0a066', left: '61%', top: '21%', vote: false }
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

/** Sant når vi viser dagens dato — da gjelder dagfilene. */
function showingToday() {
  const today = todayWeekKey();
  return !!today && activeDay() === today;
}

/** Rettene for et sted på valgt dag, i valgt språk. */
function dishesFor(id) {
  const data = state.data;
  if (!data || !data.places[id]) return [];

  // Dagfilene er ferskere enn ukesmenyen — bruk dem når valgt dag er i dag
  if (showingToday()) {
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
    name: p?.name || id,
    hours: p?.hours || '',
    building: p?.building || '',
    color: (isDark() ? geo.dark : geo.color) || '#1c16c5',
    left: geo.left,
    top: geo.top,
    dishes: dishesFor(id)
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
  $('#fbMessage').placeholder = t().fbPlaceholder;
  $('#datestamp').textContent = new Date().toLocaleDateString(
    state.lang === 'en' ? 'en-GB' : 'nb-NO',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );
  document.title = state.lang === 'en' ? 'Lunch Menu Fornebu' : 'Lunsjmeny Fornebu';
  syncThemeLabel();

  const brand = $('.nav-brand');
  if (brand) brand.textContent = '🍽️ ' + (state.lang === 'en' ? 'Lunch Menu Fornebu' : 'Lunsjmeny Fornebu');

  const lines = FRIDAY_LINES[state.lang];
  $('#fridayLine').textContent = lines[FRIDAY_IDX % lines.length];
  $('#fridayBanner').hidden = todayWeekKey() !== 'fri';
}

function renderTabs() {
  $$('[data-lang]').forEach(b => {
    b.className = 'btn btn-sm ' + (b.dataset.lang === state.lang ? 'btn-secondary' : 'btn-ghost');
  });
  const allergyBtn = $('#allergyToggle');
  allergyBtn.className = 'btn btn-sm icon-btn ' + (state.allergens ? 'btn-secondary' : 'btn-ghost');
  // Allergenene finnes bare i dagsfila, så knappen gjelder kun dagens meny
  allergyBtn.hidden = !showingToday();

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
  card.appendChild(el('div', 'card-kicker', t().buildingLabel + ' ' + info.building));
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
    foot.appendChild(el('span', 'vote-count', count + ' ' + t().votesLabel));

    const btn = el('button', 'btn btn-sm ' + (mine ? 'btn-secondary' : 'btn-ghost'),
      mine ? t().votedLabel : t().voteLabel);
    btn.type = 'button';
    btn.onclick = () => castVote(info.id);
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

function renderBakery() {
  const info = placeInfo('bakern');
  const card = $('#bakeryCard');
  card.textContent = '';

  const main = el('div', 'bakery-main');
  const head = el('div', 'bakery-head');
  head.appendChild(el('span', 'bakery-name', info.name));
  head.appendChild(el('span', 'sep', '–'));
  head.appendChild(el('span', null, t().buildingLabel + ' ' + info.building));
  head.appendChild(el('span', 'sep', '–'));
  head.appendChild(el('span', null, info.hours));
  main.appendChild(head);

  const dishes = el('div', 'bakery-dishes');
  if (info.dishes.length) {
    info.dishes.forEach(d => dishes.appendChild(el('span', null, d)));
  } else {
    dishes.appendChild(el('span', 'empty', t().noMenu));
  }
  main.appendChild(dishes);
  card.appendChild(main);
  card.appendChild(el('span', 'tag tag-neutral', t().staticMenu));
}

function renderDinner() {
  const info = placeInfo('dinner');
  const wrap = $('#dinnerCard');
  wrap.textContent = '';
  info.color = GEO.street.color;
  wrap.appendChild(canteenCard(info, false));
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

function renderMap() {
  const map = $('#mapInner');
  map.textContent = '';

  const img = el('img');
  img.src = '/fornebu-kart.png';
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
    pin.appendChild(el('span', null, info.name));
    if (state.myVote === id) pin.appendChild(el('span', 'pin-star', '★'));
    pin.onclick = () => {
      const narrow = window.matchMedia('(max-width: 620px)').matches;
      state.selected = !narrow && state.selected === id ? null : id;
      setHover(id);
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

    // På mobil er kartet lavt — kicker og åpningstid utgår, de står i
    // detaljkortet under kartet. Bare navn og retter får plass.
    if (!narrow) {
      pop.appendChild(el('div', 'pin-pop-kicker', t().buildingLabel + ' ' + info.building));
    }
    pop.appendChild(el('div', 'pin-pop-name', info.name));
    if (!narrow) {
      pop.appendChild(el('div', 'pin-pop-hours', info.hours));
    }
    const dishes = el('div', 'pin-pop-dishes');
    if (info.dishes.length) {
      info.dishes.forEach(d => dishes.appendChild(el('div', null, d)));
    } else {
      dishes.appendChild(el('div', 'empty', t().noMenu));
    }
    pop.appendChild(dishes);
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
  card.appendChild(el('div', 'card-kicker', t().buildingLabel + ' ' + info.building));
  card.appendChild(el('div', 'card-title', info.name));
  card.appendChild(el('div', 'detail-hours', info.hours));
  const dishes = el('div', 'detail-dishes');
  info.dishes.forEach(d => dishes.appendChild(el('div', null, d)));
  card.appendChild(dishes);
  if (GEO[shownId]?.vote) {
    card.appendChild(el('div', 'card-meta',
      (state.votes[shownId] || 0) + ' ' + t().votesLabel));
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
}

// ------------------------------------------------------------------ voting

async function loadTraffic() {
  try {
    const r = await fetch('/api/traffic');
    if (!r.ok) return;
    const d = await r.json();
    state.votes = d.votes || {};
    state.myVote = d.myVote || null;
    renderCanteens();
    renderMap();
  } catch { /* trafikk er ikke kritisk */ }
}

async function castVote(id) {
  try {
    const r = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place: id })
    });
    if (!r.ok) return;
    const d = await r.json();
    state.votes = d.votes || {};
    state.myVote = d.myVote || null;
    renderCanteens();
    renderMap();
  } catch { /* stille */ }
}

// ------------------------------------------------------------------ copy

function menuAsText() {
  const lines = [t().heading + ' — ' + $('#datestamp').textContent, ''];
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

function flashCopied() {
  const toast = $('#toast');
  toast.textContent = t().copiedToast;
  toast.hidden = false;
  // to frames så overgangen faktisk kjører
  requestAnimationFrame(() => toast.classList.add('on'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('on');
    setTimeout(() => { toast.hidden = true; }, 250);
  }, 2400);
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
    $('#fbVotes').hidden = true;
    $('#fbText').hidden = true;
    $('#fbDetail').hidden = true;
    $('#fbMessage').value = '';
  } catch {
    status.textContent = t().fbError;
  }
}

function resetFeedback() {
  $('#fbVotes').hidden = false;
  $('#fbText').hidden = true;
  $('#fbDetail').hidden = false;
  $('#fbStatus').textContent = '';
}

// ------------------------------------------------------------------ wiring

$$('[data-lang]').forEach(b => {
  b.onclick = () => { state.lang = b.dataset.lang; writeUrl(); render(); };
});

$('#allergyToggle').onclick = () => {
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
$$('[data-fb]').forEach(b => { b.onclick = () => sendFeedback(b.dataset.fb); });
$('#fbSend').onclick = () => {
  const msg = $('#fbMessage').value.trim();
  if (msg) sendFeedback('text', msg);
};

// ------------------------------------------------------------------ boot

async function boot() {
  readUrl();
  writeUrl();
  renderStrings();
  try {
    const r = await fetch('/menu.json?v=' + Date.now());
    state.data = await r.json();
  } catch (e) {
    console.error('Kunne ikke laste menu.json', e);
  }
  render();
  loadTraffic();
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderMap, 200);
});

boot();
