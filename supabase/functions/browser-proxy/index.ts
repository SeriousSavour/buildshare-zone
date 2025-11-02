import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Cloudflare Worker Rammerhead proxy URL - never exposed to client
const RAMMERHEAD_PROXY_URL = "https://fetchthebannafromthepantryitcantfindthishahawaitwhatyoudoing.theplasticegg.workers.dev";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// Session cache to reuse sessions (in-memory, per function instance)
let cachedSession: { id: string; createdAt: number } | null = null;
const SESSION_TTL = 1000 * 60 * 30; // 30 minutes

async function getRammerheadSession(): Promise<string> {
  // Check if we have a valid cached session
  if (cachedSession && (Date.now() - cachedSession.createdAt) < SESSION_TTL) {
    console.log(`[RAMMERHEAD] Using cached session: ${cachedSession.id}`);
    return cachedSession.id;
  }

  // Create new session
  console.log('[RAMMERHEAD] Creating new session...');
  console.log(`[RAMMERHEAD] Fetching: ${RAMMERHEAD_PROXY_URL}/newsession`);
  
  const response = await fetch(`${RAMMERHEAD_PROXY_URL}/newsession`, {
    method: 'GET',
  });

  console.log(`[RAMMERHEAD] Session response status: ${response.status}`);
  console.log(`[RAMMERHEAD] Session response headers:`, Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[RAMMERHEAD] Session creation failed: ${errorBody}`);
    throw new Error(`Failed to create Rammerhead session: ${response.status} - ${errorBody}`);
  }

  const sessionId = await response.text();
  console.log(`[RAMMERHEAD] New session created: ${sessionId}`);
  
  // Cache the session
  cachedSession = {
    id: sessionId.trim(),
    createdAt: Date.now(),
  };

  return cachedSession.id;
}

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

    console.log(`[RAMMERHEAD] Proxying request to: ${targetUrl}`);

    // Get or create Rammerhead session
    const sessionId = await getRammerheadSession();

    // Build Rammerhead proxy URL with session
    const proxyUrl = `${RAMMERHEAD_PROXY_URL}/${sessionId}/${targetUrl}`;
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
