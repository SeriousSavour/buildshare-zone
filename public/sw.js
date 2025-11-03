importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

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
  console.log('📡 SW intercepted:', event.request.url);
  
  event.respondWith((async () => {
    if (scramjet.route(event)) {
      console.log('✅ Scramjet routing:', event.request.url);
      return scramjet.fetch(event);
    }
    console.log('⏩ Passthrough:', event.request.url);
    return fetch(event.request);
  })());
});
