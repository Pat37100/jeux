/* Cache simple : l'appli se charge même sans réseau (voiture, montagne).
   Stratégie « réseau d'abord, cache en secours » pour recevoir les mises à jour
   sans jamais bloquer l'ouverture hors ligne. */
var CACHE = 'jeux-famille-v97';
var FILES = ['./', './index.html', './manifest.webmanifest',
             './icon-180.png', './icon-512.png', './icon-1024.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).catch(function () {}));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  /* Le « réseau d'abord » ne suffisait pas : fetch() pouvait être servi par le
     cache HTTP du navigateur (GitHub Pages envoie un max-age), si bien qu'une
     nouvelle version pouvait rester invisible pendant des heures sur iOS.
     Pour le document et le script, on contourne explicitement ce cache. */
  var url = e.request.url || '';
  var isDoc = e.request.mode === 'navigate' ||
              /\/(index\.html)?(\?.*)?$/.test(url) ||
              /manifest\.webmanifest$/.test(url);
  var go = isDoc ? fetch(e.request, { cache: 'no-store' }) : fetch(e.request);
  e.respondWith(
    go.then(function (res) {
      /* On ne met en cache que les URL nues : les requêtes avec paramètres
         (?r=… du rechargement franc) créeraient une entrée par visite. */
      if (url.indexOf('?') < 0) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) { return hit || caches.match('./index.html'); });
    })
  );
});
