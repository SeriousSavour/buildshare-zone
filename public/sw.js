importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

// Install immediately
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing');
  self.skipWaiting();
});

// Activate and take control immediately
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔴 SW FETCH EVENT');
  console.log('📝 URL:', url);
  
  event.respondWith((async () => {
    await sw.loadConfig();
    
    if (sw.route(event)) {
      console.log('✅ Scramjet WILL proxy this request');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return await sw.fetch(event);
    }
    
    console.log('⏩ Passthrough (not proxied)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return fetch(event.request);
  })());
});
