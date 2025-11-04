importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");

// CRITICAL: Configure BEFORE loading worker
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

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

console.log('🔧 Service Worker loaded');
console.log('🔧 Config prefix:', self.$scramjet.config.prefix);

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
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔴 SW FETCH:', url.pathname);
      
      // Check if this is a proxy request
      if (url.pathname.startsWith(self.$scramjet.config.prefix)) {
        console.log('✅ Proxy URL detected!');
        console.log('📝 Config prefix:', self.$scramjet.config.prefix);
        console.log('📝 URL pathname:', url.pathname);
        
        try {
          // DON'T call loadConfig - it overrides our prefix!
          // Just check if Scramjet will route it
          const shouldRoute = sw.route(event);
          console.log('📝 sw.route() =', shouldRoute);
          
          if (shouldRoute) {
            console.log('🎯 Proxying...');
            const response = await sw.fetch(event);
            console.log('✅ Response:', response.status);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return response;
          } else {
            console.log('❌ sw.route() = false');
            // If route returns false, manually handle it
            console.log('🔧 Attempting manual proxy...');
            
            // Extract the target URL from /service/https://example.com
            const targetUrl = url.pathname.replace(self.$scramjet.config.prefix, '');
            console.log('📝 Target URL:', targetUrl);
            
            if (targetUrl) {
              try {
                // Try direct fetch first
                const proxyResponse = await fetch(targetUrl, {
                  headers: event.request.headers,
                  method: event.request.method,
                  body: event.request.body
                });
                console.log('✅ Direct fetch response:', proxyResponse.status);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                return proxyResponse;
              } catch (e) {
                console.error('❌ Direct fetch failed:', e);
              }
            }
          }
        } catch (error) {
          console.error('❌ Proxy error:', error);
          console.error('❌ Stack:', error.stack);
        }
      } else {
        console.log('⏩ Not proxy URL - passthrough');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return fetch(event.request);
    })()
  );
});
