// Service Worker for Offline Support
const CACHE_NAME = 'wis-ai-v3'; // Increment version to force cache clear
const urlsToCache = [
  // Don't pre-cache anything - fetch everything fresh during development
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first for HTML, cache for assets
self.addEventListener('fetch', (event) => {
  // Skip caching for non-GET requests (POST, PUT, DELETE, etc.)
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip WebSocket connections
  if (event.request.url.includes('/ws')) {
    return;
  }

  // DEVELOPMENT MODE: Network-first for EVERYTHING (no aggressive caching)
  // This ensures you always get fresh content
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache during development - always use network
        return response;
      })
      .catch((error) => {
        console.log('Service Worker: Network failed, trying cache for', event.request.url);
        // Only use cache as fallback when completely offline
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // No cache available - return a meaningful error response
            return new Response('Offline - content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});
