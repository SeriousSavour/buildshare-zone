// public/sw.js

// 1) Configure BEFORE importing the bundle
self.$scramjet = {
  config: {
    prefix: "/service/",
    codec: "$scramjet$encode",
    files: {
      wasm: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.wasm.wasm",
      worker: "/sw.js",
      client: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js",
      sync: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.sync.js"
    }
  }
};

// 2) Load after config
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

// 3) Take control ASAP
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "claim") self.clients.claim();
  if (data.type === "skipWaiting") self.skipWaiting();
});

// 4) Route /service/* to Scramjet, else pass through
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  event.respondWith((async () => {
    try {
      const isProxyPath = url.pathname.startsWith(self.$scramjet.config.prefix);
      const shouldRoute = isProxyPath || sw.route(req);
      if (shouldRoute) {
        const resp = await sw.fetch(req);
        if (resp) return resp;
      }
    } catch (err) {
      // don't crash the SW
      console.error("[SW] error:", err);
    }
    return fetch(req);
  })());
});
