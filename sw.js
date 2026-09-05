const CACHE_NAME = "anijaz-cache-v1";
const ASSETS_TO_CACHE = [
  "index.html",
  "catalogo.html",
  "detalle.html",
  "favoritos.html",
  "contacto.html",
  "css/styles.css",
  "img/offline.png",
  "js/fetchs/animeFetch.js",
  "js/mapeos/animeMapper.js",
  "js/metodos/animeFilter.js",
  "js/metodos/animeStorage.js",
  "js/metodos/animeText.js",
  "js/services/animeService.js",
  "/js/prueba.js",
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
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {

            const url = new URL(event.request.url);
            const pathSinQuery = url.pathname.replace(/^\//, ''); 

            return caches.match(pathSinQuery || 'index.html')
              .then((pageResponse) => {
                return pageResponse || caches.match('./index.html');
              });
          }

          return new Response("Recurso no disponible offline", {
            status: 503,
            statusText: "Service Unavailable"
          });
        });
    })
  );
});