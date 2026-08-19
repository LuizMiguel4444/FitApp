// Service worker do "Prato do Dia".
// Só entra em ação se o app for aberto via http(s) (ex: hospedado no GitHub Pages).
// Ao abrir o index.html direto do celular (file://), o navegador ignora isso
// automaticamente — o app funciona normalmente do mesmo jeito, via localStorage.

const CACHE = "prato-do-dia-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./foods.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
