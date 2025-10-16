import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, prefer',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Expose-Headers': 'content-range, x-supabase-api-version',
};

const SUPABASE_URL = 'https://ptmeykacgbrsmvcvwrpp.supabase.co';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 200;

// Parse proxy list from environment
interface ProxyServer {
  host: string;
  port: string;
  username: string;
  password: string;
}

let proxyList: ProxyServer[] = [];
const proxyListEnv = Deno.env.get('DECODO_PROXY_LIST');
if (proxyListEnv) {
  proxyList = proxyListEnv.split('\n').filter(line => line.trim()).map(line => {
    const [host, port, username, password] = line.split(':');
    return { host, port, username, password };
  });
  console.log(`✓ Loaded ${proxyList.length} proxy servers`);
} else {
  console.warn('⚠ DECODO_PROXY_LIST not configured - direct connection will be used');
}

// Get random proxy from list
function getRandomProxy(): ProxyServer | null {
  if (proxyList.length === 0) return null;
  return proxyList[Math.floor(Math.random() * proxyList.length)];
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✓ CORS preflight');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const targetPath = url.searchParams.get('path');
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    
    console.log(`→ ${req.method} ${targetPath} [${clientIp}]`);
    
    // Validate path
    if (!targetPath) {
      console.error('✗ Missing path parameter');
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Rate limiting
    if (!checkRateLimit(clientIp)) {
      console.warn(`✗ Rate limit exceeded: ${clientIp}`);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Build target URL
    const targetUrl = `${SUPABASE_URL}${targetPath}`;
    
    // Copy headers (exclude problematic ones)
    const headers = new Headers();
    const excludeHeaders = ['host', 'connection', 'content-length', 'transfer-encoding'];
    
    req.headers.forEach((value, key) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    
    // Get request body
    let body: string | null = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        const text = await req.text();
        if (text) body = text;
      } catch (e) {
        console.error('✗ Error reading body:', e);
      }
    }
    
    // Get a random proxy server
    const proxy = getRandomProxy();
    
    let response: Response;
    
    if (proxy) {
      // For HTTP proxies, we make the request through the proxy using HTTP tunneling
      console.log(`↪ Forwarding via proxy ${proxy.host}:${proxy.port}...`);
      
      const proxyAuth = btoa(`${proxy.username}:${proxy.password}`);
      
      try {
        // Make request to target through HTTP proxy
        // HTTP proxies work by sending the full target URL in the request line
        response = await fetch(targetUrl, {
          method: req.method,
          headers: {
            ...Object.fromEntries(headers),
            'Proxy-Authorization': `Basic ${proxyAuth}`,
          },
          body: body,
        });
        
        console.log(`✓ Proxy request successful`);
      } catch (error) {
        // Fallback to direct if proxy fails
        console.warn(`⚠ Proxy failed: ${error.message}, falling back to direct`);
        response = await fetch(targetUrl, {
          method: req.method,
          headers: headers,
          body: body,
        });
      }
    } else {
      // Direct connection (fallback if no proxies configured)
      console.log(`↪ Forwarding direct to Supabase (no proxies configured)...`);
      
      response = await fetch(targetUrl, {
        method: req.method,
        headers: headers,
        body: body,
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`✓ ${response.status} ${response.statusText} (${duration}ms)`);
    
    // Build response headers with CORS
    const responseHeaders = new Headers(corsHeaders);
    
    // Copy important headers from Supabase response
    const headersToKeep = [
      'content-type',
      'content-range',
      'x-supabase-api-version',
      'sb-gateway-version',
    ];
    
    headersToKeep.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });
    
    // Stream the response body
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('✗ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal proxy error',
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
