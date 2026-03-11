// Service Worker for Fossiq PWA
// Version is updated during build process
const VERSION = "{{VERSION}}";
const CACHE_NAME = `fossiq-v${VERSION}`;

// DuckDB binaries: large, essentially immutable — cache-first
const DUCKDB_PATTERN = /\/(duckdb-[^/]+\.wasm|duckdb-[^/]+\.worker\.js)$/;

// Vite content-hashed assets: safe to cache forever — cache-first
// Matches e.g. /assets/index-CEEKSdb3.js, /assets/index-D9aWs9Jp.css
const HASHED_ASSET_PATTERN = /\/assets\/.+-[A-Za-z0-9]{8}\.(js|css|woff2?)(\.map)?$/;

self.addEventListener("install", (event) => {
  console.log(`[SW] Installing version ${VERSION}`);
  // Skip waiting so the new SW takes over immediately on next navigation
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating version ${VERSION}`);
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          }
          return Promise.resolve();
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  const { pathname } = new URL(event.request.url);

  if (DUCKDB_PATTERN.test(pathname) || HASHED_ASSET_PATTERN.test(pathname)) {
    // Cache-first: serve from cache, fetch+store on miss
    event.respondWith(cacheFirst(event.request));
  } else {
    // Network-first: always try network, fall back to cache if offline
    event.respondWith(networkFirst(event.request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Service unavailable. Please check your connection.", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
