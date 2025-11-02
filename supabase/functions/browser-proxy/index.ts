import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Cloudflare Worker proxy URL - never exposed to client
const PROXY_WORKER_URL = "https://fetchthebannafromthepantryitcantfindthishahawaitwhatyoudoing.theplasticegg.workers.dev";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[PROXY] Proxying request to: ${targetUrl}`);

    // Build Cloudflare Worker proxy URL
    const proxyUrl = `${PROXY_WORKER_URL}?url=${encodeURIComponent(targetUrl)}`;
    console.log(`[PROXY] Fetching via: ${proxyUrl}`);
    
    const response = await fetch(proxyUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    // Get response body
    const body = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'text/html';

    console.log(`[PROXY] Response: ${response.status} ${contentType} (${body.byteLength} bytes)`);

    // Forward response back to client
    return new Response(body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': response.headers.get('cache-control') || 'no-cache',
      },
    });

  } catch (error) {
    console.error('[PROXY ERROR]', error);
    
    return new Response(JSON.stringify({ 
      error: 'Proxy failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
