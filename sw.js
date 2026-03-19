const CACHE_NAME = 'diginot-v11';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/js/main.js',
  '/js/ui.js',
  '/js/game.js',
  '/js/data.js',
  '/js/pixel.js',
  '/js/audio.js',
  '/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Add files one by one so one failure doesn't kill the whole install
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('SW: failed to cache', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
