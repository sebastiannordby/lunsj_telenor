// sw.js - minimal service worker.
//
// Finnes bare for at nettleseren skal tilby "Legg til på Hjem-skjerm".
// Den cacher ingenting med vilje: all trafikk går rett til nettverket, slik at
// menyoppdateringer aldri blir liggende igjen i en gammel cache.
//
// Merk: fetch-handleren er tom med vilje. Kaller vi respondWith(fetch(...)) må
// hver eneste request vente på at service worker-tråden våkner, og enhver
// nettverksfeil blir en hard feil i stedet for at nettleseren håndterer den
// selv - det ga tregere/feilende innlasting i Edge bak bedriftsproxy.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {});

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
