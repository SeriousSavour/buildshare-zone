// Security Service Worker - Network-level protection
const ALLOWED_ORIGINS = [
  self.location.origin,
  'https://lovable.app',
  'https://ptmeykacgbrsmvcvwrpp.supabase.co',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdn.jsdelivr.net'
];

const SECURITY_VERSION = '1.0.0';

console.log('🛡️ Security Service Worker loaded - Version:', SECURITY_VERSION);

// Install event
self.addEventListener('install', (event) => {
  console.log('🛡️ Security SW: Installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🛡️ Security SW: Activated');
  event.waitUntil(clients.claim()); // Take control immediately
});

// Intercept all fetch requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const requestOrigin = url.origin;
  const currentOrigin = self.location.origin;

  // Check if this is a navigation request (page redirect)
  if (event.request.mode === 'navigate') {
    // Block navigation to external domains
    if (requestOrigin !== currentOrigin && 
        !url.pathname.startsWith('/') &&
        !ALLOWED_ORIGINS.includes(requestOrigin)) {
      
      console.error('🛡️ SW BLOCKED navigation to:', url.href);
      
      // Block by returning a redirect back to origin
      event.respondWith(
        Response.redirect(currentOrigin, 302)
      );
      
      // Also notify the page
      clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'REDIRECT_BLOCKED',
            blockedUrl: url.href,
            timestamp: Date.now()
          });
        });
      });
      
      return;
    }
  }

  // Check for suspicious redirects in responses
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if response is a redirect
        if (response.type === 'opaqueredirect' || 
            (response.status >= 300 && response.status < 400)) {
          
          const redirectLocation = response.headers.get('Location');
          
          if (redirectLocation) {
            try {
              const redirectUrl = new URL(redirectLocation, url.href);
              const redirectOrigin = redirectUrl.origin;
              
              // Block external redirects
              if (redirectOrigin !== currentOrigin && 
                  !ALLOWED_ORIGINS.includes(redirectOrigin)) {
                
                console.error('🛡️ SW BLOCKED redirect response to:', redirectLocation);
                
                // Notify page
                clients.matchAll({ type: 'window' }).then(clients => {
                  clients.forEach(client => {
                    client.postMessage({
                      type: 'REDIRECT_BLOCKED',
                      blockedUrl: redirectLocation,
                      timestamp: Date.now()
                    });
                  });
                });
                
                // Return redirect to origin instead
                return Response.redirect(currentOrigin, 302);
              }
            } catch (e) {
              console.warn('🛡️ SW: Could not parse redirect location:', redirectLocation);
            }
          }
        }
        
        return response;
      })
      .catch(error => {
        console.error('🛡️ SW fetch error:', error);
        
        // On fetch error, return to origin
        if (event.request.mode === 'navigate') {
          return Response.redirect(currentOrigin, 302);
        }
        
        return new Response('Network error', { 
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Listen for messages from the page
self.addEventListener('message', (event) => {
  if (event.data.type === 'SECURITY_CHECK') {
    event.ports[0].postMessage({
      active: true,
      version: SECURITY_VERSION
    });
  }
});
