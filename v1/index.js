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

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MENU_JSON = path.join(__dirname, 'public', 'menu.json');
const STATE_FILE = path.join(__dirname, 'state.json');

// ntfy-topics — sett som miljøvariabler i produksjon
const NTFY_UP = process.env.NTFY_UP || 'mb-lunsjfbu-lunsjmeny-fornebu-bra';
const NTFY_DOWN = process.env.NTFY_DOWN || 'mb-lunsjfbu-lunsjmeny-fornebu-darlig';
const NTFY_TEXT = process.env.NTFY_TEXT || 'mb-lunsjfbu-lunsjmeny-fornebu-tekst';

const VOTE_PLACES = new Set(['street', 'm', 'fresh4you']);

app.use(express.json({ limit: '8kb' }));

// ---------------------------------------------------------------- cache
//
// index.html caches aldri, og app.js/styles.css får en ?v= som følger filenes
// endringstidspunkt. Da henter nettleseren nye filer så snart du deployer,
// uten at noen må tømme cache — og uten at du bumper versjonsnummer manuelt.

const PUBLIC_DIR = path.join(__dirname, 'public');

async function assetStamp() {
  const files = ['app.js', 'styles.css', 'fornebu-kart.png'];
  const stamps = await Promise.all(files.map(async f => {
    try {
      return (await fs.stat(path.join(PUBLIC_DIR, f))).mtimeMs;
    } catch {
      return 0;
    }
  }));
  return Math.max(...stamps).toString(36);
}

async function sendIndex(res) {
  const [html, v] = await Promise.all([
    fs.readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf-8'),
    assetStamp()
  ]);
  res.set('Cache-Control', 'no-cache, must-revalidate');
  res.type('text/html; charset=utf-8').send(
    html
      .replace('href="/styles.css"', `href="/styles.css?v=${v}"`)
      .replace('src="/app.js"', `src="/app.js?v=${v}"`)
  );
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

// Norsk lokaltid, ikke UTC — ellers nullstilles stemmene kl. 02 om natten
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

  // HTTP-headere må være ren ASCII — emoji sendes derfor som ntfy-tags,
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
// OLD SITE  —  den gamle siden, bevart på /old i betaperioden
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
  const script = day === '-1' ? 'lunsj_les_dagens.py' : 'lunsj_les_ukesmeny.py';
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

app.get('/gjovik', async (req, res) => {
  try {
    const out = await runPython(['lunsj_gjovik.py']);
    res.type('text/html; charset=utf-8').send(`<!DOCTYPE html>
<html lang="no"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lunsjmeny Gjøvik</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f5ead8; color: #201e1d;
         display: grid; place-items: center; min-height: 100vh; margin: 0; }
  .app { background: #fff; border-radius: 16px; padding: 2rem; margin: 1rem;
         max-width: 480px; box-shadow: 0 8px 30px rgba(7,4,82,.12); }
  h1 { margin-top: 0; }
  p { white-space: break-spaces; }
</style></head>
<body><div class="app"><h1>LUNSJMENY GJØVIK</h1><p>${out}</p></div></body></html>`);
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
      // Versjonerte filer kan caches lenge — ?v= endres når filen endres
      res.set('Cache-Control', 'public, max-age=604800');
    }
  }
}));

app.listen(port, () => console.log(`LunsjApp kjører på port: ${port}!`));
