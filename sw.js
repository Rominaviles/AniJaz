const CACHE_NAME = "anijaz-cache-v1";
const ASSETS_TO_CACHE = [
  "/index.html",
  "/catalogo.html",
  "/detalle.html",
  "/favoritos.html",
  "/contacto.html",
  "/CSS/styles.css",
  "/js/metodos/animestorage.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("kitsu.io") || event.request.url.includes("translated.net")) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});