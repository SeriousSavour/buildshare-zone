// v5 — root-scoped SW that only handles /sengine/scramjet/*
self.$scramjet = {
  config: {
    prefix: "/sengine/scramjet/",
    codec: "$scramjet$encode",
    files: {
      // these paths are now absolute from the site root
      wasm: "/sengine/scramjet.wasm.wasm",
      worker: "/sw.js",
      client: "/sengine/scramjet.all.js",
      sync: "/sengine/scramjet.sync.js",
    },
  },
};

importScripts("/sengine/scramjet.all.js");
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Only intercept the proxy prefix. Everything else: network.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const { pathname } = new URL(req.url);

  if (!pathname.startsWith(self.$scramjet.config.prefix)) return;

  event.respondWith((async () => {
    try {
      const resp = await sw.fetch(req);
      if (resp) return resp;
    } catch (e) {
      console.error("[SW]/sengine fetch error:", e);
    }
    return fetch(req);
  })());
});
