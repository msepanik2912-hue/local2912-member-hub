const PREFIX = `local2912:${self.registration.scope}:`;
const CACHE = `${PREFIX}0.9.0`;
const CORE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/config.js",
  "./js/feed-utils.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./data/board.json",
  "./data/resources.json",
  "./data/events.json",
  "./data/stewards.json",
  "./data/announcements.json",
  "./data/cba_corpus.json",
  "./data/personnel_corpus.json",
  "./data/source_manifest.json",
  "./data/source_archive.json",
  "./data/supplements_corpus.json",
  "./data/retrieval_hints.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  // Wait until existing app windows close before activating this release.
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      const coreUrls = CORE.map(p => new URL(p, self.registration.scope).href);
      if (cached && coreUrls.includes(event.request.url)) return cached;
      return fetch(event.request).then(async response => {
      const clone = response.clone();
      if (response.ok && response.type !== 'opaque') await cache.put(event.request, clone);
      return response;
    }).catch(async () => {
      if (cached) return cached;
      if (event.request.mode === "navigate") return cache.match(new URL('./index.html', self.registration.scope).href);
      return new Response("This resource is not available offline yet.", {status: 503, headers: {"Content-Type": "text/plain; charset=utf-8"}});
    }); })
  );
});
