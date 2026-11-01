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
import { randomUUID, createHmac, createHash, timingSafeEqual } from 'crypto';
import { existsSync } from 'fs';

// web-push er valgfri: mangler pakken, skrus pushvarsler bare av.
let webpush = null;
try {
  webpush = (await import('web-push')).default;
} catch {
  console.log('web-push er ikke installert - pushvarsler er av (npm install web-push).');
}

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
const RAW_DIR = path.join(__dirname, 'raw_html');
const BAKERN_HASH = path.join(RAW_DIR, 'bakern_image.sha256');

// Steder som bare har ukesmeny (ingen dagsmeny-widget å skrape). For dem er
// "ukesmeny" riktig kilde, ikke et faresignal.
const WEEKLY_SOURCE = new Set(['bakern', 'dinner']);
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// Kantiner som kan overstyres manuelt fra /admin (nødmodus)
const OVERRIDE_PLACES = ['m', 'fresh4you', 'bakern', 'dinner'];

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
// Driftsvarsler (meny mangler, cron står stille). Sett NTFY_ALERT=off for å skru av.
const NTFY_ALERT = process.env.NTFY_ALERT || 'mb-lunsjfbu-lunsjmeny-fornebu-varsel';
const NTFY_URL = process.env.NTFY_URL || 'https://ntfy.sh';

const VOTE_PLACES = new Set(['m', 'fresh4you', 'bakern']);

const VOTE_LABELS = { m: 'M', fresh4you: 'Fresh4You', bakern: 'Bakern' };

// Bot-brems: en klient som ikke tar imot cookien kan ellers poste stemmer i
// det uendelige. Vi teller forsøk per IP per dag i minnet (nullstilles ved
// omstart, som er greit - stemmene nullstilles hver midnatt likevel).
const VOTE_LIMIT_PER_IP = 15;
const voteHits = new Map(); // ip -> { date, n }

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket.remoteAddress || '?';
}

// Delt kontornett gir én utgående IP for mange folk, så nøkkelen er IP +
// nettleser. Ikke vanntett, men treffer bedre enn IP alene.
function clientKey(req) {
  return clientIp(req) + '|' + String(req.headers['user-agent'] || '').slice(0, 120);
}

function voteRateExceeded(req) {
  const key = clientKey(req);
  const today = todayKey();
  const hit = voteHits.get(key);
  if (!hit || hit.date !== today) {
    voteHits.set(key, { date: today, n: 1 });
    return false;
  }
  hit.n += 1;
  return hit.n > VOTE_LIMIT_PER_IP;
}

// -------------------------------------------------------- stemmesesjon
//
// /api/vote godtok tidligere en naken POST. Nå må klienten først hente
// /api/traffic (som siden alltid gjør ved lasting), som setter en signert
// lunsjsess-cookie. En bot må dermed gjøre to kall i riktig rekkefølge OG ta
// imot cookies. I tillegg må det gå minst SESSION_MIN_AGE_MS fra sesjonen ble
// utstedt til første stemme - gratis for mennesker, i veien for skript.

const VOTE_SECRET = process.env.VOTE_SECRET || randomUUID();
const VOTE_SESSION_MS = 12 * 60 * 60 * 1000;
const SESSION_MIN_AGE_MS = 2000;

// Hvilke Origin/Referer vi godtar. Sett ALLOWED_ORIGIN i produksjon
// (komma-separert hvis flere), ellers godtas alt for lokal utvikling.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean);

function sign(value) {
  return createHmac('sha256', VOTE_SECRET).update(value).digest('hex').slice(0, 32);
}

