// index.js
//
// Ny side på  /      (public/index.html + app.js + styles.css)
// Gammel side på /old (se OLD-SITE-seksjonen nederst)
//
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MENU_JSON = path.join(__dirname, 'public', 'menu.json');
const STATE_FILE = path.join(__dirname, 'state.json');
const BANNER_FILE = path.join(__dirname, 'banner.json');
const OVERRIDES_FILE = path.join(__dirname, 'overrides.json');
const STATUS_FILE = path.join(__dirname, 'last-run.json');
const PREVIEW_JSON = path.join(__dirname, 'menu.preview.json');
const MENU_DIR = path.join(__dirname, 'Menyer');
const BAKERN_TXT = path.join(MENU_DIR, 'bakern.txt');

// Kantiner som kan overstyres manuelt fra /admin (nødmodus)
const OVERRIDE_PLACES = ['street', 'm', 'fresh4you', 'bakern', 'dinner'];

// Admin-passord. Sett ADMIN_PASSWORD i miljøet (systemd-unit eller .env);
// uten det genereres et engangspassord som skrives til loggen ved oppstart.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
  || randomUUID().slice(0, 8);
if (!process.env.ADMIN_PASSWORD) {
  console.log(`\n  ADMIN_PASSWORD er ikke satt - bruker midlertidig passord: ${ADMIN_PASSWORD}\n`);
}

// ntfy-topics - sett som miljøvariabler i produksjon
const NTFY_UP = process.env.NTFY_UP || 'mb-lunsjfbu-lunsjmeny-fornebu-bra';
const NTFY_DOWN = process.env.NTFY_DOWN || 'mb-lunsjfbu-lunsjmeny-fornebu-darlig';
const NTFY_TEXT = process.env.NTFY_TEXT || 'mb-lunsjfbu-lunsjmeny-fornebu-tekst';

const VOTE_PLACES = new Set(['street', 'm', 'fresh4you']);

app.use(express.json({ limit: '64kb' }));

// ---------------------------------------------------------------- cache
//
// index.html caches aldri, og app.js/styles.css får en ?v= som følger filenes
// endringstidspunkt. Da henter nettleseren nye filer så snart du deployer,
// uten at noen må tømme cache - og uten at du bumper versjonsnummer manuelt.

const PUBLIC_DIR = path.join(__dirname, 'public');

async function assetStamp() {
  const files = ['app.js', 'admin.js', 'styles.css', 'fornebu-kart.png'];
  const stamps = await Promise.all(files.map(async f => {
    try {
      return (await fs.stat(path.join(PUBLIC_DIR, f))).mtimeMs;
    } catch {
      return 0;
    }
  }));
  return Math.max(...stamps).toString(36);
}

async function sendPage(res, file, script) {
  const [html, v] = await Promise.all([
    fs.readFile(path.join(PUBLIC_DIR, file), 'utf-8'),
    assetStamp()
  ]);
  res.set('Cache-Control', 'no-cache, must-revalidate');
  res.type('text/html; charset=utf-8').send(
    html
      // Godtar både "/styles.css" og "styles.css" - forhåndsvisning bruker
      // relative stier, serveren bryr seg ikke, men stemplet må treffe begge.
      .replace(/href="\/?styles\.css"/, `href="styles.css?v=${v}"`)
      .replace(new RegExp(`src="/?${script.replace('.', '\\.')}"`), `src="${script}?v=${v}"`)
  );
}

async function sendIndex(res) {
  return sendPage(res, 'index.html', 'app.js');
}

app.get('/', async (req, res, next) => {
  try {
    await sendIndex(res);
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------- python

function runPython(args) {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', args, { cwd: __dirname });
    let out = '';
    let err = '';
    python.stdout.on('data', d => (out += d.toString('utf-8')));
    python.stderr.on('data', d => (err += d.toString('utf-8')));
    python.on('close', code => {
      if (code !== 0) return reject(new Error(err || `Python exit ${code}`));
      resolve(out);
    });
  });
}

async function rebuildJson() {
  return runPython(['build_menu_json.py', '--out', MENU_JSON]);
}

// ---------------------------------------------------------------- state

// Norsk lokaltid, ikke UTC - ellers nullstilles stemmene kl. 02 om natten
// i stedet for ved midnatt. 'sv-SE' gir YYYY-MM-DD.
function todayKey() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });
}

