// sw.js - service worker: pushvarsler og offline-visning.
//
// Offline: forsiden og det den trenger (skript, stil, font, kart og menu.json)
// hentes alltid fra nettet først. Bare hvis nettet feiler, brukes siste
// kopi fra cachen - så menyen aldri blir liggende gammel når man er på nett.
//
// Bare disse få adressene går gjennom service workeren. Alt annet (API,
// bilder, admin) håndteres av nettleseren som før: å fange hver eneste
// request ga tidligere tregere/feilende innlasting i Edge bak bedriftsproxy.

const CACHE = 'lunsj-offline-v1';
const SHELL = ['/', '/app.js', '/styles.css', '/fonts/fonts.css', '/fonts/figtree-latin-wght-normal.woff2',
  '/fonts/figtree-latin-ext-wght-normal.woff2', '/menu.json', '/fornebu-kart.png', '/manifest.json',
  '/android-chrome-192x192.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  // Forhåndslagre det vi får til; resten lagres når siden brukes
  event.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

function shellKey(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.method !== 'GET') return null;
  if (request.mode === 'navigate') return url.pathname === '/' || url.pathname === '/index.html' ? '/' : null;
  return SHELL.includes(url.pathname) ? url.pathname : null;
}

self.addEventListener('fetch', event => {
  const key = shellKey(event.request);
  if (!key) return; // ikke vårt - nettleseren tar det
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(event.request);
      if (res.ok) cache.put(key, res.clone());
      return res;
    } catch (e) {
      const hit = await cache.match(key);
      if (!hit) throw e;
      if (key !== '/menu.json') return hit;
      // Merk menyen så siden kan vise «frakoblet - lagret meny»
      const headers = new Headers(hit.headers);
      headers.set('X-Lunsj-Offline', '1');
      return new Response(await hit.blob(), { status: 200, headers });
    }
  })());
});

// Daglig menyvarsel (Web Push). Serveren sender { title, body, url, tag }.
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(self.registration.showNotification(data.title || 'Lunsjmeny Fornebu', {
    body: data.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    tag: data.tag || 'lunsj',
    data: { url: data.url || '/' }
  }));
});

// Trykk på varselet: gå til en åpen fane med siden, ellers åpne en ny
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = wins.find(w => w.url.startsWith(self.location.origin));
    if (open) return open.focus();
    return self.clients.openWindow(url);
  })());
});
