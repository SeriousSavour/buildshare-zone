// public/sw.js
// v4 — prefix-only SW, no sw.route()

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

importScripts(
  "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js"
);
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "claim") self.clients.claim();
  if (d.type === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (!url.pathname.startsWith(self.$scramjet.config.prefix)) {
    // Let the browser handle it
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Let Scramjet fetch proxied content
        const resp = await sw.fetch(req);
        if (resp) return resp;
      } catch (e) {
        console.error("[SW]/s/* fetch error:", e);
      }
      // Fallback (should be rare)
      return fetch(req);
    })()
  );
});