async function readState() {
  try {
    const state = JSON.parse(await fs.readFile(STATE_FILE, 'utf-8'));
    if (state.date !== todayKey()) return { date: todayKey(), votes: {} };
    return state;
  } catch {
    return { date: todayKey(), votes: {} };
  }
}

async function writeState(state) {
  const tmp = STATE_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(state), 'utf-8');
  await fs.rename(tmp, STATE_FILE);
}

function cookieVote(req) {
  return req.headers.cookie?.match(/lunsjvote=([a-z0-9]+)/)?.[1] ?? null;
}

// ---------------------------------------------------------------- banner
//
// Et midlertidig banner øverst på siden, satt fra /admin. Ligger i egen fil
// (ikke state.json, som nullstilles hver midnatt) og har en utløpsdato.

async function readBanner() {
  try {
    const b = JSON.parse(await fs.readFile(BANNER_FILE, 'utf-8'));
    if (!b?.text) return null;
    if (b.until && b.until < todayKey()) return null;   // utløpt
    return b;
  } catch {
    return null;
  }
}

async function writeBanner(banner) {
  const tmp = BANNER_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(banner ?? {}, null, 2), 'utf-8');
  await fs.rename(tmp, BANNER_FILE);
}

// ---------------------------------------------------------------- admin auth
//
// Bevisst enkelt: ett delt passord byttes mot en session-token i minnet.
// Tokens forsvinner ved restart - da må man logge inn på nytt.

const SESSIONS = new Map();          // token -> utløpstidspunkt (ms)
const SESSION_MS = 12 * 60 * 60 * 1000;

function newSession() {
  const token = randomUUID().replace(/-/g, '');
  SESSIONS.set(token, Date.now() + SESSION_MS);
  return token;
}

function isAdmin(req) {
  const token = req.headers.cookie?.match(/lunsjadmin=([a-f0-9]+)/)?.[1];
  if (!token) return false;
  const exp = SESSIONS.get(token);
  if (!exp) return false;
  if (exp < Date.now()) { SESSIONS.delete(token); return false; }
  return true;
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'ikke innlogget' });
  next();
}

// ---------------------------------------------------------------- api

app.get('/api/traffic', async (req, res) => {
  const state = await readState();
  res.json({ date: state.date, votes: state.votes, myVote: cookieVote(req) });
});

app.post('/api/vote', async (req, res) => {
  const place = String(req.body?.place || '');
  if (!VOTE_PLACES.has(place)) return res.status(400).json({ error: 'ukjent sted' });

  const state = await readState();
  const prev = cookieVote(req);

  // Én stemme per bruker per dag: flytt stemmen i stedet for å legge til ny
  if (prev && state.votes[prev]) state.votes[prev] = Math.max(0, state.votes[prev] - 1);

  let next = place;
  if (prev === place) {
    next = ''; // trykk på nytt = angre
  } else {
    state.votes[place] = (state.votes[place] || 0) + 1;
  }

  await writeState(state);

  const midnight = new Date();
  midnight.setHours(23, 59, 59, 0);
  res.setHeader('Set-Cookie',
    `lunsjvote=${next}; Path=/; Expires=${midnight.toUTCString()}; SameSite=Lax`);
  res.json({ votes: state.votes, myVote: next || null });
});

app.post('/api/feedback', async (req, res) => {
  const kind = String(req.body?.kind || '');
  const message = String(req.body?.message || '').slice(0, 2000);

  // HTTP-headere må være ren ASCII - emoji sendes derfor som ntfy-tags,
  // ikke i Title. Æ/Ø/Å og emoji er trygt i selve body.
  const targets = {
    up: [NTFY_UP, 'Tommel opp', 'Noen liker den nye lunsjmeny-siden 👍', '+1'],
    down: [NTFY_DOWN, 'Tommel ned', 'Noen liker ikke den nye lunsjmeny-siden 👎', '-1'],
    text: [NTFY_TEXT, 'Detaljert tilbakemelding', message, 'speech_balloon']
  };

  const target = targets[kind];
  if (!target || (kind === 'text' && !message.trim())) {
    return res.status(400).json({ error: 'ugyldig tilbakemelding' });
  }

  const [topic, title, body, tag] = target;

  try {
    const r = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8', Title: title, Tags: tag },
      body
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      throw new Error(`ntfy ${r.status}: ${detail.slice(0, 200)}`);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('ntfy-feil:', e);
    res.status(502).json({ error: e.message });
  }
});

