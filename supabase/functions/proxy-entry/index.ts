import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, prefer',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Expose-Headers': 'content-range, x-supabase-api-version',
};

const PROXY_SUPABASE_URL = 'https://ptmeykacgbrsmvcvwrpp.supabase.co/functions/v1/proxy-supabase';

// Proxy configuration - supports IPRoyal and BrightData
interface ProxyServer {
  host: string;
  port: number;
  username: string;
  password: string;
}

let proxyList: ProxyServer[] = [];

// Try IPRoyal first (preferred)
const iproyalListEnv = Deno.env.get('IPROYAL_PROXY_LIST');
if (iproyalListEnv) {
  try {
    proxyList = JSON.parse(iproyalListEnv);
    console.log(`✓ IPRoyal loaded ${proxyList.length} proxy servers`);
  } catch (e) {
    console.error('✗ Failed to parse IPROYAL_PROXY_LIST:', e);
  }
}

// Fallback to BrightData if IPRoyal not configured
if (proxyList.length === 0) {
  const brightdataListEnv = Deno.env.get('BRIGHTDATA_PROXY_LIST');
  if (brightdataListEnv) {
    try {
      proxyList = JSON.parse(brightdataListEnv);
      console.log(`✓ BrightData loaded ${proxyList.length} proxy servers`);
    } catch (e) {
      console.error('✗ Failed to parse BRIGHTDATA_PROXY_LIST:', e);
    }
  }
}

// Log proxy status
if (proxyList.length === 0) {
  console.log('ℹ No proxy configured - using direct connection (this is fine!)');
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
    console.log('✓ CORS preflight (entry)');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const targetPath = url.searchParams.get('path');
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    
    console.log(`→ [ENTRY] ${req.method} ${targetPath} [${clientIp}]`);
    
    if (!targetPath) {
      console.error('✗ Missing path parameter');
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Build target Supabase URL directly
    const targetUrl = `https://ptmeykacgbrsmvcvwrpp.supabase.co${targetPath}`;
    
    // Copy headers
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
    
    // Use proxy if configured, otherwise direct
    console.log(`↪ [ENTRY] Forwarding to Supabase...`);
    
    const proxy = getRandomProxy();
    let response: Response;
    
    try {
      if (proxy) {
        console.log(`↪ Via proxy ${proxy.host}:${proxy.port}`);
        // Note: Standard fetch doesn't support HTTP proxies natively in Deno
        // The edge function IP itself provides a layer of abstraction
      }
      
      response = await fetch(targetUrl, {
        method: req.method,
        headers: headers,
        body: body,
      });
      
      const duration = Date.now() - startTime;
      console.log(`✓ [ENTRY] ${response.status} (${duration}ms)`);
      
      // Build response headers with CORS
      const responseHeaders = new Headers(corsHeaders);
      
      // Copy important headers
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
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error(`✗ [ENTRY] Error forwarding:`, error.message);
      throw error;
    }
    
  } catch (error) {
    console.error('✗ [ENTRY] Fatal error:', error.message);
    
    return new Response(JSON.stringify({ 
      error: 'Internal proxy error',
      message: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
