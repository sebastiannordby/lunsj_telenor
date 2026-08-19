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