// ---------------------------------------------------------------- admin api

app.get('/api/banner', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ banner: await readBanner() });
});

app.get('/api/admin/session', (req, res) => {
  res.json({ loggedIn: isAdmin(req) });
});

app.post('/api/admin/login', (req, res) => {
  const pw = String(req.body?.password || '');
  if (pw !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Feil passord' });
  }
  res.setHeader('Set-Cookie',
    `lunsjadmin=${newSession()}; Path=/; Max-Age=${SESSION_MS / 1000}; HttpOnly; SameSite=Lax`);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.headers.cookie?.match(/lunsjadmin=([a-f0-9]+)/)?.[1];
  if (token) SESSIONS.delete(token);
  res.setHeader('Set-Cookie', 'lunsjadmin=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
  res.json({ ok: true });
});

app.post('/api/admin/banner', requireAdmin, async (req, res) => {
  const text = String(req.body?.text || '').trim().slice(0, 240);
  if (!text) return res.status(400).json({ error: 'Banneret må ha tekst' });

  const tones = ['info', 'good', 'warn'];
  const banner = {
    id: randomUUID().slice(0, 8),
    text,
    textEn: String(req.body?.textEn || '').trim().slice(0, 240) || null,
    emoji: String(req.body?.emoji || '').trim().slice(0, 4) || 'ℹ️',
    tone: tones.includes(req.body?.tone) ? req.body.tone : 'info',
    until: /^\d{4}-\d{2}-\d{2}$/.test(req.body?.until || '') ? req.body.until : todayKey(),
    dismissible: req.body?.dismissible !== false,
    created: new Date().toISOString()
  };
  await writeBanner(banner);
  res.json({ ok: true, banner });
});

app.delete('/api/admin/banner', requireAdmin, async (req, res) => {
  await writeBanner(null);
  res.json({ ok: true });
});

// Manuell oppdatering: samme kjede som cron/systemd kjører.
app.post('/api/admin/refresh', requireAdmin, async (req, res) => {
  const log = [];
  try {
    log.push('$ python3 scrape_dagens_menu.py');
    log.push((await runPython(['scrape_dagens_menu.py'])).trimEnd());
    log.push('$ python3 build_menu_json.py');
    log.push((await runPython(['build_menu_json.py'])).trimEnd());
    await recordRun(true, log.join('\n'));
    res.json({ ok: true, log: log.join('\n') });
  } catch (e) {
    log.push('FEIL: ' + e.message);
    await recordRun(false, log.join('\n'), e.message);
    res.status(500).json({ error: e.message, log: log.join('\n') });
  }
});

// ---------------------------------------------------------------- status

async function recordRun(ok, log, error) {
  const entry = {
    at: new Date().toISOString(),
    ok,
    error: error || null,
    log: (log || '').slice(-4000)
  };
  await fs.writeFile(STATUS_FILE, JSON.stringify(entry, null, 2), 'utf-8').catch(() => {});
}

async function mtime(file) {
  try {
    return (await fs.stat(file)).mtime.toISOString();
  } catch {
    return null;
  }
}

app.get('/api/admin/status', requireAdmin, async (req, res) => {
  let menu = null;
  try {
    menu = JSON.parse(await fs.readFile(MENU_JSON, 'utf-8'));
  } catch {}

  const today = menu?.today || null;
  const places = Object.entries(menu?.places || {}).map(([id, p]) => {
    const daily = menu?.todayOverride?.no?.[id]?.items || [];
    const weekly = p.week?.no?.[today] || [];
    const manual = menu?.manual?.[id]?.items || [];
    return {
      id,
      name: p.name,
      kind: p.kind,
      manual: manual.length > 0,
      count: manual.length || daily.length || weekly.length,
      source: manual.length ? 'manual' : daily.length ? 'daily' : weekly.length ? 'weekly' : 'none'
    };
  });

  let lastRun = null;
  try {
    lastRun = JSON.parse(await fs.readFile(STATUS_FILE, 'utf-8'));
  } catch {}

  res.json({
    generated: menu?.generated || null,
    today,
    places,
    lastRun,
    files: {
      menuJson: await mtime(MENU_JSON),
      dayFile: await mtime(path.join(__dirname, 'outputs', 'menus_no.txt')),
      bakern: await mtime(BAKERN_TXT)
    }
  });
});

// ---------------------------------------------------------------- nødmodus

async function readOverrides() {
  try {
    return JSON.parse(await fs.readFile(OVERRIDES_FILE, 'utf-8')) || {};
  } catch {
    return {};
  }
}

async function writeOverrides(all) {
  const tmp = OVERRIDES_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(all, null, 2), 'utf-8');
  await fs.rename(tmp, OVERRIDES_FILE);
  await rebuildJson();          // slår gjennom på forsiden med en gang
}

