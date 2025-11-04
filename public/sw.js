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

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const url = new URL(event.request.url);
      const pathname = url.pathname;
      
      // Log EVERY fetch to debug
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔴 SW FETCH:', pathname);
      console.log('📝 Full URL:', url.href);
      
      // Check if URL should be proxied by Scramjet
      if (pathname.startsWith('/service/')) {
        console.log('✅ MATCHES /service/ PREFIX!');
        
        try {
          // CRITICAL: Set config BEFORE loadConfig to prevent override
          sw.config = {
            prefix: "/service/",
            codec: "$scramjet$encode",
            files: self.$scramjet.config.files
          };
          
          console.log('📝 Forcing config prefix to:', sw.config.prefix);
          
          await sw.loadConfig();
          
          console.log('📝 After loadConfig, prefix is:', sw.config?.prefix);
          
          // Check if Scramjet will route it
          const shouldRoute = sw.route(event);
          console.log('📝 sw.route() returned:', shouldRoute);
          
          if (shouldRoute) {
            console.log('🎯 Proxying through Scramjet...');
            const response = await sw.fetch(event);
            console.log('✅ Proxy response:', response.status, response.statusText);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return response;
          } else {
            console.log('❌ sw.route() returned false!');
            console.log('❌ Config prefix:', sw.config?.prefix);
            console.log('❌ URL pathname:', pathname);
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
