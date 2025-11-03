importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker({
  prefix: '/scramjet/',
  codec: '/scram/'
});

self.addEventListener("fetch", (event) => {
  event.respondWith((async () => {
    if (scramjet.route(event)) {
      return scramjet.fetch(event);
    }
    return fetch(event.request);
  })());
});
