importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker({
  prefix: '/service/',
  codec: 'xor',
});

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
  const method = event.request.method;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔴 SW FETCH EVENT');
  console.log('📝 Method:', method);
  console.log('📝 URL:', url);
  console.log('📝 Request mode:', event.request.mode);
  console.log('📝 Request destination:', event.request.destination);
  
  event.respondWith((async () => {
    try {
      await scramjet.loadConfig();
      
      if (scramjet.route(event)) {
        console.log('✅ Scramjet routing this request');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return await scramjet.fetch(event);
      }
    } catch (err) {
      console.error('❌ Scramjet error:', err);
    }
    
    console.log('⏩ Passthrough (not proxied)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return fetch(event.request);
  })());
});
