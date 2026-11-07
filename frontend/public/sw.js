const CACHE_NAME = 'startup-scraper-pro-v1';

// Assets to cache on install (shell of the app)
const STATIC_ASSETS = [
  '/',
  '/incubator',
  '/sources',
  '/settings',
  '/manifest.json',
  '/logo.png',
  '/bg-hero.png',
];

// Install: cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-critical, continue even if some assets fail
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Cache-first for shell, network-first for API, fallback gracefully
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // Skip external APIs (Reddit, HN, Gemini) — let them fail naturally with try/catch in app
  const externalHosts = [
    'reddit.com', 'www.reddit.com',
    'hn.algolia.com',
    'generativelanguage.googleapis.com',
    'producthunt.com',
  ];
  if (externalHosts.some((h) => url.hostname.includes(h))) {
    // Just fetch, no caching — app already handles failures gracefully
    return;
  }

  // For same-origin requests: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached); // On network failure, return cached

      return cached || networkFetch;
    })
  );
});
