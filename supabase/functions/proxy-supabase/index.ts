import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
};

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 200; // 200 requests per minute per IP

serve(async (req) => {
  console.log('🚀 Edge function invoked');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse URL once at the beginning
    const url = new URL(req.url);
    const targetPath = url.searchParams.get('path');
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    console.log(`📥 Incoming request: ${req.method} ${targetPath} from ${clientIp}`);
    
    // Rate limiting (server-side only)
    if (!checkRateLimit(clientIp)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${clientIp}`);
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!targetPath) {
      console.error('❌ Missing target path parameter');
      return new Response(JSON.stringify({ error: 'Missing target path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get encrypted proxy list from environment (never exposed to client)
    const proxyList = Deno.env.get('DECODO_PROXY_LIST');
    
    if (!proxyList) {
      console.warn('⚠️ DECODO_PROXY_LIST not configured, using direct connection');
      
      const supabaseUrl = `https://ptmeykacgbrsmvcvwrpp.supabase.co${targetPath}`;
      console.log(`🔗 Direct connection to: ${supabaseUrl}`);
      
      const headers = new Headers();
      req.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'host') {
          headers.set(key, value);
        }
      });
      
      let body = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        body = await req.text();
        console.log(`📤 Request body length: ${body.length} bytes`);
      }
      
      const response = await fetch(supabaseUrl, {
        method: req.method,
        headers: headers,
        body: body,
      });
      
      console.log(`✅ Direct connection completed: ${response.status} ${response.statusText}`);
      
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
    console.log(`🎲 Available proxies: ${proxies.length}`);
    
    const selectedProxy = proxies[Math.floor(Math.random() * proxies.length)];
    
    // Parse format: gate.decodo.com:10001:username:password
    const [proxyHost, portStr, username, password] = selectedProxy.split(':');
    const proxyPort = parseInt(portStr);
    
    console.log(`🔄 Proxy selected: ${proxyHost}:${proxyPort} (credentials hidden)`);

    const supabaseUrl = `https://ptmeykacgbrsmvcvwrpp.supabase.co${targetPath}`;
    console.log(`🌐 Target URL: ${supabaseUrl}`);
    
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
      console.log(`📤 Request body length: ${body.length} bytes`);
    }

    console.log(`🌐 Routing ${req.method} through secure proxy to ${proxyHost}:${proxyPort}...`);

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

      console.log(`✅ Proxy request completed: ${supabaseResponse.status} ${supabaseResponse.statusText}`);

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
      console.error('⚠️ Proxy failed, attempting direct connection fallback:', proxyError.message);
      console.error(`❌ Proxy error details: ${proxyError.stack}`);
      
      // Fallback to direct connection
      const directResponse = await fetch(supabaseUrl, {
        method: req.method,
        headers: headers,
        body: body,
      });

      console.log(`✅ Fallback direct connection completed: ${directResponse.status} ${directResponse.statusText}`);

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
    console.error('❌ Fatal error in proxy function:', error);
    console.error(`❌ Error stack: ${error.stack}`);
    console.error(`❌ Error type: ${error.constructor.name}`);
    
    return new Response(JSON.stringify({ 
      error: 'Request failed', 
      details: error.message,
      type: error.constructor.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function for rate limiting
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // Create new rate limit window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}