function newVoteSession() {
  const payload = `${Date.now()}.${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  return `${payload}.${sign(payload)}`;
}

/** Returnerer alder i ms hvis cookien er ekte og fersk, ellers null. */
function voteSessionAge(req) {
  const raw = req.headers.cookie?.match(/lunsjsess=([\w.]+)/)?.[1];
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const want = Buffer.from(sign(payload));
  const got = Buffer.from(parts[2]);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const age = Date.now() - Number(parts[0]);
  if (!Number.isFinite(age) || age < 0 || age > VOTE_SESSION_MS) return null;
  return age;
}

function originAllowed(req) {
  if (!ALLOWED_ORIGINS.length) return true;
  const src = req.headers.origin || req.headers.referer || '';
  if (!src) return false; // nettlesere sender alltid en av dem på POST
  return ALLOWED_ORIGINS.some(o => src === o || src.startsWith(o + '/'));
}

// --------------------------------------------------------- stemmelogg
//
// Hver stemme logges med hashet klientnøkkel, så admin kan se HVORDAN juksingen
// skjer (én maskin eller mange?) og fjerne én synder presist i stedet for å
// nullstille alt. Logg og sperreliste ligger i state.json og forsvinner ved
// midnatt sammen med stemmene.

const VOTE_LOG_MAX = 600;
const BURST_WINDOW_MS = 60 * 1000;
const BURST_LIMIT = 25;
let burstNotifiedAt = 0;

function hashKey(key) {
  return createHash('sha256').update(VOTE_SECRET + key).digest('hex').slice(0, 10);
}

async function notifyBurst(count) {
  if (Date.now() - burstNotifiedAt < 30 * 60 * 1000) return;
  burstNotifiedAt = Date.now();
  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(NTFY_DOWN)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        Title: 'Mistenkelig avstemming',
        Tags: 'warning'
      },
      body: `${count} stemmer siste minutt pa lunsjmeny-siden. Sjekk /admin.`
    });
  } catch (e) {
    console.error('ntfy-varsel feilet:', e);
  }
}

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
  const [html, v, season] = await Promise.all([
    fs.readFile(path.join(PUBLIC_DIR, file), 'utf-8'),
    assetStamp(),
    file === 'index.html' ? currentSeason() : null
  ]);
  res.set('Cache-Control', 'no-cache, must-revalidate');
  res.type('text/html; charset=utf-8').send(
    html
      // Sesongtema på forsiden - satt før første opptegning, ingen blink
      .replace('<html lang="no">', season ? `<html lang="no" data-season="${season}">` : '<html lang="no">')
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

//
// Ubuntu 24.04 blokkerer globale pip-pakker, så vi bruker prosjektets venv.
// Rekkefølge: PYTHON_BIN fra miljøet → .venv i prosjektet → system-python3.
const PYTHON_BIN = process.env.PYTHON_BIN
  || (existsSync(path.join(__dirname, '.venv', 'bin', 'python'))
    ? path.join(__dirname, '.venv', 'bin', 'python')
    : 'python3');

console.log(`Bruker Python: ${PYTHON_BIN}`);

function runPython(args, { timeout = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const python = spawn(PYTHON_BIN, args, {
      cwd: __dirname,
      env: { ...process.env, LUNSJ_TRIGGER: 'admin' }   // runlog.py skiller admin fra cron
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      python.kill('SIGKILL');
      reject(new Error(`Python-script tok over ${timeout / 1000}s: ${args[0]}`));
    }, timeout);
    python.stdout.on('data', d => (out += d.toString('utf-8')));
    python.stderr.on('data', d => (err += d.toString('utf-8')));
    python.on('error', e => {
      clearTimeout(timer);
      reject(new Error(`Klarte ikke starte ${PYTHON_BIN}: ${e.message}`));
    });
    python.on('close', code => {
      clearTimeout(timer);
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
  const empty = () => ({ date: todayKey(), votes: {}, log: [], blocked: [] });
  try {
    const state = JSON.parse(await fs.readFile(STATE_FILE, 'utf-8'));
    if (state.date !== todayKey()) return empty();
    state.log ||= [];
    state.blocked ||= [];
    return state;
  } catch {
    return empty();
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

//
// banner.json er en liste, så bannere kan planlegges fram i tid (f.eks. jul).
// Et banner vises fra og med `from` til og med `until`. Gamle filer med ett
// enkelt banner-objekt leses fortsatt.

async function readBanners() {
  try {
    const raw = JSON.parse(await fs.readFile(BANNER_FILE, 'utf-8'));
    const list = Array.isArray(raw) ? raw : (raw?.text ? [raw] : []);
    return list.filter(b => b?.text && b.id);
  } catch {
    return [];
  }
}

function bannerStatus(b, today = todayKey()) {
  if (b.until && b.until < today) return 'expired';
  if (b.from && b.from > today) return 'planned';
  return 'active';
}

/** Banneret som vises nå: det sist opprettede av de aktive. */
async function readBanner() {
  const active = (await readBanners()).filter(b => bannerStatus(b) === 'active');
  active.sort((a, b) => String(b.created).localeCompare(String(a.created)));
  return active[0] || null;
}

async function writeBanners(list) {
  // Utløpte bannere ryddes bort etter en uke
  const cutoff = new Date(Date.now() - 7 * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });
  const keep = list.filter(b => !b.until || b.until >= cutoff);
  const tmp = BANNER_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(keep, null, 2), 'utf-8');
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
  // Utsteder stemmesesjonen. Fornyes bare hvis den mangler eller er utløpt, så
  // alderskravet ikke nullstilles hver gang siden lastes.
  if (voteSessionAge(req) === null) {
    res.setHeader('Set-Cookie',
      `lunsjsess=${newVoteSession()}; Path=/; Max-Age=${VOTE_SESSION_MS / 1000}; HttpOnly; SameSite=Lax`);
  }
  res.json({ date: state.date, votes: state.votes, myVote: cookieVote(req) });
});

app.post('/api/vote', async (req, res) => {
  const place = String(req.body?.place || '');
  if (!VOTE_PLACES.has(place)) return res.status(400).json({ error: 'ukjent sted' });

  if (!originAllowed(req)) {
    return res.status(403).json({ error: 'ugyldig opphav' });
  }

  const age = voteSessionAge(req);
  if (age === null) {
    // Klienten kan hente /api/traffic og prøve på nytt.
    return res.status(403).json({ error: 'mangler sesjon', retry: true });
  }
  if (age < SESSION_MIN_AGE_MS) {
    return res.status(429).json({ error: 'for raskt - prøv igjen om et øyeblikk' });
  }

  const who = hashKey(clientKey(req));
  const state = await readState();

  if (state.blocked.includes(who)) {
    return res.status(403).json({ error: 'stemming sperret for denne maskinen i dag' });
  }
  if (voteRateExceeded(req)) {
    return res.status(429).json({ error: 'For mange stemmer fra denne maskinen i dag' });
  }

  const prev = cookieVote(req);

  // Én stemme per bruker per dag: flytt stemmen i stedet for å legge til ny
  if (prev && state.votes[prev]) state.votes[prev] = Math.max(0, state.votes[prev] - 1);

  let next = place;
  if (prev === place) {
    next = ''; // trykk på nytt = angre
  } else {
    state.votes[place] = (state.votes[place] || 0) + 1;
  }

  state.log.push({ t: Date.now(), who, place, undo: next === '' });
  if (state.log.length > VOTE_LOG_MAX) state.log = state.log.slice(-VOTE_LOG_MAX);

  await writeState(state);

  // Uvanlig mange stemmer på kort tid -> varsel på ntfy.
  const recent = state.log.filter(e => Date.now() - e.t < BURST_WINDOW_MS).length;
  if (recent > BURST_LIMIT) notifyBurst(recent);

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

app.get('/api/admin/banners', requireAdmin, async (req, res) => {
  const today = todayKey();
  const list = (await readBanners())
    .map(b => ({ ...b, status: bannerStatus(b, today) }))
    .sort((a, b) => String(a.from || '').localeCompare(String(b.from || '')));
  res.json({ banners: list, today });
});

// Nytt banner, eller endring av et eksisterende (med id)
app.post('/api/admin/banner', requireAdmin, async (req, res) => {
  const text = String(req.body?.text || '').trim().slice(0, 240);
  if (!text) return res.status(400).json({ error: 'Banneret må ha tekst' });

  const isDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
  const from = isDate(req.body?.from) ? req.body.from : todayKey();
  const until = isDate(req.body?.until) ? req.body.until : from;
  if (until < from) return res.status(400).json({ error: '«Til og med» er før «Vis fra»' });

  const list = await readBanners();
  const id = String(req.body?.id || '');
  const existing = list.find(b => b.id === id);

  const tones = ['info', 'good', 'warn'];
  const banner = {
    // Endret tekst får ny id, så de som lukket det gamle ser det nye
    id: existing && existing.text === text ? existing.id : randomUUID().slice(0, 8),
    text,
    textEn: String(req.body?.textEn || '').trim().slice(0, 240) || null,
    emoji: String(req.body?.emoji || '').trim().slice(0, 4) || 'ℹ️',
    tone: tones.includes(req.body?.tone) ? req.body.tone : 'info',
    from,
    until,
    dismissible: req.body?.dismissible !== false,
    created: existing?.created || new Date().toISOString()
  };
  const next = list.filter(b => b.id !== id);
  next.push(banner);
  await writeBanners(next);
  res.json({ ok: true, banner, status: bannerStatus(banner) });
});

// ?id=... fjerner ett banner. Uten id fjernes de som er aktive nå.
app.delete('/api/admin/banner', requireAdmin, async (req, res) => {
  const id = String(req.query.id || '');
  const list = await readBanners();
  await writeBanners(id
    ? list.filter(b => b.id !== id)
    : list.filter(b => bannerStatus(b) !== 'active'));
  res.json({ ok: true });
});

// Skraper dagsmenyene (lunsj) og ukesmenyene (lunsj + middag). Bakern hentes
// for seg, siden den går via AI og bare trengs når bildet er byttet.
async function runScrapers(log) {
  log.push('$ python3 scrape_dagens_menu.py');
  log.push((await runPython(['scrape_dagens_menu.py'])).trimEnd());
  log.push('$ python3 scrape_ukens_menu.py');
  log.push((await runPython(['scrape_ukens_menu.py'])).trimEnd());
}

// Manuell oppdatering: samme kjede som cron/systemd kjører.
app.post('/api/admin/refresh', requireAdmin, async (req, res) => {
  const log = [];
  try {
    await runScrapers(log);
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

// Ukedag i norsk tid: 0 = mandag ... 6 = søndag
function osloWeekday() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  return (d.getDay() + 6) % 7;
}

function osloDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' }) : null;
}

/**
 * Hva forsiden viser for hvert sted "i dag" - samme prioritet som app.js:
 * manuell > dagsmeny > ukesmeny. I helgen vises mandagens ukesmeny, og en
 * dagfil fra en annen dag teller ikke.
 */
function resolveMenu(menu) {
  const wd = osloWeekday();
  const weekend = wd > 4;
  const day = weekend ? 'mon' : DAY_KEYS[wd];
  const dailyFresh = !weekend && osloDate(menu?.dailyUpdated) === todayKey();

  const places = Object.entries(menu?.places || {}).map(([id, p]) => {
    const manual = weekend ? [] : (menu?.manual?.[id]?.items || []);
    const daily = dailyFresh && !WEEKLY_SOURCE.has(id) ? (menu?.todayOverride?.no?.[id]?.items || []) : [];
    const weekly = p.week?.no?.[day] || [];
    const items = manual.length ? manual : daily.length ? daily : weekly;
    return {
      id,
      name: p.name,
      kind: p.kind,
      items,
      count: items.length,
      manual: manual.length > 0,
      weeklySource: WEEKLY_SOURCE.has(id),
      updated: p.updated || null,
      source: manual.length ? 'manual' : daily.length ? 'daily' : weekly.length ? 'weekly' : 'none'
    };
  });
  return { day, weekend, dailyFresh, places };
}

app.get('/api/admin/status', requireAdmin, async (req, res) => {
  let menu = null;
  try {
    menu = JSON.parse(await fs.readFile(MENU_JSON, 'utf-8'));
  } catch {}

  const { day, weekend, dailyFresh, places } = resolveMenu(menu);
  const today = day;

  let lastRun = null;
  try {
    lastRun = JSON.parse(await fs.readFile(STATUS_FILE, 'utf-8'));
  } catch {}

  const pushSubs = pushReady ? Object.keys(await readSubs()).length : null;

  res.json({
    generated: menu?.generated || null,
    pushSubs,
    today,
    weekend,
    dailyFresh,
    places: places.map(({ items, ...p }) => p),
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

// ---------------------------------------------------------------- stemmer
//
// Nullstilling fra /admin: enten alt, eller én kantine. Cookie-sperren hos dem
// som alt har stemt blir stående, men tellerne starter på null.

app.get('/api/admin/votes', requireAdmin, async (req, res) => {
  const state = await readState();

  // Grupperer loggen per maskin, slik at mønsteret blir synlig: én nøkkel med
  // 800 stemmer er en bot, 200 nøkler med én hver er ekte folk.
  const byWho = new Map();
  state.log.forEach(e => {
    const g = byWho.get(e.who) || { who: e.who, votes: 0, undos: 0, first: e.t, last: e.t, places: {} };
    if (e.undo) g.undos += 1; else g.votes += 1;
    g.first = Math.min(g.first, e.t);
    g.last = Math.max(g.last, e.t);
    if (!e.undo) g.places[e.place] = (g.places[e.place] || 0) + 1;
    byWho.set(e.who, g);
  });

  const clients = [...byWho.values()]
    .map(g => ({
      ...g,
      blocked: state.blocked.includes(g.who),
      // Stemmer per minutt over det tidsrommet maskinen var aktiv.
      rate: g.last > g.first
        ? +(g.votes / ((g.last - g.first) / 60000)).toFixed(1)
        : g.votes
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 25);

  res.json({
    date: state.date,
    limit: VOTE_LIMIT_PER_IP,
    logged: state.log.length,
    logCapped: state.log.length >= VOTE_LOG_MAX,
    lastMinute: state.log.filter(e => Date.now() - e.t < BURST_WINDOW_MS).length,
    originLocked: ALLOWED_ORIGINS.length > 0,
    clients,
    places: [...VOTE_PLACES].map(id => ({
      id,
      label: VOTE_LABELS[id] || id,
      count: state.votes[id] || 0
    }))
  });
});

// Sperrer én maskin resten av dagen OG trekker fra stemmene den la inn -
// presis opprydding i stedet for å nullstille alt.
app.post('/api/admin/votes/block', requireAdmin, async (req, res) => {
  const who = String(req.body?.who || '');
  if (!/^[a-f0-9]{10}$/.test(who)) return res.status(400).json({ error: 'ugyldig nøkkel' });

  const state = await readState();
  let removed = 0;

  state.log.filter(e => e.who === who && !e.undo).forEach(e => {
    if (state.votes[e.place]) {
      state.votes[e.place] = Math.max(0, state.votes[e.place] - 1);
      removed += 1;
    }
  });

  state.log = state.log.filter(e => e.who !== who);
  if (!state.blocked.includes(who)) state.blocked.push(who);

  await writeState(state);
  res.json({ ok: true, removed, votes: state.votes });
});

app.delete('/api/admin/votes/block', requireAdmin, async (req, res) => {
  const who = String(req.query.who || '');
  const state = await readState();
  state.blocked = state.blocked.filter(w => w !== who);
  await writeState(state);
  res.json({ ok: true });
});

app.delete('/api/admin/votes', requireAdmin, async (req, res) => {
  const place = String(req.query.place || '');
  const state = await readState();

  if (place) {
    if (!VOTE_PLACES.has(place)) return res.status(400).json({ error: 'ukjent sted' });
    state.votes[place] = 0;
    state.log = state.log.filter(e => e.place !== place);
  } else {
    state.votes = {};
    state.log = [];
    state.blocked = [];
    voteHits.clear();
  }

  state.date = todayKey();
  await writeState(state);
  res.json({ ok: true, votes: state.votes });
});

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
    // Kom teksten fra "Hent fra bildet", lagrer vi bildets fingeravtrykk - da
    // lar cron-jobben menyen være til Bakern faktisk bytter bilde.
    const hash = String(req.body?.hash || '');
    if (/^[a-f0-9]{64}$/.test(hash)) {
      await fs.mkdir(RAW_DIR, { recursive: true });
      await fs.writeFile(BAKERN_HASH, hash + '\n', 'utf-8');
    }
    const log = await rebuildJson();
    res.json({ ok: true, log: log.trim(), updated: await mtime(BAKERN_TXT) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ------------------------------------------------------------- kjørelogg
//
// runs.json skrives av runlog.py i hvert Python-skript. Her vises siste
// kjøring per skript, og om den er for gammel ut fra hvor ofte den skal gå.

const RUNS_FILE = path.join(__dirname, 'runs.json');
const SCRIPTS = [
  { script: 'scrape_dagens_menu.py', label: 'Dagsmeny (lunsj)', maxAgeH: 2, weekdayMorning: true },
  { script: 'scrape_ukens_menu.py', label: 'Ukesmenyer og middag', maxAgeH: 26 },
  { script: 'build_menu_json.py', label: 'Bygg menu.json', maxAgeH: 2, weekdayMorning: true },
  { script: 'scrape_bakern.py', label: 'Bakern (bilde + AI)', maxAgeH: 8 * 24 }
];

async function readRuns() {
  try {
    return JSON.parse(await fs.readFile(RUNS_FILE, 'utf-8')).history || [];
  } catch {
    return [];
  }
}

app.get('/api/admin/runs', requireAdmin, async (req, res) => {
  const history = await readRuns();
  const { weekday, minutes } = osloClock();
  // Hyppige skript vurderes bare når de faktisk skal gå (hverdager 07-13)
  const inWindow = weekday <= 4 && minutes >= 7 * 60 && minutes <= 13 * 60;

  const scripts = SCRIPTS.map(s => {
    const runs = history.filter(r => r.script === s.script);
    const last = runs[0] || null;
    const lastOk = runs.find(r => r.ok) || null;
    const ageH = last ? (Date.now() - new Date(last.at)) / 3600000 : Infinity;
    const stale = !!last && (!s.weekdayMorning || inWindow) && ageH > s.maxAgeH;
    return { ...s, last, lastOk, stale, runs: runs.slice(0, 15) };
  });
  res.json({ scripts, logMissing: !history.length });
});

// ------------------------------------------------------------- rå HTML
//
// Det scraperne faktisk lastet ned (raw_html/). Vises som ren tekst - aldri
// som HTML på vår egen side - så innholdet fra inisign ikke kan kjøre noe.

const RAW_NAME = /^[\w.\-]+\.html$/;

app.get('/api/admin/raw', requireAdmin, async (req, res) => {
  try {
    const names = (await fs.readdir(RAW_DIR)).filter(n => RAW_NAME.test(n));
    const files = await Promise.all(names.map(async name => {
      const st = await fs.stat(path.join(RAW_DIR, name));
      return { name, size: st.size, updated: st.mtime.toISOString() };
    }));
    files.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ files });
  } catch {
    res.json({ files: [] });
  }
});

app.get('/api/admin/raw/file', requireAdmin, async (req, res) => {
  const name = String(req.query.name || '');
  if (!RAW_NAME.test(name)) return res.status(400).send('Ugyldig filnavn');
  try {
    const text = await fs.readFile(path.join(RAW_DIR, name), 'utf-8');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Security-Policy', "default-src 'none'");
    res.type('text/plain; charset=utf-8').send(text || '(tom fil - hentingen feilet sist)');
  } catch {
    res.status(404).send('Fant ikke filen');
  }
});

// Tekstlinjene parseren ser, med markering av dagoverskrifter og hvor den stopper
app.get('/api/admin/raw/text', requireAdmin, async (req, res) => {
  const name = String(req.query.name || '');
  if (!RAW_NAME.test(name)) return res.status(400).json({ error: 'Ugyldig filnavn' });
  try {
    const out = await runPython(['debug_raw.py', path.join('raw_html', name)], { timeout: 30000 });
    res.json({ text: out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ------------------------------------------------------------- sesongtema
//
// Temaet settes som data-season på <html> når siden sendes, så pynten er der
// fra første opptegning. «auto» velger etter dato; admin kan overstyre.

const THEME_FILE = path.join(__dirname, 'theme.json');
const SEASONS = ['host', 'vinter', 'jul', 'paske', '17mai'];
const SEASON_LABELS = { host: 'Høst', vinter: 'Vinter', jul: 'Jul', paske: 'Påske', '17mai': '17. mai' };

/** Første påskedag (gregoriansk, Meeus/Jones/Butcher) som YYYY-MM-DD. */
function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function autoSeason(isoDay = todayKey()) {
  const [y, mo, d] = isoDay.split('-').map(Number);
  const md = mo * 100 + d;
  const today = Date.UTC(y, mo - 1, d);
  const easter = easterSunday(y).getTime();
  if (md >= 510 && md <= 517) return '17mai';
  if (today >= easter - 7 * 86400000 && today <= easter + 86400000) return 'paske';  // palmesøndag - 2. påskedag
  if (mo === 12) return 'jul';
  if (mo === 1 || mo === 2) return 'vinter';
  if (md >= 915 && md <= 1130) return 'host';
  return null;
}

async function readTheme() {
  try {
    const t = JSON.parse(await fs.readFile(THEME_FILE, 'utf-8'));
    if (t.mode === 'off' || t.mode === 'auto' || SEASONS.includes(t.mode)) return t;
  } catch {}
  return { mode: 'auto' };
}

async function currentSeason() {
  const { mode } = await readTheme();
  if (mode === 'off') return null;
  return mode === 'auto' ? autoSeason() : mode;
}

app.get('/api/admin/theme', requireAdmin, async (req, res) => {
  const { mode } = await readTheme();
  const auto = autoSeason();
  res.json({ mode, auto, autoLabel: auto ? SEASON_LABELS[auto] : null, current: await currentSeason(), seasons: SEASON_LABELS });
});

app.post('/api/admin/theme', requireAdmin, async (req, res) => {
  const mode = String(req.body?.mode || '');
  if (!(mode === 'auto' || mode === 'off' || SEASONS.includes(mode))) {
    return res.status(400).json({ error: 'Ukjent tema' });
  }
  await fs.writeFile(THEME_FILE, JSON.stringify({ mode, set: new Date().toISOString() }, null, 2), 'utf-8');
  res.json({ ok: true, mode, current: await currentSeason() });
});

// Henter Bakern-menyen fra bildet i widgeten via AI, uten å lagre noe.
// Admin ser teksten og bildet side om side, og velger selv om den skal brukes.
app.post('/api/admin/bakern/preview', requireAdmin, async (req, res) => {
  try {
    const out = await runPython(['scrape_bakern.py', '--json'], { timeout: 180000 });
    const line = out.split('\n').reverse().find(l => l.startsWith('JSON:'));
    if (!line) throw new Error('Fikk ingen meny tilbake fra scrape_bakern.py');
    const { text, hash } = JSON.parse(line.slice(5));
    const log = out.split('\n').filter(l => !l.startsWith('JSON:')).join('\n').trim();
    res.json({ ok: true, text, hash, image: 'api/admin/bakern/image?t=' + Date.now(), log });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Siste menybilde scrape_bakern.py lastet ned (raw_html/bakern_meny.*)
app.get('/api/admin/bakern/image', requireAdmin, async (req, res) => {
  try {
    const file = (await fs.readdir(RAW_DIR)).find(f => /^bakern_meny\.(png|jpe?g|webp|gif)$/i.test(f));
    if (!file) return res.status(404).json({ error: 'Ingen bilde ennå' });
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(RAW_DIR, file));
  } catch {
    res.status(404).json({ error: 'Ingen bilde ennå' });
  }
});

// ------------------------------------------------------------- forhåndsvis
//
// Kjører skrapingen og bygger til en midlertidig fil, så du ser hva menyen
// VILLE blitt før public/menu.json røres. "Publiser" flytter den på plass.

app.post('/api/admin/preview', requireAdmin, async (req, res) => {
  const log = [];
  try {
    await runScrapers(log);
    log.push(`$ python3 build_menu_json.py --out ${path.basename(PREVIEW_JSON)}`);
    log.push((await runPython(['build_menu_json.py', '--out', PREVIEW_JSON])).trimEnd());

    const next = JSON.parse(await fs.readFile(PREVIEW_JSON, 'utf-8'));
    let current = null;
    try {
      current = JSON.parse(await fs.readFile(MENU_JSON, 'utf-8'));
    } catch {}

    const nextMenu = resolveMenu(next);
    const curItems = Object.fromEntries(resolveMenu(current).places.map(p => [p.id, p.items]));
    const today = nextMenu.day;

    const diff = nextMenu.places.map(p => ({
      id: p.id,
      name: p.name,
      items: p.items,
      changed: JSON.stringify(p.items) !== JSON.stringify(curItems[p.id] || [])
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

// ---------------------------------------------------------------- driftsvarsler
//
// Sjekker hvert 10. minutt på hverdager om noe er galt, og sender ntfy-varsel
// til NTFY_ALERT. Hvert problem varsles én gang per dag, og du får en
// «Løst»-melding når det går over. Tilstanden ligger i alerts.json, så en
// omstart av serveren ikke sender de samme varslene på nytt.

const ALERT_FILE = path.join(__dirname, 'alerts.json');
const HEALTH_EVERY_MS = 10 * 60 * 1000;

function osloClock() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  return { weekday: (d.getDay() + 6) % 7, minutes: d.getHours() * 60 + d.getMinutes() };
}

/** Problemer akkurat nå. Tomt i helgen og utenfor tidsvinduene. */
async function healthProblems() {
  const { weekday, minutes } = osloClock();
  if (weekday > 4) return [];

  let menu;
  try {
    menu = JSON.parse(await fs.readFile(MENU_JSON, 'utf-8'));
  } catch {
    return [{ key: 'menujson', text: 'menu.json mangler eller er ødelagt - forsiden viser ingenting.' }];
  }

  const problems = [];
  const ageMin = Math.round((Date.now() - new Date(menu.generated)) / 60000);

  // Cron bygger menu.json flere ganger i timen om morgenen
  if (minutes >= 7 * 60 && minutes <= 13 * 60 && ageMin > 75) {
    problems.push({ key: 'stale', text: `menu.json er ikke bygget på ${ageMin} min. Kjører cron?` });
  }

  const { places, dailyFresh } = resolveMenu(menu);

  if (minutes >= 9 * 60 && !dailyFresh) {
    problems.push({ key: 'daily', text: 'Dagsmenyen er ikke hentet i dag (scrape_dagens_menu.py har ikke kjørt).' });
  }

  // Skript som feilet sist de kjørte i dag
  const runs = await readRuns();
  for (const s of SCRIPTS) {
    const last = runs.find(r => r.script === s.script);
    if (last && !last.ok && osloDate(last.at) === todayKey()) {
      problems.push({ key: 'fail:' + s.script, text: `${s.label} feilet ${new Date(last.at).toLocaleTimeString('no-NO', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' })}: ${String(last.summary).split('\n').pop().slice(0, 160)}` });
    }
  }

  if (minutes >= 10 * 60) {
    const empty = places.filter(p => p.source === 'none').map(p => p.name);
    if (empty.length) {
      problems.push({ key: 'empty:' + empty.join(','), text: `Ingen meny for: ${empty.join(', ')}. Skriv den inn under Nødmodus i /admin.` });
    }
    // Dagsmenyen er hentet, men fant ikke noe for en lunsjkantine
    const fallback = dailyFresh
      ? places.filter(p => p.source === 'weekly' && !p.weeklySource).map(p => p.name)
      : [];
    if (fallback.length) {
      problems.push({ key: 'fallback:' + fallback.join(','), text: `Fant ikke dagens meny for: ${fallback.join(', ')}. Viser ukesmenyen i stedet.` });
    }
  }
  return problems;
}

