// public/sw.js
// 1) Configure BEFORE importing
self.$scramjet = {
  config: {
    prefix: "/s/",              // 👈 changed
    codec: "$scramjet$encode",
    files: {
      wasm: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.wasm.wasm",
      worker: "/sw.js",
      client: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js",
      sync: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.sync.js"
    }
  }
};

// 2) Load bundle AFTER config
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

// 3) Take control ASAP
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Optional messages from page
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "claim") self.clients.claim();
  if (d.type === "skipWaiting") self.skipWaiting();
});

// 4) Route proxy path; otherwise passthrough
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  event.respondWith((async () => {
    try {
      const isProxy = url.pathname.startsWith(self.$scramjet.config.prefix);
      let shouldRoute = false;
      try {
        shouldRoute = isProxy || (sw && typeof sw.route === "function" && sw.route(req));
      } catch (e) {
        console.warn("[SW] route() failed", e);
      }
      if (shouldRoute) {
        try {
          const resp = await sw.fetch(req);
          if (resp) return resp;
        } catch (e) {
          console.error("[SW] fetch() failed", e);
        }
      }
    } catch (err) {
      console.error("[SW] route/fetch error:", err);
    }
    return fetch(req);
  })());
});
