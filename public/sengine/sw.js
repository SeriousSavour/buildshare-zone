self.$scramjet = {
  config: {
    prefix: "/sengine/scramjet/",
    codec: "$scramjet$encode",
    files: {
      wasm: "./scramjet.wasm.wasm",
      worker: "/sengine/sw.js",
      client: "./scramjet.all.js",
      sync: "./scramjet.sync.js",
    },
  },
};

importScripts("./scramjet.all.js");
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith(self.$scramjet.config.prefix)) return;

  event.respondWith((async () => {
    try {
      const resp = await sw.fetch(event.request);
      if (resp) return resp;
    } catch (err) {
      console.error("[SW]/sengine fetch error:", err);
    }
    return fetch(event.request);
  })());
});