async function sendAlert(title, body, tags, priority = 'default') {
  if (NTFY_ALERT === 'off') return;
  try {
    const r = await fetch(`${NTFY_URL}/${encodeURIComponent(NTFY_ALERT)}`, {
      method: 'POST',
      // Title må være ren ASCII - æøå og emoji går i body/tags
      headers: { 'Content-Type': 'text/plain; charset=utf-8', Title: title, Tags: tags, Priority: priority },
      body
    });
    if (!r.ok) throw new Error(`ntfy ${r.status}`);
  } catch (e) {
    console.error('Driftsvarsel feilet:', e.message);
  }
}

async function readAlerts() {
  try {
    const s = JSON.parse(await fs.readFile(ALERT_FILE, 'utf-8'));
    if (s.date === todayKey()) return s;
  } catch {}
  return { date: todayKey(), active: {} };
}

async function runHealthCheck() {
  try {
    const problems = await healthProblems();
    const state = await readAlerts();
    const now = new Set(problems.map(p => p.key));

    for (const p of problems) {
      if (state.active[p.key]) continue;
      await sendAlert('Lunsjmeny: problem', p.text, 'warning', 'high');
      state.active[p.key] = p.text;
    }
    for (const [key, text] of Object.entries(state.active)) {
      if (now.has(key)) continue;
      await sendAlert('Lunsjmeny: OK', 'Løst: ' + text, 'white_check_mark');
      delete state.active[key];
    }
    await fs.writeFile(ALERT_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('Helsesjekk feilet:', e);
  }
}

setTimeout(runHealthCheck, 60 * 1000);   // ett minutt etter oppstart
setInterval(runHealthCheck, HEALTH_EVERY_MS);

app.get('/api/admin/health', requireAdmin, async (req, res) => {
  res.json({ topic: NTFY_ALERT, problems: await healthProblems() });
});

app.post('/api/admin/health/test', requireAdmin, async (req, res) => {
  if (NTFY_ALERT === 'off') return res.status(400).json({ error: 'Varsler er skrudd av (NTFY_ALERT=off)' });
  await sendAlert('Lunsjmeny: testvarsel', 'Testvarsel fra /admin. Varslene kommer hit.', 'bell');
  res.json({ ok: true, topic: NTFY_ALERT });
});

// ---------------------------------------------------------------- pushvarsler
//
// Hver bruker velger klokkeslett og ukedager. Abonnementene ligger i
// push-subs.json, nøklet på en hash av push-adressen - ingen navn eller
// e-post. VAPID-nøklene lages ved første oppstart (vapid.json), eller settes
// med VAPID_PUBLIC / VAPID_PRIVATE i miljøet.

const PUSH_FILE = path.join(__dirname, 'push-subs.json');
const VAPID_FILE = path.join(__dirname, 'vapid.json');
const PUSH_MAX_SUBS = 3000;
const PUSH_WINDOW_MIN = 30;            // sendes innen 30 min etter valgt tid
const DAY_NAMES = {
  no: ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
};
const PUSH_PLACES = ['m', 'fresh4you', 'bakern'];

let pushReady = false;

async function initPushKeys() {
  if (!webpush) return;
  let keys = process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE
    ? { publicKey: process.env.VAPID_PUBLIC, privateKey: process.env.VAPID_PRIVATE }
    : null;
  if (!keys) {
    try {
      keys = JSON.parse(await fs.readFile(VAPID_FILE, 'utf-8'));
    } catch {
      keys = webpush.generateVAPIDKeys();
      await fs.writeFile(VAPID_FILE, JSON.stringify(keys, null, 2), { encoding: 'utf-8', mode: 0o600 });
      console.log('Laget nye VAPID-nøkler i vapid.json');
    }
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:marius.brathen@telenor.no', keys.publicKey, keys.privateKey);
  app.locals.vapidPublic = keys.publicKey;
  pushReady = true;
}
await initPushKeys();

async function readSubs() {
  try {
    return JSON.parse(await fs.readFile(PUSH_FILE, 'utf-8')) || {};
  } catch {
    return {};
  }
}

async function writeSubs(subs) {
  const tmp = PUSH_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(subs, null, 1), 'utf-8');
  await fs.rename(tmp, PUSH_FILE);
}

const subId = endpoint => createHash('sha256').update(String(endpoint)).digest('hex').slice(0, 20);

/** Rettene for et sted i dag, i ønsket språk - samme prioritet som forsiden. */
function pushItems(menu, id, lang, day, dailyFresh) {
  const manual = menu?.manual?.[id]?.items;
  if (manual?.length) return manual;
  if (dailyFresh && !WEEKLY_SOURCE.has(id)) {
    const daily = menu?.todayOverride?.[lang]?.[id]?.items;
    if (daily?.length) return daily;
  }
  const week = menu?.places?.[id]?.week;
  return week?.[lang]?.[day]?.length ? week[lang][day] : (week?.no?.[day] || []);
}

/** Varselets innhold: én linje per sted med første rett. */
async function buildPushPayload(lang, withDinner) {
  let menu;
  try {
    menu = JSON.parse(await fs.readFile(MENU_JSON, 'utf-8'));
  } catch {
    return null;
  }
  const { weekday } = osloClock();
  if (weekday > 4) return null;
  const day = DAY_KEYS[weekday];
  const dailyFresh = osloDate(menu?.dailyUpdated) === todayKey();
  const ids = withDinner ? [...PUSH_PLACES, 'dinner'] : PUSH_PLACES;

  const lines = ids.map(id => {
    const items = pushItems(menu, id, lang, day, dailyFresh);
    if (!items.length) return null;
    const name = menu.places?.[id]?.name || id;
    return `${name}: ${items[0]}` + (items.length > 1 ? ` (+${items.length - 1})` : '');
  }).filter(Boolean);
  if (!lines.length) return null;

  return {
    title: (lang === 'en' ? 'Today\u2019s lunch – ' : 'Dagens lunsj – ') + DAY_NAMES[lang][weekday],
    body: lines.join('\n'),
    url: '/',
    tag: 'lunsj-' + todayKey()
  };
}

const pushHost = sub => { try { return new URL(sub.endpoint).host; } catch { return '?'; } };

// Siste resultat per push-tjeneste, til feilsøking i /admin
const pushLastResult = new Map();

async function sendPush(entry, payload, details = false) {
  const host = pushHost(entry.sub);
  try {
    const r = await webpush.sendNotification(entry.sub, JSON.stringify(payload),
      { TTL: 3 * 3600, urgency: 'normal', timeout: 15000 });
    console.log(`Push sendt til ${host}: ${r.statusCode}`);
    pushLastResult.set(host, { ok: true, status: r.statusCode, at: new Date().toISOString() });
    return details ? { result: 'ok', status: r.statusCode, host } : 'ok';
  } catch (e) {
    // 404/410 = abonnementet finnes ikke lenger (avinstallert, nullstilt nettleser)
    const gone = e.statusCode === 404 || e.statusCode === 410;
    const detail = e.statusCode
      ? `${e.statusCode} ${String(e.body || '').slice(0, 200)}`
      : (e.code || e.message || String(e));
    console.error(`Push til ${host} feilet:`, detail);
    pushLastResult.set(host, { ok: false, status: e.statusCode || null, detail, at: new Date().toISOString() });
    const result = gone ? 'gone' : 'error';
    return details ? { result, status: e.statusCode || null, detail, host } : result;
  }
}

let pushRunning = false;

async function runPushSchedule() {
  if (!pushReady || pushRunning) return;
  pushRunning = true;
  try {
    const { weekday, minutes } = osloClock();
    if (weekday > 4) return;
    const today = todayKey();
    const subs = await readSubs();
    const payloads = {};
    let changed = false;

    for (const [id, entry] of Object.entries(subs)) {
      if (entry.lastSent === today || !entry.days.includes(weekday)) continue;
      const [h, m] = entry.time.split(':').map(Number);
      const at = h * 60 + m;
      if (minutes < at || minutes > at + PUSH_WINDOW_MIN) continue;

      const key = entry.lang + (at >= 13 * 60 ? '+dinner' : '');
      if (!(key in payloads)) payloads[key] = await buildPushPayload(entry.lang, at >= 13 * 60);
      if (!payloads[key]) continue;          // menyen er ikke klar - prøv igjen neste runde

      const result = await sendPush(entry, payloads[key]);
      if (result === 'gone') delete subs[id];
      else if (result === 'ok') entry.lastSent = today;
      changed = true;
    }
    if (changed) await writeSubs(subs);
  } catch (e) {
    console.error('Push-planlegger feilet:', e);
  } finally {
    pushRunning = false;
  }
}

setInterval(runPushSchedule, 30 * 1000);

function validTime(v) {
  const m = /^(\d{2}):(\d{2})$/.exec(v || '');
  return m && +m[1] >= 6 && +m[1] <= 15 && +m[2] < 60 && +m[2] % 5 === 0;
}

app.get('/api/push/key', (req, res) => {
  if (!pushReady) return res.status(503).json({ error: 'Push er ikke skrudd på' });
  res.json({ key: app.locals.vapidPublic });
});

app.post('/api/push/subscribe', async (req, res) => {
  if (!pushReady) return res.status(503).json({ error: 'Push er ikke skrudd på' });
  const sub = req.body?.subscription;
  const endpoint = String(sub?.endpoint || '');
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return res.status(400).json({ error: 'Ugyldig abonnement' });
  }
  const time = String(req.body?.time || '');
  if (!validTime(time)) return res.status(400).json({ error: 'Ugyldig tidspunkt' });
  const days = [...new Set((req.body?.days || []).map(Number))].filter(d => d >= 0 && d <= 4).sort();
  if (!days.length) return res.status(400).json({ error: 'Velg minst én dag' });

  const subs = await readSubs();
  const id = subId(endpoint);
  if (!subs[id] && Object.keys(subs).length >= PUSH_MAX_SUBS) {
    return res.status(429).json({ error: 'For mange abonnenter' });
  }
  subs[id] = {
    sub: { endpoint, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } },
    time,
    days,
    lang: req.body?.lang === 'en' ? 'en' : 'no',
    created: subs[id]?.created || new Date().toISOString(),
    // Ny tid senere i dag skal fortsatt gi varsel i dag
    lastSent: subs[id]?.time === time ? subs[id]?.lastSent : null
  };
  await writeSubs(subs);
  res.json({ ok: true });
});

