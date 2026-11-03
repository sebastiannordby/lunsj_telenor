// admin.js - /admin: manuell menyoppdatering og midlertidig banner.

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const loginCard = $('#loginCard');
const adminBody = $('#adminBody');

function todayIso() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });
}

async function api(path, opts = {}) {
  const r = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || `Feil ${r.status}`), { data });
  return data;
}

function showLoggedIn(yes) {
  loginCard.hidden = yes;
  adminBody.hidden = !yes;
  $('#logoutBtn').hidden = !yes;
  if (yes) { loadBanner(); loadStatus(); loadVotes(); loadOverrides(); loadHealth(); loadTip(); loadRuns(); loadRaw(); loadTheme(); loadStats(); }
}

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

function when(iso) {
  if (!iso) return 'aldri';
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d) / 60000);
  const stamp = d.toLocaleString('no-NO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  if (mins < 1) return 'nå nettopp';
  if (mins < 60) return `for ${mins} min siden (${stamp})`;
  if (mins < 1440) return `for ${Math.round(mins / 60)} t siden (${stamp})`;
  return stamp;
}

// ------------------------------------------------------------------ login

$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  const err = $('#loginError');
  err.hidden = true;
  try {
    await api('api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: $('#pw').value })
    });
    $('#pw').value = '';
    showLoggedIn(true);
  } catch (e) {
    err.textContent = e.message;
    err.hidden = false;
  }
};

$('#logoutBtn').onclick = async () => {
  await api('api/admin/logout', { method: 'POST' }).catch(() => {});
  showLoggedIn(false);
};

// ------------------------------------------------------------------ menyer

$('#previewBtn').onclick = async () => {
  const btn = $('#previewBtn');
  const status = $('#refreshStatus');
  const log = $('#refreshLog');
  btn.disabled = true;
  status.hidden = false;
  status.className = 'admin-status';
  status.textContent = 'Kjører skraping og bygger forhåndsvisning …';
  try {
    const res = await api('api/admin/preview', { method: 'POST' });
    const list = $('#previewList');
    list.textContent = '';
    res.diff.forEach(p => {
      const row = el('div', 'admin-ov' + (p.changed ? ' changed' : ''));
      const head = el('div', 'admin-ov-head');
      head.appendChild(el('strong', null, p.name));
      head.appendChild(el('span', 'admin-current-until', p.changed ? 'endret' : 'uendret'));
      row.appendChild(head);
      const ul = el('ul', 'admin-ov-items');
      if (p.items.length) p.items.forEach(i => ul.appendChild(el('li', null, i)));
      else ul.appendChild(el('li', 'empty', 'ingen retter'));
      row.appendChild(ul);
      list.appendChild(row);
    });
    $('#previewBox').hidden = false;
    status.className = 'admin-status ok';
    status.textContent = 'Forhåndsvisning klar - ingenting er publisert enda.';
    log.textContent = res.log || '';
    log.hidden = !res.log;
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = 'Forhåndsvisning feilet: ' + e.message;
    log.textContent = e.data?.log || '';
    log.hidden = !log.textContent;
  } finally {
    btn.disabled = false;
  }
};

$('#publishBtn').onclick = async () => {
  const status = $('#refreshStatus');
  try {
    await api('api/admin/publish', { method: 'POST' });
    $('#previewBox').hidden = true;
    status.hidden = false;
    status.className = 'admin-status ok';
    status.textContent = 'Publisert - forsiden viser den nye menyen.';
    loadStatus();
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = e.message;
  }
};

$('#previewCancel').onclick = () => { $('#previewBox').hidden = true; };

$('#refreshBtn').onclick = async () => {
  const btn = $('#refreshBtn');
  const status = $('#refreshStatus');
  const log = $('#refreshLog');
  btn.disabled = true;
  status.hidden = false;
  status.className = 'admin-status';
  status.textContent = 'Kjører … dette tar normalt 10–30 sekunder.';
  log.hidden = true;

  try {
    const res = await api('api/admin/refresh', { method: 'POST' });
    status.className = 'admin-status ok';
    status.textContent = 'Menyene er oppdatert.';
    loadStatus();
    log.textContent = res.log || '';
    log.hidden = !res.log;
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = 'Oppdateringen feilet: ' + e.message;
    log.textContent = e.data?.log || '';
    log.hidden = !log.textContent;
  } finally {
    btn.disabled = false;
  }
};

// ------------------------------------------------------------------ status

const SOURCE_LABEL = {
  manual: ['Skrevet manuelt', 'warn'],
  daily: ['Dagens meny hentet', 'ok'],
  weekly: ['Kun ukesmeny', 'warn'],
  // Middagen har bare ukesmeny - da er det riktig kilde, ikke et varsel
  weeklySource: ['Ukesmeny', 'ok'],
  none: ['Ingen meny', 'bad']
};

