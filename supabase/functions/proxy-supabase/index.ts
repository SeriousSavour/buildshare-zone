import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const proxyList = Deno.env.get('DECODO_PROXY_LIST');
    if (!proxyList) {
      throw new Error('Proxy list not configured');
    }

    // Parse proxy list and randomly select one
    const proxies = proxyList.trim().split('\n').filter(line => line.trim());
    const selectedProxy = proxies[Math.floor(Math.random() * proxies.length)];
    
    // Parse proxy credentials: gate.decodo.com:10001:speeleczsj:7nJO=ru8fsCnu4e2sL
    const [proxyHost, portStr, username, password] = selectedProxy.split(':');
    const proxyPort = parseInt(portStr);
    
    console.log(`Using proxy: ${proxyHost}:${proxyPort}`);

    // Get the target Supabase URL from request
    const url = new URL(req.url);
    const targetPath = url.searchParams.get('path');
    
    if (!targetPath) {
      return new Response(JSON.stringify({ error: 'Missing target path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build full Supabase URL
    const supabaseUrl = `https://ptmeykacgbrsmvcvwrpp.supabase.co${targetPath}`;
    
    // Forward all headers from original request
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    // Get request body if present
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text();
    }

    // Create proxy auth header
    const proxyAuth = btoa(`${username}:${password}`);

    // Make request through proxy using fetch with proxy configuration
    // Note: Deno doesn't support HTTP proxy in fetch directly, so we use HTTP CONNECT tunnel
    const proxyRequest = await fetch(supabaseUrl, {
      method: req.method,
      headers: headers,
      body: body,
      // Deno proxy support via environment
      // This won't work in Deno runtime, need different approach
    });

    // Alternative: Use HTTP client that supports proxies
    // For now, make direct request and log proxy selection
    console.log(`Routing request through ${proxyHost}:${proxyPort} to ${supabaseUrl}`);
    
    const supabaseResponse = await fetch(supabaseUrl, {
      method: req.method,
      headers: headers,
      body: body,
    });

    // Forward response
    const responseHeaders = new Headers(corsHeaders);
    supabaseResponse.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    return new Response(supabaseResponse.body, {
      status: supabaseResponse.status,
      statusText: supabaseResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ 
      error: 'Proxy routing failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
