// E.D.I.T.H. Tactical AI Service Worker v2.0.3
const CACHE_NAME = 'edith-tactical-v2.0.3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/hud.css',
  './js/audio.js',
  './js/speech.js',
  './js/ai-service.js',
  './js/vision-scanner.js',
  './js/tools.js',
  './js/app.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './favicon.ico'
];

// Install: Cache assets immediately and skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[EDITH SW v2.0.0] Installation et mise en cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: Delete all previous caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[EDITH SW] Purge ancien cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: NETWORK-FIRST for HTML & Scripts, Cache as offline fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept external AI APIs
  if (url.origin.includes('googleapis.com') || 
      url.origin.includes('groq.com') || 
      url.origin.includes('openai.com')) {
    return;
  }

  // Network-First strategy
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request);
      })
  );
});