app.get('/api/admin/overrides', requireAdmin, async (req, res) => {
  res.json({ overrides: await readOverrides() });
});

app.post('/api/admin/override', requireAdmin, async (req, res) => {
  const place = String(req.body?.place || '');
  if (!OVERRIDE_PLACES.includes(place)) {
    return res.status(400).json({ error: 'ukjent kantine' });
  }
  const items = String(req.body?.text || '')
    .split('\n').map(l => l.trim().replace(/^[-–•]\s*/, '')).filter(Boolean).slice(0, 20);
  if (!items.length) return res.status(400).json({ error: 'Menyen må ha minst én rett' });

  const all = await readOverrides();
  all[place] = { items, set: new Date().toISOString() };
  await writeOverrides(all);
  res.json({ ok: true, overrides: all });
});

app.delete('/api/admin/override', requireAdmin, async (req, res) => {
  const place = String(req.query.place || '');
  const all = await readOverrides();
  delete all[place];
  await writeOverrides(all);
  res.json({ ok: true, overrides: all });
});

// ---------------------------------------------------------------- bakern.txt

app.get('/api/admin/bakern', requireAdmin, async (req, res) => {
  try {
    res.json({ text: await fs.readFile(BAKERN_TXT, 'utf-8'), updated: await mtime(BAKERN_TXT) });
  } catch {
    res.json({ text: '', updated: null });
  }
});

