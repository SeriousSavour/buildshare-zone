import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Proxying request to:', targetUrl);

    // Fetch the target URL
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    const contentType = response.headers.get('content-type') || '';
    
    // For HTML content, rewrite links and resources
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const baseUrl = new URL(targetUrl);
      const proxyBaseUrl = `${url.origin}/functions/v1/proxy`;

      // Rewrite absolute URLs
      html = html.replace(
        /href=["']https?:\/\/[^"']+["']/gi,
        (match) => {
          const originalUrl = match.match(/href=["'](https?:\/\/[^"']+)["']/i)?.[1];
          if (originalUrl) {
            return `href="${proxyBaseUrl}?url=${encodeURIComponent(originalUrl)}"`;
          }
          return match;
        }
      );

      // Rewrite relative URLs
      html = html.replace(
        /href=["'](?!https?:\/\/|\/\/|#|javascript:|mailto:|data:)([^"']+)["']/gi,
        (match, relativeUrl) => {
          const absoluteUrl = new URL(relativeUrl, baseUrl).href;
          return `href="${proxyBaseUrl}?url=${encodeURIComponent(absoluteUrl)}"`;
        }
      );

      // Rewrite src attributes for scripts, images, iframes
      html = html.replace(
        /src=["']https?:\/\/[^"']+["']/gi,
        (match) => {
          const originalUrl = match.match(/src=["'](https?:\/\/[^"']+)["']/i)?.[1];
          if (originalUrl) {
            return `src="${proxyBaseUrl}?url=${encodeURIComponent(originalUrl)}"`;
          }
          return match;
        }
      );

      // Rewrite relative src attributes
      html = html.replace(
        /src=["'](?!https?:\/\/|\/\/|data:)([^"']+)["']/gi,
        (match, relativeUrl) => {
          const absoluteUrl = new URL(relativeUrl, baseUrl).href;
          return `src="${proxyBaseUrl}?url=${encodeURIComponent(absoluteUrl)}"`;
        }
      );

      // Add base tag to help with relative URLs
      html = html.replace(
        /<head>/i,
        `<head><base href="${baseUrl.origin}/">`
      );

      // Inject script to intercept form submissions and new navigations
      const injectedScript = `
        <script>
          (function() {
            const proxyUrl = '${proxyBaseUrl}';
            
            // Intercept all form submissions
            document.addEventListener('submit', function(e) {
              const form = e.target;
              if (form.action && !form.action.includes(proxyUrl)) {
                e.preventDefault();
                const action = new URL(form.action, window.location.href).href;
                form.action = proxyUrl + '?url=' + encodeURIComponent(action);
                form.submit();
              }
            });

            // Intercept window.open
            const originalOpen = window.open;
            window.open = function(url, ...args) {
              if (url && !url.includes(proxyUrl)) {
                url = proxyUrl + '?url=' + encodeURIComponent(url);
              }
              return originalOpen.call(window, url, ...args);
            };

            // Update pushState and replaceState
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function(state, title, url) {
              if (url && !url.includes(proxyUrl)) {
                url = proxyUrl + '?url=' + encodeURIComponent(new URL(url, window.location.href).href);
              }
              return originalPushState.call(history, state, title, url);
            };

            history.replaceState = function(state, title, url) {
              if (url && !url.includes(proxyUrl)) {
                url = proxyUrl + '?url=' + encodeURIComponent(new URL(url, window.location.href).href);
              }
              return originalReplaceState.call(history, state, title, url);
            };
          })();
        </script>
      `;

      html = html.replace('</body>', `${injectedScript}</body>`);

      return new Response(html, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // For non-HTML content (CSS, JS, images, etc.), return as-is
    const content = await response.arrayBuffer();
    
    return new Response(content, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to proxy request', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
