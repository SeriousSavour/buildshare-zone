/**
 * Cloudflare Worker for Shadow Browser Proxy
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://dash.cloudflare.com
 * 2. Navigate to Workers & Pages
 * 3. Create a new Worker
 * 4. Copy this entire file content into the worker editor
 * 5. Deploy the worker
 * 6. Copy the worker URL (e.g., https://your-worker.your-subdomain.workers.dev)
 * 7. Add to your .env file: VITE_PROXY_WORKER_URL=https://your-worker.your-subdomain.workers.dev
 */

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  }
};

async function handleRequest(request) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')

    if (!targetUrl) {
      return new Response('Missing url parameter', {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Validate URL
    let parsedUrl
    try {
      parsedUrl = new URL(targetUrl)
    } catch (e) {
      return new Response('Invalid URL', {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Fetch the target URL
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
    })

    const contentType = response.headers.get('content-type') || ''
    
    // Handle HTML content
    if (contentType.includes('text/html')) {
      let html = await response.text()
      
      // Rewrite URLs in HTML
      html = rewriteHtml(html, parsedUrl.origin, request.url.split('?')[0])
      
      // Strip Content-Security-Policy meta tags that might block proxied resources
      html = html.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '')
      
      // Add base tag for proper resource loading from about:srcdoc
      const baseTag = `<base href="${parsedUrl.origin}/">`;
      if (!html.includes('<base')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      }
      
      // Inject proxy script
      const injectedScript = `
        <script>
          (function() {
            const PROXY_URL = '${request.url.split('?')[0]}';
            const ORIGINAL_ORIGIN = '${parsedUrl.origin}';
            
            // Intercept fetch
            const originalFetch = window.fetch;
            window.fetch = function(resource, init) {
              const url = typeof resource === 'string' ? resource : resource.url;
              const proxiedUrl = makeProxyUrl(url);
              return originalFetch(proxiedUrl, init);
            };
            
            // Intercept XMLHttpRequest
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, ...args) {
              const proxiedUrl = makeProxyUrl(url);
              return originalOpen.call(this, method, proxiedUrl, ...args);
            };
            
            function makeProxyUrl(url) {
              if (url.startsWith('data:') || url.startsWith('blob:')) return url;
              const absolute = new URL(url, window.location.href).href;
              if (absolute.startsWith(PROXY_URL)) return absolute;
              return PROXY_URL + '?url=' + encodeURIComponent(absolute);
            }
          })();
        </script>
      `
      
      html = html.replace('</head>', `${injectedScript}</head>`)
      
      // Strip CSP headers that might block proxied resources
      const responseHeaders = {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      };
      
      return new Response(html, {
        status: response.status,
        headers: responseHeaders,
      })
    }
    
    // Handle CSS content
    if (contentType.includes('text/css')) {
      let css = await response.text()
      css = rewriteCss(css, parsedUrl.origin, request.url.split('?')[0])
      
      return new Response(css, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/css; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
    
    // Handle other content types (images, scripts, etc.)
    const body = await response.arrayBuffer()
    
    // Create response headers that preserve original content type
    const responseHeaders = new Headers()
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    responseHeaders.set('Content-Type', contentType || 'application/octet-stream')
    responseHeaders.set('Cache-Control', 'public, max-age=86400')
    
    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    })
    
  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
      },
    })
  }
}

function rewriteHtml(html, originalOrigin, proxyUrl) {
  // Rewrite href attributes
  html = html.replace(/href=["']([^"']+)["']/gi, (match, url) => {
    const newUrl = rewriteUrl(url, originalOrigin, proxyUrl)
    return `href="${newUrl}"`
  })
  
  // Rewrite src attributes
  html = html.replace(/src=["']([^"']+)["']/gi, (match, url) => {
    const newUrl = rewriteUrl(url, originalOrigin, proxyUrl)
    return `src="${newUrl}"`
  })
  
  // Rewrite srcset attributes
  html = html.replace(/srcset=["']([^"']+)["']/gi, (match, srcset) => {
    const newSrcset = srcset.split(',').map(item => {
      const parts = item.trim().split(/\s+/)
      parts[0] = rewriteUrl(parts[0], originalOrigin, proxyUrl)
      return parts.join(' ')
    }).join(', ')
    return `srcset="${newSrcset}"`
  })
  
  // Rewrite action attributes
  html = html.replace(/action=["']([^"']+)["']/gi, (match, url) => {
    const newUrl = rewriteUrl(url, originalOrigin, proxyUrl)
    return `action="${newUrl}"`
  })
  
  return html
}

function rewriteCss(css, originalOrigin, proxyUrl) {
  // Rewrite url() in CSS
  return css.replace(/url\(['"]?([^'")]+)['"]?\)/gi, (match, url) => {
    const newUrl = rewriteUrl(url, originalOrigin, proxyUrl)
    return `url("${newUrl}")`
  })
}

function rewriteUrl(url, originalOrigin, proxyUrl) {
  if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) {
    return url
  }
  
  try {
    const absoluteUrl = new URL(url, originalOrigin).href
    return `${proxyUrl}?url=${encodeURIComponent(absoluteUrl)}`
  } catch (e) {
    return url
  }
}
