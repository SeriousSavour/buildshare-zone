// public/sw.js

// 1) Configure BEFORE importing the library
self.$scramjet = {
  config: {
    prefix: "/service/",
    codec: "$scramjet$encode",
    files: {
      wasm: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.wasm.wasm",
      worker: "/sw.js",
      client: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js",
      sync: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.sync.js",
    },
  },
};

// 2) Load the bundle AFTER config
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

// 3) Lifecycle: take over asap
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Allow page to postMessage({type:'claim'}) to force control immediately
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "claim") {
    self.clients.claim();
    if (event.source) {
      try { event.source.postMessage({ type: "claimed" }); } catch {}
    }
  }
  if (data.type === "skipWaiting") {
    self.skipWaiting();
  }
});

// 4) Fetch: let Scramjet handle /service/* or whatever it opts into
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  event.respondWith((async () => {
    // Only bother routing things that are under our prefix OR that the worker accepts
    const isProxyPath = url.pathname.startsWith(self.$scramjet.config.prefix);
    try {
      const shouldRoute = isProxyPath || sw.route(req);
      if (shouldRoute) {
        const resp = await sw.fetch(req);
        if (resp) return resp;
      }
    } catch (err) {
      // Don't kill the SW on errors
      console.error("[SW] route/fetch error:", err);
    }
    // Fallback: regular network
    return fetch(req);
  })());
});
