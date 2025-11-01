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
    
    // Get the content
    const content = await response.arrayBuffer();
    
    // Return with proper headers
    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', contentType || 'text/html; charset=utf-8');
    
    // Remove headers that prevent iframe embedding
    // Don't set X-Frame-Options or CSP that would block embedding
    
    return new Response(content, {
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
              justify-center;
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
            <h1>⚠️ Cannot Load Website</h1>
            <p>The website could not be loaded through the proxy. This may be because:</p>
            <ul style="text-align: left; color: #a1a1aa;">
              <li>The website blocks iframe embedding</li>
              <li>The website has strict security policies (CSP, X-Frame-Options)</li>
              <li>The URL is invalid or unreachable</li>
              <li>Network connectivity issues</li>
            </ul>
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