app.post('/api/push/lookup', async (req, res) => {
  const entry = (await readSubs())[subId(req.body?.endpoint)];
  res.json(entry ? { found: true, time: entry.time, days: entry.days, lang: entry.lang } : { found: false });
});

app.post('/api/push/unsubscribe', async (req, res) => {
  const subs = await readSubs();
  delete subs[subId(req.body?.endpoint)];
  await writeSubs(subs);
  res.json({ ok: true });
});

const pushTestAt = new Map();
app.post('/api/push/test', async (req, res) => {
  if (!pushReady) return res.status(503).json({ error: 'Push er ikke skrudd på' });
  const id = subId(req.body?.endpoint);
  const entry = (await readSubs())[id];
  if (!entry) return res.status(404).json({ error: 'Fant ikke abonnementet - slå på varsel på nytt' });
  if (Date.now() - (pushTestAt.get(id) || 0) < 20000) {
    return res.status(429).json({ error: 'Vent litt før du tester igjen' });
  }
  pushTestAt.set(id, Date.now());
  const lang = req.body?.lang === 'en' ? 'en' : entry.lang;
  const payload = await buildPushPayload(lang, false) || {
    title: lang === 'en' ? 'Lunch menu Fornebu' : 'Lunsjmeny Fornebu',
    body: lang === 'en' ? 'Test notification - it works! 🎉' : 'Testvarsel - det virker! 🎉',
    url: '/', tag: 'lunsj-test'
  };
  const r = await sendPush(entry, payload, true);
  if (r.result === 'gone') {
    const subs = await readSubs();
    delete subs[id];
    await writeSubs(subs);
    return res.status(410).json({ error: 'Abonnementet er utløpt - slå varselet av og på igjen' });
  }
  if (r.result !== 'ok') {
    return res.status(502).json({ error: `Serveren fikk ikke levert til ${r.host}: ${r.detail}` });
  }
  res.json({ ok: true, host: r.host, status: r.status });
});

