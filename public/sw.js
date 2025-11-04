// public/sw.js
self.$scramjet = {
  config: {
    prefix: "/s/",
    codec: "$scramjet$encode",
    files: {
      wasm: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.wasm.wasm",
      worker: "/sw.js",
      client: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js",
      sync: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.sync.js"
    }
  }
};

importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("message", e => {
  const d = e.data || {};
  if (d.type === "claim") self.clients.claim();
  if (d.type === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  event.respondWith((async () => {
    const isProxy = url.pathname.startsWith(self.$scramjet.config.prefix);
    let shouldRoute = isProxy;
    if (!shouldRoute) {
      try { shouldRoute = !!(sw && sw.route && sw.route(req)); }
      catch (e) { console.warn("[SW] route() error:", e); }
    }
    if (shouldRoute) {
      try {
        const resp = await sw.fetch(req);
        if (resp) return resp;
      } catch (e) {
        console.error("[SW] fetch() error:", e);
      }
    }
    return fetch(req);
  })());
});
