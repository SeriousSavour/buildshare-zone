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

console.log('🔧 Service Worker script loaded');
console.log('🔧 Scramjet prefix configured as:', self.$scramjet.config.prefix);

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

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const pathname = url.pathname;
  const fullUrl = event.request.url;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔴 SW FETCH EVENT');
  console.log('📝 Full URL:', fullUrl);
  console.log('📝 Pathname:', pathname);
  console.log('📝 Starts with /service/?', pathname.startsWith('/service/'));
  console.log('📝 Request mode:', event.request.mode);
  console.log('📝 Request destination:', event.request.destination);
  
  event.respondWith((async () => {
    try {
      // Load config
      await sw.loadConfig();
      console.log('📝 SW config loaded, prefix:', sw.config?.prefix);
      
      // Check if this URL should be proxied
      const shouldRoute = sw.route(event);
      console.log('📝 sw.route() returned:', shouldRoute);
      
      if (shouldRoute) {
        console.log('✅ Scramjet WILL proxy this request');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const response = await sw.fetch(event);
        console.log('✅ Scramjet proxy response:', response.status, response.statusText);
        return response;
      }
      
      console.log('⏩ Passthrough (not proxied)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return fetch(event.request);
    } catch (error) {
      console.error('❌ SW Error:', error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return fetch(event.request);
    }
  })());
});
