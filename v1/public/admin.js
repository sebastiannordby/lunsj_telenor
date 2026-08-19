// admin.js — /admin: manuell menyoppdatering og midlertidig banner.

const $ = s => document.querySelector(s);

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
  if (yes) { loadBanner(); loadStatus(); loadOverrides(); loadBakern(); }
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
    status.textContent = 'Forhåndsvisning klar — ingenting er publisert enda.';
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
    status.textContent = 'Publisert — forsiden viser den nye menyen.';
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
  none: ['Ingen meny', 'bad']
};

async function loadStatus() {
  const grid = $('#statusGrid');
  const meta = $('#statusMeta');
  try {
    const s = await api('api/admin/status');
    grid.textContent = '';
    s.places.forEach(p => {
      const [label, tone] = SOURCE_LABEL[p.source] || SOURCE_LABEL.none;
      const row = el('div', 'status-row');
      row.appendChild(el('span', 'status-dot ' + tone));
      row.appendChild(el('span', 'status-name', p.name));
      row.appendChild(el('span', 'status-src', label));
      row.appendChild(el('span', 'status-count', p.count ? p.count + ' retter' : '—'));
      grid.appendChild(row);
    });

    const bits = ['menu.json bygget ' + when(s.generated)];
    if (s.files.dayFile) bits.push('dagsfil skrevet ' + when(s.files.dayFile));
    if (s.lastRun) {
      bits.push(s.lastRun.ok
        ? 'siste kjøring fra admin gikk bra ' + when(s.lastRun.at)
        : 'SISTE KJØRING FEILET ' + when(s.lastRun.at) + ' — ' + s.lastRun.error);
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

// ------------------------------------------------------------------ nødmodus

const PLACE_NAMES = {
  street: 'Eat The Street', m: 'Kantine M', fresh4you: 'Fresh 4 You',
  bakern: 'Bakern', dinner: 'Eat The Street – Middag'
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
    status.textContent = 'Lagret — ligger ute på forsiden nå.';
    renderOverrides(r.overrides);
    loadStatus();
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = e.message;
  }
};

// ------------------------------------------------------------------ bakern

async function loadBakern() {
  const { text, updated } = await api('api/admin/bakern').catch(() => ({ text: '', updated: null }));
  $('#bakernText').value = text;
  $('#bakernStatus').textContent = updated ? 'Sist endret ' + when(updated) : '';
}

$('#bakernSave').onclick = async () => {
  const status = $('#bakernStatus');
  status.className = 'admin-status';
  status.textContent = 'Lagrer …';
  try {
    const r = await api('api/admin/bakern', {
      method: 'POST',
      body: JSON.stringify({ text: $('#bakernText').value })
    });
    status.className = 'admin-status ok';
    status.textContent = 'Lagret og bygget på nytt · ' + when(r.updated);
    loadStatus();
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = e.message;
  }
};

// ------------------------------------------------------------------ banner

async function loadBanner() {
  const { banner } = await api('api/banner').catch(() => ({ banner: null }));
  const box = $('#bannerCurrent');
  if (!banner) {
    box.hidden = true;
    if (!$('#bUntil').value) $('#bUntil').value = todayIso();
    return;
  }
  box.hidden = false;
  $('#bannerLive').className = 'site-banner tone-' + banner.tone;
  $('#bannerLiveEmoji').textContent = banner.emoji || '';
  $('#bannerLiveText').textContent = banner.text;
  $('#bannerUntil').textContent = 'Vises til og med ' + banner.until;

  $('#bText').value = banner.text;
  $('#bTextEn').value = banner.textEn || '';
  $('#bEmoji').value = banner.emoji || '';
  $('#bUntil').value = banner.until;
  $('#bDismiss').checked = banner.dismissible !== false;
  const tone = document.querySelector(`input[name="tone"][value="${banner.tone}"]`);
  if (tone) tone.checked = true;
}

$('#bannerForm').onsubmit = async e => {
  e.preventDefault();
  const status = $('#bannerStatus');
  status.hidden = false;
  status.className = 'admin-status';
  status.textContent = 'Lagrer …';
  try {
    await api('api/admin/banner', {
      method: 'POST',
      body: JSON.stringify({
        text: $('#bText').value,
        textEn: $('#bTextEn').value,
        emoji: $('#bEmoji').value,
        tone: document.querySelector('input[name="tone"]:checked')?.value,
        until: $('#bUntil').value || todayIso(),
        dismissible: $('#bDismiss').checked
      })
    });
    status.className = 'admin-status ok';
    status.textContent = 'Banneret er publisert.';
    loadBanner();
  } catch (e) {
    status.className = 'admin-status bad';
    status.textContent = e.message;
  }
};

$('#bannerRemove').onclick = async () => {
  await api('api/admin/banner', { method: 'DELETE' }).catch(() => {});
  $('#bannerCurrent').hidden = true;
  const status = $('#bannerStatus');
  status.hidden = false;
  status.className = 'admin-status ok';
  status.textContent = 'Banneret er fjernet.';
};

// ------------------------------------------------------------------ boot

api('api/admin/session')
  .then(s => showLoggedIn(!!s.loggedIn))
  .catch(() => showLoggedIn(false));
