// Service Worker for proxying game content and stripping frame-blocking headers

const PROXY_PREFIX = '/proxy/game/';

self.addEventListener('install', (event) => {
  console.log('[SW] ========== INSTALLING ==========');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] ========== ACTIVATING ==========');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  console.log('[SW] Fetch intercepted:', url.pathname);
  
  // Only intercept requests to our proxy path
  if (!url.pathname.startsWith(PROXY_PREFIX)) {
    console.log('[SW] Not proxy path, passing through');
    return;
  }
  
  console.log('[SW] ========== PROXY REQUEST ==========');
  
  // Extract the target URL from the path
  const encodedTarget = url.pathname.substring(PROXY_PREFIX.length);
  
  console.log('[SW] Encoded target:', encodedTarget);
  
  if (!encodedTarget) {
    console.error('[SW] Missing target URL!');
    return event.respondWith(
      new Response('Missing target URL', { status: 400 })
    );
  }
  
  let targetUrl;
  try {
    targetUrl = decodeURIComponent(encodedTarget);
    console.log('[SW] Decoded target URL:', targetUrl);
  } catch (e) {
    console.error('[SW] Failed to decode target URL:', e);
    return event.respondWith(
      new Response('Invalid target URL', { status: 400 })
    );
  }
  
  console.log('[SW] Fetching from:', targetUrl);
  
  event.respondWith(
    fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      mode: 'cors',
      redirect: 'follow',
      credentials: 'omit'
    })
    .then(response => {
      console.log('[SW] Response received:', response.status, response.statusText);
      console.log('[SW] Response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        console.error('[SW] Response not OK:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Clone the response so we can modify headers
      const headers = new Headers(response.headers);
      
      console.log('[SW] Original X-Frame-Options:', headers.get('x-frame-options'));
      console.log('[SW] Original CSP:', headers.get('content-security-policy'));
      
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
      
      console.log('[SW] Modified headers set');
      console.log('[SW] New X-Frame-Options:', headers.get('x-frame-options'));
      console.log('[SW] New CSP:', headers.get('content-security-policy'));
      console.log('[SW] Returning proxied response');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
    })
    .catch(error => {
      console.error('[SW] Fetch error:', error);
      console.error('[SW] Failed URL:', targetUrl);
      
      // Return detailed error message
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Proxy Error</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>Unable to Load Game</h1>
          <p>The proxy encountered an error while fetching the game.</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>URL:</strong> ${targetUrl}</p>
          <p>This usually happens when:</p>
          <ul style="text-align: left; max-width: 500px; margin: 20px auto;">
            <li>The game server is blocking requests</li>
            <li>The URL is incorrect or the game is offline</li>
            <li>Network connectivity issues</li>
          </ul>
          <button onclick="window.parent.postMessage({type: 'open-new-tab', url: '${targetUrl}'}, '*')" 
                  style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
            Try Opening in New Tab
          </button>
        </body>
        </html>
      `;
      
      return new Response(errorHtml, { 
        status: 502,
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    })
  );
});
