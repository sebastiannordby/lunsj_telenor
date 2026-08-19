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
  if (yes) loadBanner();
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
