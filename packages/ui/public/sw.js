// Service Worker for Fossiq PWA
// Version is updated during build process
const VERSION = "{{VERSION}}";
const CACHE_NAME = `fossiq-v${VERSION}`;

// Assets to cache - includes all static files
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.svg",
  "/icon-512.svg",
  "/icon-1024.svg",
  "/icon-maskable.svg",
];

// Install event - cache assets
self.addEventListener("install", (event) => {
  console.log(`[SW] Installing version ${VERSION}`);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[SW] Caching ${ASSETS_TO_CACHE.length} assets`);
      return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
        console.error("[SW] Failed to cache some assets:", error);
        // Don't fail the install if some assets can't be cached
        return Promise.resolve();
      });
    })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating version ${VERSION}`);

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          const keepCache = cacheName === CACHE_NAME;
          if (!keepCache) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );

      await self.clients.claim();
    })()
  );
});

// Fetch event - serve from cache, fallback to network with cache update
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Cache hit - return cached response
      if (cachedResponse) {
        // Also fetch in background to update cache for next time
        fetchAndUpdateCache(event.request);
        return cachedResponse;
      }

      // Cache miss - fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type === "error"
          ) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.error("[SW] Fetch failed:", error);
          // Return a fallback if both cache and network fail
          return new Response(
            "Service unavailable. Please check your connection.",
            { status: 503, statusText: "Service Unavailable" }
          );
        });
    })
  );
});

// Helper function to fetch and update cache in background
function fetchAndUpdateCache(request) {
  fetch(request)
    .then((response) => {
      if (!response || response.status !== 200 || response.type === "error") {
        return;
      }

      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, response);
      });
    })
    .catch((error) => {
      console.error("[SW] Background fetch failed:", error);
    });
}

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
