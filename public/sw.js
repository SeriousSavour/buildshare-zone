// public/sw.js

// ─────────────────────────────────────────────────────────────────────────────
// 1) CONFIGURE FIRST (before importing the worker library!)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// 2) LOAD THE SCRAMJET WORKER BUNDLE
// ─────────────────────────────────────────────────────────────────────────────
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");

// Create worker instance
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

// ─────────────────────────────────────────────────────────────────────────────
// 3) LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  // Take control ASAP
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ─────────────────────────────────────────────────────────────────────────────
// 4) FETCH HANDLER
// ─────────────────────────────────────────────────────────────────────────────
// Keep it simple: ask Scramjet if it wants the request. If yes → let it handle.
// Do NOT pass the event object to sw.route/fetch — pass the Request.
// Avoid custom manual proxying here; let Scramjet own the /service/* space.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  const handle = async () => {
    // Only try to route requests that fall under our prefix OR that the worker
    // says it can handle (some libs can decide on their own).
    const isProxyPath = url.pathname.startsWith(self.$scramjet.config.prefix);

    try {
      const shouldRoute = isProxyPath || sw.route(req);
      if (shouldRoute) {
        const resp = await sw.fetch(req);
        if (resp) return resp;
      }
    } catch (err) {
      // Fall through to network on errors; do not crash SW
      console.error('SW fetch error:', err);
    }

    // Default: network passthrough
    return fetch(req);
  };

  event.respondWith(handle());
});
