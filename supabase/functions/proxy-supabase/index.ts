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
    // Get encrypted proxy list from environment (never exposed to client)
    const proxyList = Deno.env.get('DECODO_PROXY_LIST');
    
    if (!proxyList) {
      console.warn('⚠️ DECODO_PROXY_LIST not configured, using direct connection');
      
      // Fallback to direct connection
      const url = new URL(req.url);
      const targetPath = url.searchParams.get('path');
      
      if (!targetPath) {
        return new Response(JSON.stringify({ error: 'Missing target path' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const supabaseUrl = `https://ptmeykacgbrsmvcvwrpp.supabase.co${targetPath}`;
      const headers = new Headers();
      req.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'host') {
          headers.set(key, value);
        }
      });
      
      let body = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        body = await req.text();
      }
      
      const response = await fetch(supabaseUrl, {
        method: req.method,
        headers: headers,
        body: body,
      });
      
      const responseHeaders = new Headers(corsHeaders);
      response.headers.forEach((value, key) => {
        responseHeaders.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }

    // Parse and randomly select proxy for rotation (credentials never sent to client)
    const proxies = proxyList.trim().split('\n').filter(line => line.trim());
    const selectedProxy = proxies[Math.floor(Math.random() * proxies.length)];
    
    // Parse format: gate.decodo.com:10001:username:password
    const [proxyHost, portStr, username, password] = selectedProxy.split(':');
    const proxyPort = parseInt(portStr);
    
    console.log(`🔄 Proxy selected: ${proxyHost}:${proxyPort} (credentials hidden)`);

    // Get target path
    const url = new URL(req.url);
    const targetPath = url.searchParams.get('path');
    
    if (!targetPath) {
      return new Response(JSON.stringify({ error: 'Missing target path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = `https://ptmeykacgbrsmvcvwrpp.supabase.co${targetPath}`;
    
    // Forward headers
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    // Get body if present
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text();
    }

    console.log(`🌐 Routing ${req.method} through secure proxy...`);

    // Create HTTP client with proxy configuration
    const proxyUrl = `http://${username}:${password}@${proxyHost}:${proxyPort}`;
    
    try {
      const client = Deno.createHttpClient({
        proxy: { url: proxyUrl }
      });

      const supabaseResponse = await fetch(supabaseUrl, {
        method: req.method,
        headers: headers,
        body: body,
        client: client,
      });

      console.log(`✅ Request completed: ${supabaseResponse.status}`);

      // Forward response with CORS
      const responseHeaders = new Headers(corsHeaders);
      supabaseResponse.headers.forEach((value, key) => {
        responseHeaders.set(key, value);
      });

      const responseBody = await supabaseResponse.arrayBuffer();
      
      client.close();

      return new Response(responseBody, {
        status: supabaseResponse.status,
        statusText: supabaseResponse.statusText,
        headers: responseHeaders,
      });
    } catch (proxyError) {
      console.error('⚠️ Proxy failed, attempting direct connection:', proxyError.message);
      
      // Fallback to direct connection
      const directResponse = await fetch(supabaseUrl, {
        method: req.method,
        headers: headers,
        body: body,
      });

      console.log(`✅ Direct connection completed: ${directResponse.status}`);

      const responseHeaders = new Headers(corsHeaders);
      directResponse.headers.forEach((value, key) => {
        responseHeaders.set(key, value);
      });

      return new Response(directResponse.body, {
        status: directResponse.status,
        statusText: directResponse.statusText,
        headers: responseHeaders,
      });
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: 'Request failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
