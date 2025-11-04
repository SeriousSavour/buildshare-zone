importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

// Configure with explicit config
self.$scramjet = self.$scramjet || {};
self.$scramjet.config = {
  prefix: "/service/",
  files: {
    wasm: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.wasm.wasm",
    worker: "/sw.js",
    client: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js",
    sync: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.sync.js"
  },
  defaultFlags: [],
};

// Install immediately
self.addEventListener('install', (event) => {
  console.log('🔧 SW installing');
  self.skipWaiting();
});

// Activate and take control immediately
self.addEventListener('activate', (event) => {
  console.log('🔧 SW activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", async (event) => {
  const url = new URL(event.request.url);
  
  event.respondWith((async () => {
    // Load config
    await sw.loadConfig();
    
    // Check if this URL should be proxied
    if (sw.route(event)) {
      console.log('✅ Proxying:', url.pathname);
      return await sw.fetch(event);
    }
    
    // Passthrough for non-proxy requests
    return fetch(event.request);
  })());
});
