import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Rammerhead proxy URL - never exposed to client
const RAMMERHEAD_PROXY_URL = "https://browser.rammerhead.org";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// No session management - client will provide session or we'll use direct URL

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
    const sessionId = url.searchParams.get('session');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[RAMMERHEAD] Proxying request to: ${targetUrl}`);
    console.log(`[RAMMERHEAD] Using session: ${sessionId || 'none - will try direct'}`);

    // Build Rammerhead proxy URL
    // If session provided by client, use it; otherwise try direct access
    const proxyUrl = sessionId 
      ? `${RAMMERHEAD_PROXY_URL}/${sessionId}/${targetUrl}`
      : `${RAMMERHEAD_PROXY_URL}/${targetUrl}`;
    console.log(`[RAMMERHEAD] Fetching via: ${proxyUrl}`);
    
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

    console.log(`[RAMMERHEAD] Response: ${response.status} ${contentType} (${body.byteLength} bytes)`);

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
    console.error('[RAMMERHEAD ERROR]', error);
    
    return new Response(JSON.stringify({ 
      error: 'Rammerhead proxy failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
