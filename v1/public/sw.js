// sw.js — minimal service worker.
//
// Finnes bare for at nettleseren skal tilby "Legg til på Hjem-skjerm".
// Den cacher ingenting med vilje: all trafikk går rett til nettverket, slik at
// menyoppdateringer aldri blir liggende igjen i en gammel cache.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
