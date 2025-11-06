// Service Worker for proxying game content and stripping frame-blocking headers

const PROXY_PREFIX = '/sengine/scramjet/';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept requests to our proxy path
  if (!url.pathname.startsWith(PROXY_PREFIX)) {
    return;
  }
  
  // Extract the target URL from the path
  const encodedTarget = url.pathname.substring(PROXY_PREFIX.length);
  
  if (!encodedTarget) {
    return event.respondWith(
      new Response('Missing target URL', { status: 400 })
    );
  }
  
  let targetUrl;
  try {
    targetUrl = decodeURIComponent(encodedTarget);
  } catch (e) {
    return event.respondWith(
      new Response('Invalid target URL', { status: 400 })
    );
  }
  
  console.log('[SW] Proxying:', targetUrl);
  
  event.respondWith(
    fetch(targetUrl, {
      method: event.request.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow',
      credentials: 'omit'
    })
    .then(response => {
      // Clone the response so we can modify headers
      const headers = new Headers(response.headers);
      
      // CRITICAL: Strip all frame-blocking headers
      headers.delete('x-frame-options');
      headers.delete('content-security-policy');
      headers.delete('content-security-policy-report-only');
      
      // Set permissive CSP that allows framing
      headers.set('content-security-policy', 
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *;");
      
      // Relax COOP/COEP
      headers.set('cross-origin-opener-policy', 'unsafe-none');
      headers.set('cross-origin-embedder-policy', 'unsafe-none');
      
      // CORS headers
      headers.set('access-control-allow-origin', '*');
      headers.set('access-control-allow-methods', '*');
      headers.set('access-control-allow-headers', '*');
      
      console.log('[SW] Proxied response:', response.status, headers.get('content-type'));
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
    })
    .catch(error => {
      console.error('[SW] Fetch error:', error);
      return new Response(`Proxy error: ${error.message}`, { status: 502 });
    })
  );
});
