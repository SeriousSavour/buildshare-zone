// public/sengine/sw.js
// v1 — self-hosted prefix-only SW

// Configure BEFORE importing the client
self.$scramjet = {
  config: {
    // 👇 this is the path your iframe will use
    prefix: "/sengine/scramjet/",
    codec: "$scramjet$encode",
    files: {
      // all relative to THIS file so we can serve from /sengine/
      wasm: "./scramjet.wasm.wasm",
      worker: "/sengine/sw.js",
      client: "./scramjet.all.js",
      sync: "./scramjet.sync.js",
    },
  },
};

// Load the client bundle (self-hosted)
importScripts("./scramjet.all.js");

// Create worker instance from the bundle
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

// Basic lifecycle
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Only handle the proxied path
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Let the browser handle everything except the /sengine/scramjet/* prefix
  if (!url.pathname.startsWith(self.$scramjet.config.prefix)) return;

  event.respondWith(
    (async () => {
      try {
        const resp = await sw.fetch(req);
        if (resp) return resp;
      } catch (err) {
        console.error("[SW]/sengine fetch error:", err);
      }
      return fetch(req);
    })()
  );
});