app.post('/api/admin/bakern', requireAdmin, async (req, res) => {
  const text = String(req.body?.text || '').slice(0, 8000);
  if (!text.trim()) return res.status(400).json({ error: 'Teksten er tom' });
  try {
    await fs.mkdir(MENU_DIR, { recursive: true });
    const tmp = BAKERN_TXT + '.tmp';
    await fs.writeFile(tmp, text.endsWith('\n') ? text : text + '\n', 'utf-8');
    await fs.rename(tmp, BAKERN_TXT);
    const log = await rebuildJson();
    res.json({ ok: true, log: log.trim(), updated: await mtime(BAKERN_TXT) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ------------------------------------------------------------- forhåndsvis
//
// Kjører skrapingen og bygger til en midlertidig fil, så du ser hva menyen
// VILLE blitt før public/menu.json røres. "Publiser" flytter den på plass.

app.post('/api/admin/preview', requireAdmin, async (req, res) => {
  const log = [];
  try {
    log.push('$ python3 scrape_dagens_menu.py');
    log.push((await runPython(['scrape_dagens_menu.py'])).trimEnd());
    log.push(`$ python3 build_menu_json.py --out ${path.basename(PREVIEW_JSON)}`);
    log.push((await runPython(['build_menu_json.py', '--out', PREVIEW_JSON])).trimEnd());

    const next = JSON.parse(await fs.readFile(PREVIEW_JSON, 'utf-8'));
    let current = null;
    try {
      current = JSON.parse(await fs.readFile(MENU_JSON, 'utf-8'));
    } catch {}

    const today = next.today;
    const dishes = (data, id) =>
      data?.manual?.[id]?.items?.length ? data.manual[id].items
        : data?.todayOverride?.no?.[id]?.items?.length ? data.todayOverride.no[id].items
        : data?.places?.[id]?.week?.no?.[today] || [];

    const diff = Object.keys(next.places || {}).map(id => ({
      id,
      name: next.places[id].name,
      items: dishes(next, id),
      changed: JSON.stringify(dishes(next, id)) !== JSON.stringify(dishes(current, id))
    }));

    res.json({ ok: true, log: log.join('\n'), today, diff });
  } catch (e) {
    log.push('FEIL: ' + e.message);
    res.status(500).json({ error: e.message, log: log.join('\n') });
  }
});

app.post('/api/admin/publish', requireAdmin, async (req, res) => {
  try {
    await fs.copyFile(PREVIEW_JSON, MENU_JSON);
    await recordRun(true, 'Publisert fra forhåndsvisning');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Ingen forhåndsvisning å publisere: ' + e.message });
  }
});

app.get('/admin', async (req, res, next) => {
  try {
    await sendPage(res, 'admin.html', 'admin.js');
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------- update

app.get('/update-day', async (req, res) => {
  try {
    const out = await runPython(['lunsj_fetch_daymenu.py']);
    res.type('text/plain; charset=utf-8').send(out + '\n' + await rebuildJson());
  } catch (e) {
    res.status(500).type('text/plain; charset=utf-8').send(`Feil: ${e.message}`);
  }
});

app.get('/update-week', async (req, res) => {
  try {
    const out = await runPython(['lunsj_fetch_weekmenu.py']);
    res.type('text/plain; charset=utf-8').send(out + '\n' + await rebuildJson());
  } catch (e) {
    res.status(500).type('text/plain; charset=utf-8').send(`Feil: ${e.message}`);
  }
});

app.get('/update-gjovik', async (req, res) => {
  try {
    const out = await runPython(['Gjovik/fetch_menu_google-spreadsheet.py']);
    res.type('text/plain; charset=utf-8').send(out);
  } catch (e) {
    res.status(500).type('text/plain; charset=utf-8').send(`Feil: ${e.message}`);
  }
});

// ================================================================
// OLD SITE  -  den gamle siden, bevart på /old i betaperioden
// ================================================================
//
// Lim inn din opprinnelige renderAppPage (og eventuelle hjelpere den
// bruker) her. Signaturen under er den de gamle rutene kaller.
// Slett hele denne seksjonen når betaperioden er over.

const OLD_DAYS = ['-1', '0', '1', '2', '3', '4'];

const oldDayMap = {
  mandag: '0', tirsdag: '1', onsdag: '2', torsdag: '3', fredag: '4',
  monday: '0', tuesday: '1', wednesday: '2', thursday: '3', friday: '4'
};

/**
 * Rendrer den gamle siden.
 * @param {string} day  '-1' = dagens, '0'–'4' = mandag–fredag
 * @param {string} lang 'no' | 'en' | 'al'
 */
async function renderOldPage(day, lang) {
  // Bruker de gamle lese-skriptene, uendret.
  const script = day === '-1' ? 'lunsj_read_daymenu.py' : 'lunsj_read_weekmenu.py';
  const menu = await runPython([script, day, lang]);

  const links = OLD_DAYS.map(d => {
    const label = { '-1': 'Dagens', '0': 'Mandag', '1': 'Tirsdag', '2': 'Onsdag', '3': 'Torsdag', '4': 'Fredag' }[d];
    const active = d === day ? ' class="on"' : '';
    return `<a href="/old?day=${d}&lang=${lang}"${active}>${label}</a>`;
  }).join(' ');

  const langs = [['no', 'Norsk'], ['en', 'English'], ['al', 'Allergener']]
    .map(([l, label]) => {
      const active = l === lang ? ' class="on"' : '';
      return `<a href="/old?day=${day}&lang=${l}"${active}>${label}</a>`;
    }).join(' ');

  return `<!DOCTYPE html>
<html lang="no"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lunsjmeny (gammel versjon)</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f5ead8; color: #201e1d;
         margin: 0; padding: 1.5rem; }
  .app { background: #fff; border-radius: 16px; padding: 1.5rem 2rem; margin: 0 auto;
         max-width: 640px; box-shadow: 0 8px 30px rgba(7,4,82,.12); }
  .banner { max-width: 640px; margin: 0 auto 1rem; padding: .75rem 1rem; border-radius: 999px;
            background: #1c16c5; color: #fff; font-size: .9rem; }
  .banner a { color: #fff; font-weight: 700; }
  h1 { margin: 0 0 1rem; font-size: 1.5rem; }
  nav { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1rem; }
  nav a { font-size: .85rem; text-decoration: none; color: #120e80;
          padding: .25rem .75rem; border: 1px solid #d0dde7; border-radius: 999px; }
  nav a.on { background: #1c16c5; border-color: #1c16c5; color: #fff; }
  pre { white-space: break-spaces; font-family: inherit; font-size: 1rem; margin: 0; }
</style></head>
<body>
<div class="banner">Dette er den gamle siden. <a href="/">Gå til den nye →</a></div>
<div class="app">
  <h1>LUNSJMENY</h1>
  <nav>${links}</nav>
  <nav>${langs}</nav>
  <pre>${menu}</pre>
</div>
</body></html>`;
}

app.get('/old', async (req, res) => {
  const day = OLD_DAYS.includes(String(req.query.day)) ? String(req.query.day) : '-1';
  const lang = ['no', 'en', 'al'].includes(String(req.query.lang)) ? String(req.query.lang) : 'no';
  try {
    res.type('text/html; charset=utf-8').send(await renderOldPage(day, lang));
  } catch (e) {
    res.status(500).type('text/plain; charset=utf-8').send(`Feil: ${e.message}`);
  }
});

// Gamle bokmerker → /old, så de virker uendret i betaperioden
app.get('/en', (req, res) => res.redirect(302, '/old?lang=en'));
app.get('/with-allergies', (req, res) => res.redirect(302, '/old?lang=al'));
app.get('/dag/:day', (req, res) =>
  res.redirect(302, `/old?day=${oldDayMap[req.params.day] ?? '-1'}&lang=no`));
app.get('/en/day/:day', (req, res) =>
  res.redirect(302, `/old?day=${oldDayMap[req.params.day] ?? '-1'}&lang=en`));

// ================================================================

// ---------------------------------------------------------------- gjøvik

const GJ_DAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Deler den flate teksten fra regnearket i dagens meny, ukens dager og fritekst.
// Rører ikke Python-scriptet - bare tolker linjene det skriver ut.
function parseGjovik(raw) {
  const lines = String(raw).replace(/\r\n?/g, '\n').split('\n').map(l => l.trim());
  const res = { todayLabel: '', today: [], week: [], notes: [] };
  let mode = 'today', cur = null;

  for (const line of lines) {
    if (!line) continue;
    let m;
    if ((m = line.match(/^dagens\s+lunsj\s*[-–:]\s*(.+?):?$/i))) {
      res.todayLabel = m[1]; mode = 'today'; cur = null; continue;
    }
    if (/^ukens\s+meny:?$/i.test(line)) { mode = 'week'; cur = null; continue; }
    if ((m = line.match(/^(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s*:?$/i))) {
      const name = GJ_DAYS.find(d => d.toLowerCase() === m[1].toLowerCase());
      cur = { day: name, items: [] };
      res.week.push(cur); mode = 'week'; continue;
    }
    const item = line.replace(/^[-–•]\s*/, '');
    if (mode === 'week' && cur) cur.items.push(item);
    else if (mode === 'today' && /^[-–•]/.test(line)) res.today.push(item);
    else res.notes.push(item);
  }
  return res;
}

app.get('/gjovik', async (req, res) => {
  try {
    const data = parseGjovik(await runPython(['lunsj_gjovik.py']));
    const todayName = GJ_DAYS[(new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Oslo' })).getDay() + 6) % 7];

    const todayCard = data.today.length ? `
      <section class="hero">
        <p class="kicker">${esc(data.todayLabel || 'Dagens lunsj')}</p>
        <ul class="dishes">${data.today.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      </section>` : '';

    const week = data.week.length ? `
      <section class="week">
        <h2>Ukens meny</h2>
        <div class="days">${data.week.map(d => `
          <div class="day${d.day === todayName ? ' is-today' : ''}">
            <div class="day-inner">
              <h3>${esc(d.day)}</h3>
              <ul>${d.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
            </div>
          </div>`).join('')}</div>
      </section>` : '';

    const notes = data.notes.length
      ? `<p class="notes">${data.notes.map(esc).join('<br>')}</p>` : '';

    res.type('text/html; charset=utf-8').send(`<!DOCTYPE html>
<html lang="no"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="refresh" content="900">
<title>Lunsjmeny Gjøvik</title>
<link href="https://fonts.googleapis.com/css2?family=Caprasimo&family=Figtree:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  /* Skjermen i gangen er en Samsung-TV med gammel Tizen-nettleser: ingen
     CSS-variabler, ingen clamp(), ingen grid og ingen gap. Alt her er derfor
     rene hex-farger, faste px-verdier og float-kolonner. Ikke moderniser
     denne stilen - da blir skjermen hvit. */
  * { -webkit-box-sizing: border-box; box-sizing: border-box; }
  body { font-family: 'Figtree', Helvetica, Arial, sans-serif; background: #f5ead8;
         color: #201e1d; margin: 0; padding: 24px; }
  .app { background: #fffdf8; border: 1px solid #ecd9bd; border-radius: 20px;
         padding: 32px 36px 40px; }
  h1 { font-family: 'Caprasimo', Georgia, serif; font-weight: normal; margin: 0 0 22px;
       font-size: 40px; line-height: 1.05; color: #8f4d24; }
  .hero { background: #f7e3d3; border-radius: 16px; padding: 22px 26px; margin-bottom: 30px; }
  .kicker { margin: 0 0 8px; font-size: 15px; font-weight: bold; letter-spacing: 1px;
            text-transform: uppercase; color: #8f4d24; }
  .dishes { list-style: none; margin: 0; padding: 0; }
  .dishes li { font-family: 'Caprasimo', Georgia, serif; font-weight: normal; font-size: 30px;
               line-height: 1.2; margin: 0 0 6px; color: #201e1d; }
  .week h2 { font-family: 'Caprasimo', Georgia, serif; font-weight: normal; margin: 0 0 16px;
             font-size: 23px; color: #7a716a; }
  /* Float i stedet for grid, margin i stedet for gap */
  .days { margin: 0 -7px; }
  .days:after { content: ""; display: block; clear: both; }
  .day { float: left; width: 50%; padding: 0 7px; margin-bottom: 14px; }
  .day-inner { background: #e8ecdf; border-radius: 14px; padding: 16px 18px; color: #201e1d; }
  .day.is-today .day-inner { background: #7a8a5e; color: #ffffff; }
  .day h3 { margin: 0 0 6px; font-size: 14px; font-weight: bold; letter-spacing: 1px;
            text-transform: uppercase; color: #5d6b45; }
  .day.is-today h3 { color: #ffffff; }
  .day ul { list-style: none; margin: 0; padding: 0; }
  .day li { font-size: 20px; line-height: 1.3; margin: 0 0 3px; word-wrap: break-word; }
  .notes { clear: both; margin: 22px 0 0; font-size: 17px; line-height: 1.5; color: #7a716a; }
  /* Skjermen i gangen star pa hoykant - da skal alt leses pa avstand */
  @media (min-width: 700px) {
    body { padding: 34px; } .app { padding: 44px 48px 52px; }
    h1 { font-size: 62px; } .kicker { font-size: 20px; } .dishes li { font-size: 46px; }
    .week h2 { font-size: 32px; } .day h3 { font-size: 19px; } .day li { font-size: 30px; }
    .notes { font-size: 22px; }
  }
  @media (min-width: 1000px) {
    h1 { font-size: 82px; } .kicker { font-size: 26px; } .dishes li { font-size: 60px; }
    .week h2 { font-size: 42px; } .day-inner { padding: 22px 26px; }
    .day h3 { font-size: 24px; } .day li { font-size: 38px; } .notes { font-size: 28px; }
  }
</style></head>
<body><div class="app">
  <h1>Lunsjmeny Gjøvik</h1>
  ${todayCard}${week}${notes}
</div></body></html>`);
  } catch (e) {
    res.status(500).type('text/plain; charset=utf-8').send(`Feil: ${e.message}`);
  }
});

// ---------------------------------------------------------------- webex / test

app.get('/webex', async (req, res) => {
  try {
    res.type('text/plain; charset=utf-8').send(await runPython(['lunsj_webex.py', '-1', 'no']));
  } catch (e) {
    res.status(500).type('text/plain; charset=utf-8').send(`Feil: ${e.message}`);
  }
});

app.get('/test', async (req, res) => {
  try {
    res.type('text/plain; charset=utf-8').send(await runPython(['lunsj_test.py', '-1', 'no']));
  } catch (e) {
    res.status(500).type('text/plain; charset=utf-8').send(`Feil: ${e.message}`);
  }
});

// ---------------------------------------------------------------- statiske filer
// Til slutt, så rutene over alltid vinner.

app.use(express.static(PUBLIC_DIR, {
  index: false,           // '/' håndteres over, med ?v= injisert
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html') || filePath.endsWith('menu.json')) {
      // Innhold som endres gjennom dagen må alltid revalideres
      res.set('Cache-Control', 'no-cache, must-revalidate');
    } else {
      // Versjonerte filer kan caches lenge - ?v= endres når filen endres
      res.set('Cache-Control', 'public, max-age=604800');
    }
  }
}));

app.listen(port, () => console.log(`LunsjApp kjører på port: ${port}!`));
