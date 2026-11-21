const CACHE = "stockwise-shell-v4";
const APP_PATHS = ["/", "/login", "/signup", "/dashboard", "/products", "/sell", "/sales", "/team", "/manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_PATHS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("stockwise-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match(url.pathname)) || caches.match("/")));
    return;
  }

  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) {
    const cacheKey = new Request(`${url.origin}${url.pathname}?__stockwise_rsc=1`);
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(cacheKey, response.clone()));
      return response;
    }).catch(async () => await caches.match(cacheKey)));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    })));
  }
});
