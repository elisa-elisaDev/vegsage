/**
 * VegSage Service Worker
 * Cache-first for static assets only (icons, manifest).
 * All HTML navigations and API requests pass through to the network — no fallbacks.
 */

const CACHE_NAME = "vegsage-v2";
const STATIC_ASSETS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

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
  // No self.clients.claim() — avoids taking control of tabs mid-session
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept HTML navigations (pages, payment flows, auth)
  if (request.mode === "navigate") return;

  // Never intercept API routes
  if (url.pathname.startsWith("/api/")) return;

  // Pass-through for Next.js internal assets
  if (url.pathname.startsWith("/_next/")) return;

  // Cache-first for static assets only (manifest, icons)
  if (
    url.pathname === "/manifest.json" ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request))
    );
    return;
  }

  // Everything else: pass through to network, no interference
});
