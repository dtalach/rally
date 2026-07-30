/**
 * Service worker: make the app launch instantly from the home screen.
 *
 * The one rule that matters here is that **API responses are never cached**.
 * This is a money app; a stale portfolio or a stale price served from disk
 * would be worse than an error. Only the shell — HTML, JS, CSS, fonts, icons —
 * is cached, which is what makes a cold launch feel native instead of showing
 * a white page while 300 kB downloads again.
 */
const CACHE = "rally-shell-v1";

self.addEventListener("install", (event) => {
  // The shell is cached lazily on first use; nothing to precache by hand,
  // which avoids hard-coding Vite's content-hashed filenames.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Anything that changes state, or any API read, goes straight to the network.
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) return;
  if (url.origin !== self.location.origin) return;

  // Navigations: try the network so a deploy is picked up, fall back to the
  // cached shell when offline or slow.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put("/index.html", fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match("/index.html");
          return cached ?? Response.error();
        }
      })()
    );
    return;
  }

  // Static assets are content-hashed, so cache-first is safe and instant.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        return Response.error();
      }
    })()
  );
});
