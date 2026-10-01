const BUILD_HASH = "__BUILD_HASH__";
const STATIC_CACHE = `casedex-static-${BUILD_HASH}`;
const DATA_CACHE = `casedex-data-${BUILD_HASH}`;
// Pages the user has opened, so they can be reopened offline (read-only).
// Cleared with DATA_CACHE when the signed-in user changes (pwa/offline-cache.ts).
const PAGES_CACHE = `casedex-pages-${BUILD_HASH}`;

const STATIC_ASSETS = ["/", "/offline.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, DATA_CACHE, PAGES_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  if (url.pathname.startsWith("/api/v1/")) {
    event.respondWith(networkThenCache(request, DATA_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }

  // Next.js client-side navigation payloads: fresh when online, last copy offline.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) {
    event.respondWith(networkThenCache(request, PAGES_CACHE));
    return;
  }

  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }
  const title = payload?.title ?? "CaseDex";
  const body = payload?.body ?? "You have a new notification.";
  const url = payload?.url ?? "/notifications";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url ?? "/notifications";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client && client.url.includes(self.location.origin)) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (!response || !response.ok) {
    return response;
  }
  const cache = await caches.open(STATIC_CACHE);
  cache.put(request, response.clone());
  return response;
}

async function networkThenCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (!response || !response.ok) {
      return response;
    }
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    // Redirected responses can't be replayed for a navigation, so skip them.
    if (response && response.ok && response.type === "basic" && !response.redirected) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(PAGES_CACHE);
    const cached =
      (await cache.match(request, { ignoreVary: true })) ||
      (await cache.match(request, { ignoreVary: true, ignoreSearch: true }));
    if (cached) {
      return cached;
    }
    return (await caches.match("/offline.html")) || Response.error();
  }
}
