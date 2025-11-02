import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Hidden Cloudflare Worker URL - never exposed to client
const CLOUDFLARE_WORKER_URL = "https://fetchthebannafromthepantryitcantfindthishahawaitwhatyoudoing.theplasticegg.workers.dev";

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

    console.log(`[RELAY] Proxying request to: ${targetUrl}`);

    // Forward request to hidden Cloudflare Worker
    const proxyUrl = `${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(targetUrl)}`;
    
    const response = await fetch(proxyUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers.get('User-Agent') || 'Mozilla/5.0',
      },
    });

    // Get response body
    const body = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'text/html';

    console.log(`[RELAY] Response: ${response.status} ${contentType} (${body.byteLength} bytes)`);

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
    console.error('[RELAY ERROR]', error);
    
    return new Response(JSON.stringify({ 
      error: 'Proxy relay failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
