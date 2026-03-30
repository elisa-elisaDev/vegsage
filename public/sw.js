/**
 * VegSage Service Worker
 * Minimal PWA service worker: cache-first for static assets, network-first for API.
 */

const CACHE_NAME = "vegsage-v1";
const STATIC_ASSETS = ["/", "/dashboard", "/login", "/signup", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API routes
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "Offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Pass-through for Next.js static assets — already immutable via Cache-Control
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first for app shell (HTML pages, manifest, icons)
  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request))
  );
});
