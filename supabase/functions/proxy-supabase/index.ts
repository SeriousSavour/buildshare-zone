import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
};

const SUPABASE_URL = 'https://ptmeykacgbrsmvcvwrpp.supabase.co';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 200;

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
    const targetPath = url.searchParams.get('path');
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${targetPath} from ${clientIp}`);
    
    // Validate path
    if (!targetPath) {
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Rate limiting
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Build target URL
    const targetUrl = `${SUPABASE_URL}${targetPath}`;
    console.log(`Proxying to: ${targetUrl}`);
    
    // Copy headers (exclude problematic ones)
    const headers = new Headers();
    const excludeHeaders = ['host', 'connection', 'content-length'];
    
    req.headers.forEach((value, key) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    
    // Get request body
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        body = await req.text();
      } catch (e) {
        console.error('Error reading request body:', e);
      }
    }
    
    // Check for proxy configuration
    const proxyList = Deno.env.get('DECODO_PROXY_LIST');
    
    // Make the request (with or without proxy)
    let response: Response;
    
    if (proxyList) {
      // Use proxy
      const proxies = proxyList.trim().split('\n').filter(line => line.trim());
      const selectedProxy = proxies[Math.floor(Math.random() * proxies.length)];
      const [proxyHost, portStr, username, password] = selectedProxy.split(':');
      const proxyUrl = `http://${username}:${password}@${proxyHost}:${portStr}`;
      
      console.log(`Using proxy: ${proxyHost}:${portStr}`);
      
      try {
        const client = Deno.createHttpClient({ proxy: { url: proxyUrl } });
        
        response = await fetch(targetUrl, {
          method: req.method,
          headers: headers,
          body: body,
          client: client,
        });
        
        client.close();
      } catch (proxyError) {
        console.error('Proxy failed, falling back to direct:', proxyError);
        
        // Fallback to direct
        response = await fetch(targetUrl, {
          method: req.method,
          headers: headers,
          body: body,
        });
      }
    } else {
      // Direct connection
      console.log('Using direct connection (no proxy configured)');
      
      response = await fetch(targetUrl, {
        method: req.method,
        headers: headers,
        body: body,
      });
    }
    
    console.log(`Response: ${response.status} ${response.statusText}`);
    
    // Build response headers
    const responseHeaders = new Headers(corsHeaders);
    response.headers.forEach((value, key) => {
      // Don't override CORS headers
      if (!corsHeaders.hasOwnProperty(key)) {
        responseHeaders.set(key, value);
      }
    });
    
    // Return response
    const responseBody = await response.arrayBuffer();
    
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('Fatal error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Proxy error',
      message: error.message,
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
