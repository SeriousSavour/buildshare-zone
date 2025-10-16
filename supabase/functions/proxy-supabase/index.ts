import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-proxy-key, x-signature, x-timestamp',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
};

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute per IP

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security Layer 1: API Key Authentication
    const proxyApiKey = Deno.env.get('PROXY_API_KEY');
    const clientApiKey = req.headers.get('x-proxy-key');
    
    if (!proxyApiKey) {
      console.error('❌ PROXY_API_KEY not configured in environment');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!clientApiKey || clientApiKey !== proxyApiKey) {
      console.warn('⚠️ Invalid or missing API key');
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Security Layer 2: Request Signature Verification (HMAC)
    const signature = req.headers.get('x-signature');
    const timestamp = req.headers.get('x-timestamp');
    
    if (!signature || !timestamp) {
      console.warn('⚠️ Missing signature or timestamp');
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Verify timestamp is recent (within 5 minutes)
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    if (Math.abs(currentTime - requestTime) > 300000) {
      console.warn('⚠️ Request timestamp too old or invalid');
      return new Response(JSON.stringify({ error: 'Unauthorized: Request expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Verify HMAC signature
    const url = new URL(req.url);
    const targetPath = url.searchParams.get('path') || '';
    const signaturePayload = `${req.method}:${targetPath}:${timestamp}`;
    const expectedSignature = await computeHmac(signaturePayload, proxyApiKey);
    
    if (signature !== expectedSignature) {
      console.warn('⚠️ Invalid request signature');
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Security Layer 3: IP-based Rate Limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(clientIp)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${clientIp}`);
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`✅ Security checks passed for IP: ${clientIp}`);
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

// Helper function to compute HMAC-SHA256 signature
async function computeHmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