function shortStamp(iso) {
  return iso ? new Date(iso).toLocaleString('no-NO', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
}

async function loadStatus() {
  const grid = $('#statusGrid');
  const meta = $('#statusMeta');
  try {
    const s = await api('api/admin/status');
    grid.textContent = '';
    s.places.forEach(p => {
      const key = p.source === 'weekly' && (p.weeklySource || s.weekend) ? 'weeklySource' : p.source;
      let [label, tone] = SOURCE_LABEL[key] || SOURCE_LABEL.none;
      if (p.source === 'weekly' && p.updated) label += ' · fil ' + shortStamp(p.updated);
      const row = el('div', 'status-row');
      row.appendChild(el('span', 'status-dot ' + tone));
      row.appendChild(el('span', 'status-name', p.name));
      row.appendChild(el('span', 'status-src', label));
      row.appendChild(el('span', 'status-count', p.count ? p.count + ' retter' : '-'));
      grid.appendChild(row);
    });

    const bits = ['menu.json bygget ' + when(s.generated)];
    if (s.weekend) bits.unshift('Helg - viser mandagens ukesmeny');
    if (s.pushSubs != null) bits.push(s.pushSubs + ' har pushvarsel');
    if (s.files.dayFile) bits.push('dagsfil skrevet ' + when(s.files.dayFile) + (s.dailyFresh || s.weekend ? '' : ' (ikke fra i dag - brukes ikke)'));
    if (s.lastRun) {
      bits.push(s.lastRun.ok
        ? 'siste kjøring fra admin gikk bra ' + when(s.lastRun.at)
        : 'SISTE KJØRING FEILET ' + when(s.lastRun.at) + ' - ' + s.lastRun.error);
    }
    meta.textContent = bits.join(' · ');
    meta.className = 'admin-status' + (s.lastRun && !s.lastRun.ok ? ' bad' : '');
    meta.hidden = false;
  } catch (e) {
    meta.textContent = 'Kunne ikke hente status: ' + e.message;
    meta.className = 'admin-status bad';
    meta.hidden = false;
  }
}

// ------------------------------------------------------------------ driftsvarsler

async function loadHealth() {
  const list = $('#healthList');
  try {
    const h = await api('api/admin/health');
    $('#healthTopic').textContent = h.topic;
    list.textContent = '';
    if (!h.problems.length) {
      const row = el('div', 'status-row');
      row.appendChild(el('span', 'status-dot ok'));
      row.appendChild(el('span', 'status-src', 'Ingen problemer akkurat nå'));
      list.appendChild(row);
      return;
    }
    h.problems.forEach(p => {
      const row = el('div', 'status-row');
      row.appendChild(el('span', 'status-dot bad'));
      row.appendChild(el('span', null, p.text));
      list.appendChild(row);
    });
  } catch (e) {
    list.textContent = 'Kunne ikke sjekke: ' + e.message;
  }
}

$('#healthTest').onclick = async () => {
  const s = $('#healthStatus');
  s.hidden = false;
  s.className = 'admin-status';
  s.textContent = 'Sender …';
  try {
    const r = await api('api/admin/health/test', { method: 'POST' });
    s.className = 'admin-status ok';
    s.textContent = 'Sendt til ' + r.topic + ' - sjekk ntfy-appen.';
  } catch (e) {
    s.className = 'admin-status bad';
    s.textContent = e.message;
  }
};

// ------------------------------------------------------------------ push-sjekk

$('#pushCheck').onclick = async () => {
  const box = $('#pushCheckList');
  const btn = $('#pushCheck');
  btn.disabled = true;
  box.textContent = '';
  box.appendChild(el('p', 'admin-status', 'Sjekker … (opptil 8 sekunder)'));
  try {
    const r = await api('api/admin/push/check');
    box.textContent = '';
    if (!r.pushReady) {
      box.appendChild(el('p', 'admin-status bad', 'Push er ikke skrudd på - web-push er ikke installert der serveren kjører.'));
      return;
    }
    box.appendChild(el('p', 'admin-status', r.subs + ' abonnement totalt.'));
    r.checks.forEach(c => {
      const row = el('div', 'status-row');
      row.appendChild(el('span', 'status-dot ' + (c.ok ? 'ok' : 'bad')));
      row.appendChild(el('span', 'status-name', c.host));
      row.appendChild(el('span', 'status-src', c.ok
        ? `nås (HTTP ${c.status}, ${c.ms} ms)`
        : `nås IKKE: ${c.error}`));
      const extra = [];
      if (c.subs) extra.push(c.subs + ' abonnent' + (c.subs === 1 ? '' : 'er'));
      if (c.last) extra.push('siste sending: ' + (c.last.ok ? 'OK ' + c.last.status : 'FEIL ' + c.last.detail));
      row.appendChild(el('span', 'status-count', extra.join(' · ')));
      box.appendChild(row);
    });
  } catch (e) {
    box.textContent = 'Sjekken feilet: ' + e.message;
  } finally {
    btn.disabled = false;
  }
};

// ------------------------------------------------------------------ stemmer

function voteMsg(text, bad) {
  const s = $('#voteStatus');
  s.textContent = text;
  s.className = 'admin-status' + (bad ? ' bad' : '');
  s.hidden = !text;
}

async function loadVotes() {
  const list = $('#voteList');
  try {
    const v = await api('api/admin/votes');
    list.textContent = '';
    const total = v.places.reduce((n, p) => n + p.count, 0);
    v.places.forEach(p => {
      const row = el('div', 'vote-row');
      row.appendChild(el('span', 'vote-name', p.label));
      row.appendChild(el('span', 'vote-count' + (p.count > 300 ? ' bad' : ''), String(p.count)));
      const btn = el('button', 'btn btn-ghost btn-xs', 'Nullstill');
      btn.type = 'button';
      btn.onclick = () => resetVotes(p.id, p.label);
      row.appendChild(btn);
      list.appendChild(row);
    });

    renderVoteClients(v.clients);

    const bits = [`${total} stemmer i dag (${v.date})`];
    bits.push(`${v.lastMinute} siste minutt`);
    bits.push(`maks ${v.limit} per maskin per dag`);
    if (!v.originLocked) bits.push('ADVARSEL: ALLOWED_ORIGIN er ikke satt');
    voteMsg(bits.join(' · '), !v.originLocked || v.lastMinute > 25);
  } catch (e) {
    voteMsg('Kunne ikke hente stemmer: ' + e.message, true);
  }
}

function renderVoteClients(clients) {
  const box = $('#voteClients');
  box.textContent = '';
  if (!clients || !clients.length) {
    box.appendChild(el('p', 'admin-status', 'Ingen stemmer logget i dag.'));
    return;
  }
  clients.forEach(c => {
    const row = el('div', 'vote-row');
    row.appendChild(el('span', 'vote-key', c.who));

    const detail = [];
    if (c.rate >= 3) detail.push(`${c.rate}/min`);
    if (c.undos) detail.push(`${c.undos} angret`);
    if (c.blocked) detail.push('SPERRET');
    row.appendChild(el('span', 'vote-detail', detail.join(' · ')));

    const suspicious = c.votes > 10 || c.rate >= 3;
    row.appendChild(el('span', 'vote-count' + (suspicious ? ' bad' : ''), String(c.votes)));

    const btn = el('button', 'btn btn-ghost btn-xs', c.blocked ? 'Opphev' : 'Sperr');
    btn.type = 'button';
    btn.onclick = () => (c.blocked ? unblockClient(c.who) : blockClient(c.who, c.votes));
    row.appendChild(btn);
    box.appendChild(row);
  });
}

async function blockClient(who, votes) {
  if (!confirm(`Sperre maskin ${who} og fjerne ${votes} stemmer?`)) return;
  voteMsg('Sperrer ...');
  try {
    const r = await api('api/admin/votes/block', {
      method: 'POST',
      body: JSON.stringify({ who })
    });
    await loadVotes();
    voteMsg(`Sperret ${who} og fjernet ${r.removed} stemmer.`);
  } catch (e) {
    voteMsg('Klarte ikke sperre: ' + e.message, true);
  }
}

async function unblockClient(who) {
  try {
    await api('api/admin/votes/block?who=' + encodeURIComponent(who), { method: 'DELETE' });
    await loadVotes();
    voteMsg(`Sperren for ${who} er opphevet.`);
  } catch (e) {
    voteMsg('Klarte ikke oppheve: ' + e.message, true);
  }
}

async function resetVotes(place, label) {
  const what = place ? `stemmene for ${label}` : 'alle stemmene';
  if (!confirm(`Nullstille ${what}?`)) return;
  voteMsg('Nullstiller ...');
  try {
    await api('api/admin/votes' + (place ? '?place=' + encodeURIComponent(place) : ''), { method: 'DELETE' });
    await loadVotes();
    voteMsg(`Nullstilt ${what}.`);
  } catch (e) {
    voteMsg('Klarte ikke nullstille: ' + e.message, true);
  }
}

$('#voteReload').onclick = loadVotes;
$('#voteResetAll').onclick = () => resetVotes('', '');

// ------------------------------------------------------------------ nødmodus

const PLACE_NAMES = {
  m: 'Kantine M', fresh4you: 'Fresh 4 You',
  bakern: 'Bakern', dinner: 'Fresh 4 You – Middag'
};

function renderOverrides(all) {
  const box = $('#ovActive');
  const list = $('#ovList');
  const ids = Object.keys(all || {});
  box.hidden = !ids.length;
  list.textContent = '';
  ids.forEach(id => {
    const row = el('div', 'admin-ov');
    const head = el('div', 'admin-ov-head');
    head.appendChild(el('strong', null, PLACE_NAMES[id] || id));
    head.appendChild(el('span', 'admin-current-until', 'satt ' + when(all[id].set)));
    const rm = el('button', 'btn btn-ghost btn-xs', 'Fjern');
    rm.type = 'button';
    rm.onclick = async () => {
      const r = await api('api/admin/override?place=' + encodeURIComponent(id), { method: 'DELETE' });
      renderOverrides(r.overrides);
      loadStatus();
    };
    head.appendChild(rm);
    row.appendChild(head);
    const ul = el('ul', 'admin-ov-items');
    all[id].items.forEach(i => ul.appendChild(el('li', null, i)));
    row.appendChild(ul);
    list.appendChild(row);
  });
}

async function loadOverrides() {
  const { overrides } = await api('api/admin/overrides').catch(() => ({ overrides: {} }));
  renderOverrides(overrides);
  fillOverrideBox(overrides);
}

function fillOverrideBox(all) {
  const cur = all?.[$('#ovPlace').value];
  $('#ovText').value = cur ? cur.items.join('\n') : '';
}

$('#ovPlace').onchange = () => loadOverrides();

$('#ovSave').onclick = async () => {
  const status = $('#ovStatus');
  status.hidden = false;
  status.className = 'admin-status';
  status.textContent = 'Lagrer …';
  try {
    const r = await api('api/admin/override', {
      method: 'POST',
      body: JSON.stringify({ place: $('#ovPlace').value, text: $('#ovText').value })
    });
    status.className = 'admin-status ok';
    status.textContent = 'Lagret - ligger ute på forsiden nå.';
    renderOverrides(r.overrides);
    loadStatus();
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = e.message;
  }
};

// ------------------------------------------------------------------ banner

const BANNER_STATUS = {
  active: ['Vises nå', 'tag tag-accent'],
  planned: ['Planlagt', 'tag tag-neutral'],
  expired: ['Utløpt', 'tag tag-outline']
};

function niceDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('no-NO', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Neste forekomst (i år eller neste år) av en dato på formen MM-DD. */
function nextDate(md) {
  const today = todayIso();
  const y = Number(today.slice(0, 4));
  return `${y}-${md}` >= today ? `${y}-${md}` : `${y + 1}-${md}`;
}

let bannerCache = [];

async function loadBanner() {
  const list = $('#bannerList');
  const { banners } = await api('api/admin/banners').catch(() => ({ banners: [] }));
  bannerCache = banners;
  list.textContent = '';
  if (!banners.length) {
    list.appendChild(el('p', 'admin-status', 'Ingen bannere er aktive eller planlagt.'));
  }
  banners.forEach(b => {
    const row = el('div', 'admin-ov');
    const head = el('div', 'admin-ov-head');
    const [label, cls] = BANNER_STATUS[b.status] || BANNER_STATUS.active;
    head.appendChild(el('span', cls, label));
    head.appendChild(el('span', 'admin-current-until',
      b.from === b.until ? niceDate(b.from) : niceDate(b.from) + ' – ' + niceDate(b.until)));
    const edit = el('button', 'btn btn-ghost btn-xs', 'Rediger');
    edit.type = 'button';
    edit.style.marginLeft = 'auto';
    edit.onclick = () => fillBannerForm(b);
    const rm = el('button', 'btn btn-ghost btn-xs', 'Fjern');
    rm.type = 'button';
    rm.style.marginLeft = '0';
    rm.onclick = async () => {
      if (!confirm('Fjerne banneret?')) return;
      await api('api/admin/banner?id=' + encodeURIComponent(b.id), { method: 'DELETE' }).catch(() => {});
      loadBanner();
    };
    head.appendChild(edit);
    head.appendChild(rm);
    row.appendChild(head);
    const preview = el('div', 'site-banner tone-' + b.tone);
    preview.style.margin = '8px 0 0';
    preview.appendChild(el('span', 'site-banner-emoji', b.emoji || ''));
    preview.appendChild(el('span', null, b.text));
    row.appendChild(preview);
    list.appendChild(row);
  });
  if (!$('#bFrom').value) $('#bFrom').value = todayIso();
  if (!$('#bUntil').value) $('#bUntil').value = todayIso();
}

function fillBannerForm(b) {
  $('#bId').value = b.id || '';
  $('#bText').value = b.text || '';
  $('#bTextEn').value = b.textEn || '';
  $('#bEmoji').value = b.emoji || '';
  $('#bFrom').value = b.from || todayIso();
  $('#bUntil').value = b.until || b.from || todayIso();
  $('#bDismiss').checked = b.dismissible !== false;
  const tone = document.querySelector(`input[name="tone"][value="${b.tone || 'info'}"]`);
  if (tone) tone.checked = true;
  const editing = !!b.id;
  $('#bannerFormTitle').textContent = editing ? 'Endre banner' : 'Nytt banner';
  $('#bannerCancel').hidden = !editing;
  $('#bannerForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Utgangspunkt for vanlige bannere - juster tekst og datoer før lagring
const BANNER_PRESETS = {
  jul: () => ({
    emoji: '🎄', tone: 'good', from: nextDate('12-01'), until: nextDate('12-23'),
    text: 'God jul fra lunsjmenyen! Følg med her for endrede åpningstider i romjula.',
    textEn: 'Merry Christmas from the lunch menu! Watch this space for changed opening hours over the holidays.'
  }),
  romjul: () => ({
    emoji: '⭐', tone: 'warn', from: nextDate('12-22'), until: nextDate('12-31'),
    text: 'Romjul: redusert åpningstid i kantinene. Sjekk menyen før du går.',
    textEn: 'Between Christmas and New Year the canteens have reduced opening hours. Check the menu before you go.'
  }),
  paske: () => ({
    emoji: '🐣', tone: 'good', from: todayIso(), until: todayIso(),
    text: 'God påske! Kantinene har redusert åpningstid i påskeuka.',
    textEn: 'Happy Easter! The canteens have reduced opening hours during Easter week.'
  }),
  stengt: () => ({
    emoji: '🔒', tone: 'warn', from: todayIso(), until: todayIso(),
    text: 'Kantina er stengt i dag.',
    textEn: 'The canteen is closed today.'
  })
};

$$('[data-preset]').forEach(b => {
  b.onclick = () => fillBannerForm({ ...BANNER_PRESETS[b.dataset.preset](), dismissible: true });
});

$('#bannerCancel').onclick = () => {
  $('#bannerForm').reset();
  fillBannerForm({ from: todayIso(), until: todayIso(), emoji: '✅', dismissible: true });
};

$('#bannerForm').onsubmit = async e => {
  e.preventDefault();
  const status = $('#bannerStatus');
  status.hidden = false;
  status.className = 'admin-status';
  status.textContent = 'Lagrer …';
  try {
    const r = await api('api/admin/banner', {
      method: 'POST',
      body: JSON.stringify({
        id: $('#bId').value || undefined,
        from: $('#bFrom').value || todayIso(),
        text: $('#bText').value,
        textEn: $('#bTextEn').value,
        emoji: $('#bEmoji').value,
        tone: document.querySelector('input[name="tone"]:checked')?.value,
        until: $('#bUntil').value || todayIso(),
        dismissible: $('#bDismiss').checked
      })
    });
    status.className = 'admin-status ok';
    status.textContent = r.status === 'planned'
      ? 'Banneret er planlagt fra ' + niceDate(r.banner.from).replace(/\.$/, '') + '.'
      : 'Banneret vises på forsiden nå.';
    $('#bannerForm').reset();
    fillBannerForm({ from: todayIso(), until: todayIso(), emoji: '✅', dismissible: true });
    loadBanner();
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = e.message;
  }
};

// ------------------------------------------------------------------ kjøringer

function ago(iso) {
  if (!iso) return 'aldri';
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'nå nettopp';
  if (mins < 60) return mins + ' min siden';
  if (mins < 48 * 60) return Math.round(mins / 60) + ' t siden';
  return Math.round(mins / 1440) + ' dager siden';
}

function clockTime(iso) {
  return new Date(iso).toLocaleString('no-NO', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function loadRuns() {
  const box = $('#runList');
  try {
    const r = await api('api/admin/runs');
    box.textContent = '';
    if (r.logMissing) {
      box.appendChild(el('p', 'admin-status',
        'Ingen kjøringer logget ennå. Loggen fylles når skriptene kjører neste gang (runs.json).'));
    }
    r.scripts.forEach(s => {
      const row = el('div', 'admin-ov');
      const head = el('div', 'status-row');
      head.style.borderBottom = '0';
      head.style.padding = '0';
      const tone = !s.last ? 'warn' : !s.last.ok ? 'bad' : s.stale ? 'warn' : 'ok';
      head.appendChild(el('span', 'status-dot ' + tone));
      head.appendChild(el('span', 'status-name', s.label));
      head.appendChild(el('code', 'admin-code', s.script));
      head.appendChild(el('span', 'status-count', s.last
        ? ago(s.last.at) + (s.last.trigger === 'admin' ? ' (admin)' : '')
        : 'aldri'));
      row.appendChild(head);

      if (s.last) {
        const detail = (s.last.ok ? '' : 'FEILET: ') + (s.last.summary || (s.last.ok ? 'OK' : ''));
        const p = el('div', 'admin-current-until', detail.split('\n').pop());
        p.style.marginTop = '4px';
        row.appendChild(p);
        if (!s.last.ok && s.lastOk) {
          row.appendChild(el('div', 'admin-current-until', 'Sist OK: ' + clockTime(s.lastOk.at)));
        }
      }
      if (!s.last) {
        row.appendChild(el('div', 'admin-current-until', 'Ikke logget ennå - vises etter neste kjøring.'));
      }
      if (s.stale) {
        row.appendChild(el('div', 'admin-status warn',
          'Har ikke kjørt på over ' + (s.maxAgeH >= 48 ? Math.round(s.maxAgeH / 24) + ' dager' : s.maxAgeH + ' t') + ' - sjekk crontab.'));
      }
      if (s.runs.length > 1) {
        const det = el('details');
        det.appendChild(el('summary', 'admin-current-until', 'Siste ' + s.runs.length + ' kjøringer'));
        const ul = el('ul', 'admin-ov-items');
        s.runs.forEach(run => ul.appendChild(el('li', null,
          (run.ok ? '✓ ' : '✗ ') + clockTime(run.at) + (run.trigger === 'admin' ? ' (admin)' : '') +
          ' - ' + (run.summary || 'OK').split('\n').pop())));
        det.appendChild(ul);
        row.appendChild(det);
      }
      box.appendChild(row);
    });
  } catch (e) {
    box.textContent = 'Kunne ikke hente kjøreloggen: ' + e.message;
  }
}

$('#runReload').onclick = loadRuns;

// ------------------------------------------------------------------ rå HTML

function kb(n) {
  return n < 1024 ? n + ' B' : Math.round(n / 1024) + ' kB';
}

async function loadRaw() {
  const box = $('#rawList');
  const { files } = await api('api/admin/raw').catch(() => ({ files: [] }));
  box.textContent = '';
  if (!files.length) {
    box.appendChild(el('p', 'admin-status', 'Ingen filer i raw_html/ ennå.'));
    return;
  }
  files.forEach(f => {
    const row = el('div', 'admin-ov');
    const head = el('div', 'admin-ov-head');
    head.appendChild(el('strong', null, f.name.replace(/\.html$/, '')));
    head.appendChild(el('span', 'admin-current-until',
      (f.size ? kb(f.size) : 'tom - hentingen feilet') + ' · ' + ago(f.updated)));

    const text = el('button', 'btn btn-ghost btn-xs', 'Tekst');
    text.type = 'button';
    text.style.marginLeft = 'auto';
    text.onclick = async () => {
      const pre = $('#rawText');
      pre.hidden = false;
      pre.textContent = 'Leser ' + f.name + ' …';
      try {
        const r = await api('api/admin/raw/text?name=' + encodeURIComponent(f.name));
        pre.textContent = f.name + '\n\n' + r.text;
      } catch (e) {
        pre.textContent = 'Feil: ' + e.message;
      }
      pre.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const src = el('a', 'btn btn-ghost btn-xs', 'Kilde');
    src.href = 'api/admin/raw/file?name=' + encodeURIComponent(f.name);
    src.target = '_blank';
    src.rel = 'noopener';
    src.style.marginLeft = '0';
    src.style.textDecoration = 'none';
    head.appendChild(text);
    head.appendChild(src);
    row.appendChild(head);
    box.appendChild(row);
  });
}

// ------------------------------------------------------------------ dagens tips

async function loadTip() {
  try {
    const t = await api('api/admin/tip');
    $('#tipText').value = t.text || '';
    $('#tipTextEn').value = t.textEn || '';
    $('#tipEnabled').checked = t.enabled !== false;
  } catch (e) {}
}

$('#tipSave').onclick = async () => {
  const status = $('#tipStatus');
  status.hidden = false;
  status.className = 'admin-status';
  status.textContent = 'Lagrer …';
  try {
    const r = await api('api/admin/tip', {
      method: 'POST',
      body: JSON.stringify({
        text: $('#tipText').value,
        textEn: $('#tipTextEn').value,
        enabled: $('#tipEnabled').checked
      })
    });
    status.className = 'admin-status ok';
    status.textContent = r.tip.enabled
      ? 'Lagret - vises på forsiden fram til kl. 12 og i morgenposten.'
      : 'Lagret - tipset er skrudd av.';
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = e.message;
  }
};

// ------------------------------------------------------------------ tema

async function loadTheme() {
  const seg = $('#themeSeg');
  const status = $('#themeStatus');
  try {
    const t = await api('api/admin/theme');
    seg.textContent = '';
    const opts = [['auto', 'Automatisk'], ...Object.entries(t.seasons), ['off', 'Av']];
    opts.forEach(([value, label]) => {
      const opt = el('label', 'seg-opt');
      const input = el('input');
      input.type = 'radio';
      input.name = 'themeMode';
      input.value = value;
      input.checked = t.mode === value;
      input.onchange = () => saveTheme(value);
      opt.appendChild(input);
      opt.appendChild(el('span', null, label));
      seg.appendChild(opt);
    });
    status.className = 'admin-status';
    status.textContent = t.mode === 'auto'
      ? (t.autoLabel ? 'Automatisk: ' + t.autoLabel + ' nå.' : 'Automatisk: ingen sesong akkurat nå.')
      : t.mode === 'off' ? 'Ingen pynt vises.' : 'Låst til ' + t.seasons[t.mode] + ' uansett dato.';
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = 'Kunne ikke hente tema: ' + e.message;
  }
}

async function saveTheme(mode) {
  const status = $('#themeStatus');
  try {
    await api('api/admin/theme', { method: 'POST', body: JSON.stringify({ mode }) });
    await loadTheme();
    status.className = 'admin-status ok';
    status.textContent += ' Lagret - gjelder neste gang forsiden lastes.';
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = e.message;
  }
}

// ------------------------------------------------------------ statistikk

const STAT_LABELS = {
  dag: 'Bytter ukedag', sprak: 'Bytter språk', allergener: 'Viser allergener',
  se_menyen: '«Se menyen» (øyet)', middagsfane: 'Middagsfanen', kart: 'Trykk på kartet',
  hjul: 'Lykkehjulet', kopier: 'Kopierer menyen', push_pa: 'Slår på/lagrer push',
  push_av: 'Slår av push', tilbakemelding: 'Tilbakemelding', installer: 'Installer-knappen',
  sesong_av: 'Skrur av sesongpynt', sesong_pa: 'Skrur på sesongpynt', mork_modus: 'Mørk modus',
  stem: 'Stemmer'
};
const BOT_LABELS = {
  lunsj: 'lunsj', middag: 'middag', bakern: 'bakern', meny: 'meny', allergi: 'allergi',
  imorgen: 'i morgen', ukedag: 'mandag, tirsdag …', kantine: 'kantine m / fresh 4 you',
  gjovik: 'gjøvik', kaffe: 'kaffe', hjelp: 'hjelp', paaminnelse: 'påminnelse-kommandoer',
  knapp: 'knappetrykk', paaminnelse_sendt: 'påminnelser sendt', morgenpost: 'morgenposter',
  annet: 'annet'
};
const PLACE_LABELS = { m: 'Kantine M', fresh4you: 'Fresh 4 You', bakern: 'Bakern', dinner: 'Middag' };
const DAY_LABELS = { mon: 'man', tue: 'tir', wed: 'ons', thu: 'tor', fri: 'fre' };

function sumMaps(days, key) {
  const out = {};
  days.forEach(d => Object.entries(d[key] || {}).forEach(([k, v]) => { out[k] = (out[k] || 0) + v; }));
  return out;
}

function statRows(box, entries, labels = {}, sort = true) {
  box.textContent = '';
  const list = entries.filter(([, v]) => v > 0);
  if (sort) list.sort((a, b) => b[1] - a[1]);
  if (!list.length) { box.appendChild(el('div', 'vote-row vote-detail', 'Ingen data ennå')); return; }
  list.forEach(([k, v]) => {
    const row = el('div', 'vote-row');
    row.appendChild(el('span', 'vote-name', labels[k] || k));
    row.appendChild(el('span', 'vote-count', String(v)));
    box.appendChild(row);
  });
}

function statBars(box, items, { tall = false } = {}) {
  box.textContent = '';
  const max = Math.max(1, ...items.map(i => i.value));
  items.forEach(i => {
    const col = el('div', 'stats-bar');
    col.title = i.title;
    const bar = el('span', 'stats-bar-fill');
    bar.style.height = Math.round((i.value / max) * 100) + '%';
    if (i.value && i.value / max < 0.03) bar.style.height = '3%';
    if (i.sub != null) {
      const sub = el('span', 'stats-bar-sub');
      sub.style.height = Math.round((i.sub / max) * 100) + '%';
      col.appendChild(sub);
    }
    col.appendChild(bar);
    col.appendChild(el('span', 'stats-bar-label', i.label || ''));
    box.appendChild(col);
  });
}

async function loadStats() {
  const days = Number(($('input[name="statsDays"]:checked') || {}).value || 30);
  const status = $('#statsStatus');
  try {
    const data = await api('api/admin/stats?days=' + days);
    const list = data.days;
    const views = list.reduce((a, d) => a + d.views, 0);
    const uniques = list.reduce((a, d) => a + d.uniques, 0);
    // Snittet regnes bare over hverdager med data, så dager før statistikken startet ikke drar det ned.
    const weekdays = list.filter(d => { const w = new Date(d.date + 'T12:00').getDay(); return w > 0 && w < 6 && d.views > 0; });
    const avg = weekdays.length ? Math.round(weekdays.reduce((a, d) => a + d.uniques, 0) / weekdays.length) : 0;
    const today = list[list.length - 1];
    const botTotal = list.reduce((a, d) => a + Object.values(d.bot || {}).reduce((x, y) => x + y, 0), 0);

    const kpis = $('#statsKpis');
    kpis.textContent = '';
    [['I dag', today.uniques, today.views + ' visninger'],
     ['Snitt per hverdag', avg, 'unike'],
     ['Unike, sum per dag', uniques, views + ' visninger'],
     ['Webex-bot', botTotal, 'hendelser']].forEach(([label, value, sub]) => {
      const k = el('div', 'stats-kpi');
      k.appendChild(el('span', 'stats-kpi-label', label));
      k.appendChild(el('span', 'stats-kpi-value', String(value)));
      k.appendChild(el('span', 'stats-kpi-sub', sub));
      kpis.appendChild(k);
    });

    const every = Math.ceil(list.length / 10);
    statBars($('#statsDaily'), list.map((d, i) => ({
      value: d.views, sub: d.uniques,
      label: (i % every === 0 || i === list.length - 1) ? d.date.slice(8) + '.' + d.date.slice(5, 7) : '',
      title: `${d.date}: ${d.uniques} unike, ${d.views} visninger`
    })));

    const hours = sumMaps(list, 'hours');
    const hourItems = [];
    const used = Object.keys(hours).filter(h => hours[h] > 0).map(Number);
    const h0 = Math.min(6, ...used), h1 = Math.max(20, ...used);
    for (let h = h0; h <= h1; h++) hourItems.push({ value: hours[h] || 0, label: h % 2 === 0 ? String(h) : '', title: `kl. ${h}: ${hours[h] || 0} visninger` });
    statBars($('#statsHours'), hourItems);

    const events = sumMaps(list, 'events');
    statRows($('#statsEvents'), Object.entries(events), STAT_LABELS);
    statRows($('#statsBot'), Object.entries(sumMaps(list, 'bot')), BOT_LABELS);
    statRows($('#statsVotes'), Object.entries(sumMaps(list, 'votes')), PLACE_LABELS);

    const lang = sumMaps(list, 'lang');
    const dev = sumMaps(list, 'devices');
    const vd = sumMaps(list, 'viewDay');
    const places = sumMaps(list, 'places');
    const eye = Object.entries(places).filter(([k]) => k.startsWith('se_menyen:'))
      .map(([k, v]) => ['Se menyen: ' + (PLACE_LABELS[k.split(':')[1]] || k), v]);
    const appViews = list.reduce((a, d) => a + (d.app || 0), 0);
    statRows($('#statsSplit'), [
      ['Norsk', lang.no || 0], ['Engelsk', lang.en || 0],
      ['Mobil', dev.mobil || 0], ['PC', dev.pc || 0], ['Installert app', appViews],
      ...Object.entries(vd).map(([k, v]) => ['Åpnet på ' + (DAY_LABELS[k] || k), v]),
      ...eye
    ], {}, false);
    status.hidden = true;
  } catch (e) {
    status.hidden = false;
    status.className = 'admin-status bad';
    status.textContent = 'Kunne ikke hente statistikk: ' + e.message;
  }
}

$$('input[name="statsDays"]').forEach(i => { i.onchange = loadStats; });

// ------------------------------------------------------------------ boot

api('api/admin/session')
  .then(s => showLoggedIn(!!s.loggedIn))
  .catch(() => showLoggedIn(false));
