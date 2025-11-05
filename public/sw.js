// v5 — root-scoped SW, only handles /sengine/scramjet/*
self.$scramjet = {
  config: {
    prefix: "/sengine/scramjet/",
    codec: "$scramjet$encode",
    files: {
      wasm:  "/sengine/scramjet.wasm.wasm",
      worker:"/sw.js",
      client:"/sengine/scramjet.all.js",
      sync:  "/sengine/scramjet.sync.js",
    },
  },
};

importScripts("/sengine/scramjet.all.js");
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const { pathname } = new URL(event.request.url);
  if (!pathname.startsWith(self.$scramjet.config.prefix)) return;   // only proxy prefix
  event.respondWith((async () => {
    try {
      const resp = await sw.fetch(event.request);
      if (resp) return resp;
    } catch (e) {
      console.error("[SW]/sengine fetch error:", e);
    }
    return fetch(event.request);
  })());
});
