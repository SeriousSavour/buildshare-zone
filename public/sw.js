importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();

// Configure BEFORE creating instance
self.$scramjet = self.$scramjet || {};
self.$scramjet.config = {
  prefix: "/service/",
  codec: "$scramjet$encode",
  files: {
    wasm: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.wasm.wasm",
    worker: "/sw.js",
    client: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js",
    sync: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.sync.js"
  }
};

const sw = new ScramjetServiceWorker();

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

// Track if we've initialized
let configLoaded = false;

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const url = new URL(event.request.url);
      const pathname = url.pathname;
      
      // Log EVERY fetch to debug
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔴 SW FETCH:', pathname);
      console.log('📝 Full URL:', url.href);
      console.log('📝 Origin:', url.origin);
      console.log('📝 Request mode:', event.request.mode);
      console.log('📝 Request dest:', event.request.destination);
      
      // Check if URL should be proxied by Scramjet
      if (pathname.startsWith('/service/')) {
        console.log('✅ MATCHES /service/ PREFIX!');
        
        try {
          // Load config once
          if (!configLoaded) {
            console.log('⏳ Loading Scramjet config...');
            await sw.loadConfig();
            configLoaded = true;
            console.log('✅ Config loaded, prefix:', sw.config?.prefix);
          }
          
          // Check if Scramjet will route it
          const shouldRoute = sw.route(event);
          console.log('📝 sw.route() returned:', shouldRoute);
          console.log('📝 sw.config.prefix:', sw.config?.prefix);
          
          if (shouldRoute) {
            console.log('🎯 Proxying through Scramjet...');
            const response = await sw.fetch(event);
            console.log('✅ Proxy response:', response.status, response.statusText);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return response;
          } else {
            console.log('❌ sw.route() returned false despite /service/ match!');
            console.log('❌ This is unexpected - Scramjet should handle this');
          }
        } catch (error) {
          console.error('❌ Scramjet error:', error);
          console.error('❌ Error stack:', error.stack);
        }
      } else {
        console.log('⏩ Not /service/ - passthrough');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return fetch(event.request);
    })()
  );
});
