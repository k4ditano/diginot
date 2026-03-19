// DigiNot — Service Worker
// Network-first strategy: always fetch fresh, fall back to cache only if offline

const CACHE_NAME = 'diginot-v11';

self.addEventListener('install', () => {
  // Don't cache on install — just activate immediately
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
  // Network-first: try to get from network, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses for offline use
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(e.request);
      })
  );
});
