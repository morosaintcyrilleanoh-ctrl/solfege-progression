/*
 * Service worker de Solfège Progression : garde les laboratoires utilisables
 * hors connexion. Seules les pages PUBLIQUES et les fichiers statiques sont
 * mis en cache ; les espaces connectés, cours, fichiers privés et appels
 * d'authentification ne le sont jamais.
 */
const VERSION = 'sp-v1';
const PUBLIC_PAGES = ['/', '/laboratoires', '/laboratoires/lecture-des-notes', '/laboratoires/lecture-des-notes/historique', '/laboratoires/rythme', '/laboratoires/tonalites', '/laboratoires/intervalles', '/tableau-de-bord', '/test-de-positionnement'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => Promise.allSettled([...PUBLIC_PAGES, '/fonts/bravura.woff2'].map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isPublicPage(url) {
  return PUBLIC_PAGES.includes(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Fichiers statiques versionnés : le cache d'abord.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  // Pages publiques : le réseau d'abord, le cache si la connexion manque.
  if (req.mode === 'navigate' && isPublicPage(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put(url.pathname, res.clone()));
          return res;
        })
        .catch(() => caches.match(url.pathname).then((hit) => hit || caches.match('/laboratoires'))),
    );
  }
  // Tout le reste (espaces connectés, API, authentification) : jamais mis en cache.
});
