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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    console.log('Response status:', response.status);
    
    // Handle 204 No Content - must not have a body
    if (response.status === 204) {
      const responseHeaders = new Headers(corsHeaders);
      return new Response(null, {
        status: 204,
        headers: responseHeaders,
      });
    }
    
    // Get the body as text/binary
    const body = contentType.includes('text/') || contentType.includes('application/json') || contentType.includes('application/javascript')
      ? await response.text()
      : await response.arrayBuffer();
    
    // Force correct MIME type for rendering
    let finalContentType = contentType || 'application/octet-stream';
    if (contentType.includes('text/html')) {
      finalContentType = 'text/html; charset=utf-8';
    } else if (contentType.includes('text/css')) {
      finalContentType = 'text/css; charset=utf-8';
    } else if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
      finalContentType = 'application/javascript; charset=utf-8';
    } else if (contentType.includes('application/json')) {
      finalContentType = 'application/json; charset=utf-8';
    }
    
    // For HTML content, rewrite all URLs
    if (finalContentType.includes('text/html') && typeof body === 'string') {
      let html = body;
      const baseUrl = new URL(targetUrl);
      const proxyBaseUrl = `${url.origin}/functions/v1/proxy`;

      console.log('Rewriting HTML URLs...');

      // Helper function to convert any URL to proxy URL (MUST use https://)
      const toProxyUrl = (originalUrl: string): string => {
        try {
          const absolute = new URL(originalUrl, baseUrl).href;
          // Force HTTPS for proxy URL to prevent mixed content errors
          const proxyUrl = new URL(proxyBaseUrl);
          proxyUrl.protocol = 'https:';
          return `${proxyUrl.origin}${proxyUrl.pathname}?url=${encodeURIComponent(absolute)}`;
        } catch {
          return originalUrl;
        }
      };

      // Rewrite href attributes (links, stylesheets)
      html = html.replace(
        /href=["']([^"']+)["']/gi,
        (match, href) => {
          if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return match;
          }
          return `href="${toProxyUrl(href)}"`;
        }
      );

      // Rewrite src attributes (scripts, images, iframes)
      html = html.replace(
        /src=["']([^"']+)["']/gi,
        (match, src) => {
          if (src.startsWith('data:') || src.startsWith('javascript:')) {
            return match;
          }
          return `src="${toProxyUrl(src)}"`;
        }
      );

      // Rewrite srcset attributes (responsive images)
      html = html.replace(
        /srcset=["']([^"']+)["']/gi,
        (match, srcset) => {
          const rewritten = srcset.split(',').map((item: string) => {
            const parts = item.trim().split(/\s+/);
            if (parts[0]) {
              parts[0] = toProxyUrl(parts[0]);
            }
            return parts.join(' ');
          }).join(', ');
          return `srcset="${rewritten}"`;
        }
      );

      // Rewrite CSS url() references
      html = html.replace(
        /url\(['"]?([^'")\s]+)['"]?\)/gi,
        (match, cssUrl) => {
          if (cssUrl.startsWith('data:') || cssUrl.startsWith('#')) {
            return match;
          }
          return `url("${toProxyUrl(cssUrl)}")`;
        }
      );

      // Rewrite action attributes in forms
      html = html.replace(
        /action=["']([^"']+)["']/gi,
        (match, action) => {
          if (action.startsWith('#') || action.startsWith('javascript:')) {
            return match;
          }
          return `action="${toProxyUrl(action)}"`;
        }
      );

      // Add base tag to resolve relative URLs
      if (!html.includes('<base')) {
        html = html.replace(
          /<head>/i,
          `<head><base href="${baseUrl.href}">`
        );
      }

      // Inject proxy interceptor script (with HTTPS URLs)
      const proxyUrl = new URL(proxyBaseUrl);
      proxyUrl.protocol = 'https:';
      const httpsProxyUrl = `${proxyUrl.origin}${proxyUrl.pathname}`;
      
      const injectedScript = `
        <script>
          (function() {
            const proxyUrl = '${httpsProxyUrl}';
            const baseUrl = '${baseUrl.href}';
            
            // Helper to convert URL to proxy URL
            function toProxyUrl(url) {
              if (!url || typeof url !== 'string') return url;
              if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
                return url;
              }
              try {
                const absolute = new URL(url, baseUrl).href;
                if (absolute.includes(proxyUrl)) return url;
                return proxyUrl + '?url=' + encodeURIComponent(absolute);
              } catch (e) {
                return url;
              }
            }
            
            // Override fetch
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
              return originalFetch.call(window, toProxyUrl(url), options);
            };

            // Override XMLHttpRequest
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
              return originalOpen.call(this, method, toProxyUrl(url), ...rest);
            };

            // Override Image constructor
            const OriginalImage = window.Image;
            window.Image = function() {
              const img = new OriginalImage();
              const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
              Object.defineProperty(img, 'src', {
                get: originalSrcDescriptor.get,
                set: function(value) {
                  originalSrcDescriptor.set.call(this, toProxyUrl(value));
                }
              });
              return img;
            };

            // Override dynamic element creation
            const originalCreateElement = document.createElement;
            document.createElement = function(tagName, options) {
              const element = originalCreateElement.call(document, tagName, options);
              
              if (tagName.toLowerCase() === 'script' || tagName.toLowerCase() === 'img' || tagName.toLowerCase() === 'iframe') {
                const originalSrcDescriptor = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'src');
                if (originalSrcDescriptor) {
                  Object.defineProperty(element, 'src', {
                    get: originalSrcDescriptor.get,
                    set: function(value) {
                      originalSrcDescriptor.set.call(this, toProxyUrl(value));
                    }
                  });
                }
              }
              
              if (tagName.toLowerCase() === 'link') {
                const originalHrefDescriptor = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'href');
                if (originalHrefDescriptor) {
                  Object.defineProperty(element, 'href', {
                    get: originalHrefDescriptor.get,
                    set: function(value) {
                      originalHrefDescriptor.set.call(this, toProxyUrl(value));
                    }
                  });
                }
              }
              
              return element;
            };

            // Intercept form submissions
            document.addEventListener('submit', function(e) {
              const form = e.target;
              if (form.action && !form.action.includes(proxyUrl)) {
                e.preventDefault();
                form.action = toProxyUrl(form.action);
                form.submit();
              }
            }, true);

            // Intercept window.open
            const originalWindowOpen = window.open;
            window.open = function(url, ...args) {
              return originalWindowOpen.call(window, toProxyUrl(url), ...args);
            };

            console.log('Proxy interceptor active');
          })();
        </script>
      `;

      html = html.replace('</head>', `${injectedScript}</head>`);

      // Create response headers explicitly
      const htmlHeaders = new Headers(corsHeaders);
      htmlHeaders.set('Content-Type', 'text/html; charset=utf-8');
      htmlHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      htmlHeaders.set('Content-Disposition', 'inline');
      htmlHeaders.set('X-Frame-Options', 'ALLOWALL');

      return new Response(html, {
        status: response.status,
        headers: htmlHeaders,
      });
    }

    // For CSS, rewrite url() references
    if (finalContentType.includes('text/css') && typeof body === 'string') {
      let css = body;
      const baseUrl = new URL(targetUrl);
      // Force HTTPS for proxy URL
      const proxyUrl = new URL(`${url.origin}/functions/v1/proxy`);
      proxyUrl.protocol = 'https:';
      const proxyBaseUrl = `${proxyUrl.origin}${proxyUrl.pathname}`;

      css = css.replace(
        /url\(['"]?([^'")\s]+)['"]?\)/gi,
        (match, cssUrl) => {
          if (cssUrl.startsWith('data:') || cssUrl.startsWith('#')) {
            return match;
          }
          try {
            const absolute = new URL(cssUrl, baseUrl).href;
            return `url("${proxyBaseUrl}?url=${encodeURIComponent(absolute)}")`;
          } catch {
            return match;
          }
        }
      );

      // Create response headers explicitly for CSS
      const cssHeaders = new Headers(corsHeaders);
      cssHeaders.set('Content-Type', 'text/css; charset=utf-8');
      cssHeaders.set('Cache-Control', 'public, max-age=3600');

      return new Response(css, {
        status: response.status,
        headers: cssHeaders,
      });
    }

    // For all other content (JS, images, etc.), return with correct Content-Type
    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', finalContentType);
    responseHeaders.set('Cache-Control', 'public, max-age=3600');
    
    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Proxy Error</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #0a0a0a;
              color: #fff;
            }
            .error-container {
              max-width: 600px;
              padding: 2rem;
              text-align: center;
            }
            h1 {
              color: #ef4444;
              margin-bottom: 1rem;
            }
            p {
              color: #a1a1aa;
              line-height: 1.6;
            }
            .details {
              background: #1a1a1a;
              padding: 1rem;
              border-radius: 0.5rem;
              margin-top: 1rem;
              font-family: monospace;
              font-size: 0.875rem;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>⚠️ Cannot Load Resource</h1>
            <p>The resource could not be loaded through the proxy.</p>
            <div class="details">
              ${error.message}
            </div>
          </div>
        </body>
      </html>
    `;
    
    return new Response(errorHtml, { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
    });
  }
});
