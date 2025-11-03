importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2/dist/scramjet.codecs.js");
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2/dist/scramjet.config.js");
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2/dist/scramjet.shared.js");
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2/dist/scramjet.worker.js");

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
  
  // @ts-ignore - Scramjet handles routing
  if ($scramjet.route(event)) {
    console.log('✅ Scramjet routing:', event.request.url);
    // @ts-ignore
    event.respondWith($scramjet.fetch(event));
  } else {
    console.log('⏩ Passthrough:', event.request.url);
  }
});