// Feilsøking: når serveren push-tjenestene abonnentene bruker? Brannmurer
// med SNI-filtrering kan la TCP gå gjennom men henge TLS for enkelte verter.
app.get('/api/admin/push/check', requireAdmin, async (req, res) => {
  const subs = pushReady ? await readSubs() : {};
  const counts = {};
  Object.values(subs).forEach(e => { const h = pushHost(e.sub); counts[h] = (counts[h] || 0) + 1; });
  const hosts = [...new Set(['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com', ...Object.keys(counts)])];

  const checks = await Promise.all(hosts.map(async host => {
    const t0 = Date.now();
    try {
      const ctrl = AbortSignal.timeout(8000);
      const r = await fetch(`https://${host}/`, { method: 'GET', signal: ctrl });
      return { host, ok: true, status: r.status, ms: Date.now() - t0, subs: counts[host] || 0, last: pushLastResult.get(host) || null };
    } catch (e) {
      const why = e.name === 'TimeoutError' ? 'tidsavbrudd etter 8 s' : (e.cause?.code || e.message);
      return { host, ok: false, error: why, ms: Date.now() - t0, subs: counts[host] || 0, last: pushLastResult.get(host) || null };
    }
  }));
  res.json({ pushReady, subs: Object.keys(subs).length, checks });
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
