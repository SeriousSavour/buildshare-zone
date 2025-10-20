import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// HTTP CONNECT proxy implementation
async function connectThroughProxy(
  targetHost: string,
  targetPort: number,
  proxy: ProxyServer
): Promise<Deno.Conn> {
  // Connect to proxy server
  const proxyConn = await Deno.connect({
    hostname: proxy.host,
    port: proxy.port,
  });

  // Create Basic Auth header
  const auth = btoa(`${proxy.username}:${proxy.password}`);
  
  // Send CONNECT request
  const connectRequest = [
    `CONNECT ${targetHost}:${targetPort} HTTP/1.1`,
    `Host: ${targetHost}:${targetPort}`,
    `Proxy-Authorization: Basic ${auth}`,
    `Proxy-Connection: Keep-Alive`,
    ``,
    ``
  ].join('\r\n');

  await proxyConn.write(new TextEncoder().encode(connectRequest));

  // Read CONNECT response
  const buffer = new Uint8Array(4096);
  const bytesRead = await proxyConn.read(buffer);
  
  if (!bytesRead) {
    proxyConn.close();
    throw new Error('Proxy connection failed: no response');
  }

  const response = new TextDecoder().decode(buffer.subarray(0, bytesRead));
  
  // Check if CONNECT was successful (HTTP/1.1 200 or HTTP/1.0 200)
  if (!response.startsWith('HTTP/1.1 200') && !response.startsWith('HTTP/1.0 200')) {
    proxyConn.close();
    throw new Error(`Proxy CONNECT failed: ${response.split('\r\n')[0]}`);
  }

  return proxyConn;
}

// Make HTTP request through proxy tunnel
async function fetchThroughProxy(
  targetUrl: string,
  method: string,
  headers: Headers,
  body: string | null,
  proxy: ProxyServer
): Promise<Response> {
  const url = new URL(targetUrl);
  const targetHost = url.hostname;
  const targetPort = url.port || (url.protocol === 'https:' ? 443 : 80);

  // Establish tunnel
  const conn = await connectThroughProxy(targetHost, targetPort, proxy);

  try {
    // For HTTPS, upgrade to TLS
    let stream: Deno.Conn = conn;
    if (url.protocol === 'https:') {
      stream = await Deno.startTls(conn, { hostname: targetHost });
    }

    // Build HTTP request
    const path = url.pathname + url.search;
    const requestLines = [`${method} ${path} HTTP/1.1`, `Host: ${targetHost}`];
    
    // Set Content-Length and Content-Type for POST/PUT requests with body
    if (body) {
      const bodyBytes = new TextEncoder().encode(body);
      headers.set('Content-Length', bodyBytes.length.toString());
      // Force application/json for RPC and other POST requests
      headers.set('Content-Type', 'application/json');
    }
    
    // Add all headers
    headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        requestLines.push(`${key}: ${value}`);
      }
    });
    
    requestLines.push('Connection: close');
    requestLines.push(''); // Empty line to end headers

    const headerText = requestLines.join('\r\n') + '\r\n';
    const requestBytes = new TextEncoder().encode(headerText);
    
    console.log(`[PROXY REQ] ${method} ${path}`);
    if (body) {
      console.log(`[PROXY BODY] ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
      console.log(`[PROXY HEADERS] Content-Type: ${headers.get('Content-Type')}, Content-Length: ${headers.get('Content-Length')}`);
    }
    
    if (body) {
      const bodyBytes = new TextEncoder().encode(body);
      const fullRequest = new Uint8Array(requestBytes.length + bodyBytes.length);
      fullRequest.set(requestBytes, 0);
      fullRequest.set(bodyBytes, requestBytes.length);
      await stream.write(fullRequest);
    } else {
      await stream.write(requestBytes);
    }

    // Read response
    const responseBuffer: Uint8Array[] = [];
    const chunk = new Uint8Array(8192);
    
    while (true) {
      const bytesRead = await stream.read(chunk);
      if (!bytesRead) break;
      responseBuffer.push(chunk.slice(0, bytesRead));
    }

    stream.close();

    // Parse response
    const fullResponse = new Uint8Array(
      responseBuffer.reduce((acc, arr) => acc + arr.length, 0)
    );
    let offset = 0;
    for (const arr of responseBuffer) {
      fullResponse.set(arr, offset);
      offset += arr.length;
    }

    const responseText = new TextDecoder().decode(fullResponse);
    
    // Split headers and body
    const headerEndIndex = responseText.indexOf('\r\n\r\n');
    if (headerEndIndex === -1) {
      throw new Error('Invalid HTTP response: no header delimiter found');
    }
    
    const headerSection = responseText.substring(0, headerEndIndex);
    const bodyStartIndex = headerEndIndex + 4;

    // Parse status line
    const lines = headerSection.split('\r\n');
    const statusLine = lines[0];
    const statusMatch = statusLine.match(/HTTP\/\d\.\d (\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1]) : 500;

    // Parse headers
    const responseHeaders = new Headers();
    for (let i = 1; i < lines.length; i++) {
      const colonIndex = lines[i].indexOf(': ');
      if (colonIndex > 0) {
        const key = lines[i].substring(0, colonIndex);
        const value = lines[i].substring(colonIndex + 2);
        responseHeaders.set(key, value);
      }
    }
    
    // Get body as bytes (not text, to preserve binary data)
    const bodyBytes = fullResponse.slice(bodyStartIndex);
    
    // Handle chunked transfer encoding
    const transferEncoding = responseHeaders.get('transfer-encoding');
    let finalBodyBytes = bodyBytes;
    
    if (transferEncoding?.toLowerCase() === 'chunked') {
      const chunks: Uint8Array[] = [];
      let pos = 0;
      const bodyText = new TextDecoder().decode(bodyBytes);
      
      while (pos < bodyText.length) {
        const chunkSizeEnd = bodyText.indexOf('\r\n', pos);
        if (chunkSizeEnd === -1) break;
        
        const chunkSizeHex = bodyText.substring(pos, chunkSizeEnd).trim();
        const chunkSize = parseInt(chunkSizeHex, 16);
        
        if (chunkSize === 0) break; // Last chunk
        
        pos = chunkSizeEnd + 2;
        const chunkData = bodyBytes.slice(pos, pos + chunkSize);
        chunks.push(chunkData);
        pos += chunkSize + 2; // Skip chunk data and trailing \r\n
      }
      
      // Combine all chunks
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      finalBodyBytes = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of chunks) {
        finalBodyBytes.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Remove chunked encoding header since we decoded it
      responseHeaders.delete('transfer-encoding');
    }
    
    // Handle gzip compression
    const contentEncoding = responseHeaders.get('content-encoding');
    if (contentEncoding?.toLowerCase() === 'gzip') {
      // Decompress gzip
      const decompressed = new DecompressionStream('gzip');
      const reader = new Blob([finalBodyBytes]).stream().pipeThrough(decompressed).getReader();
      const decompressedChunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        decompressedChunks.push(value);
      }
      
      const totalSize = decompressedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      finalBodyBytes = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of decompressedChunks) {
        finalBodyBytes.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Remove gzip encoding header since we decoded it
      responseHeaders.delete('content-encoding');
    }

    return new Response(finalBodyBytes, {
      status,
      headers: responseHeaders,
    });
  } catch (error) {
    conn.close();
    throw error;
  }
}

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
    
    // Copy headers (exclude problematic ones but keep content-length for POST/PUT)
    const headers = new Headers();
    const excludeHeaders = ['host', 'connection', 'transfer-encoding'];
    
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
      // Use HTTP CONNECT tunneling through proxy
      console.log(`↪ Forwarding via proxy ${proxy.host}:${proxy.port}...`);
      
      try {
        // Use actual HTTP CONNECT proxy implementation
        response = await fetchThroughProxy(targetUrl, req.method, headers, body, proxy);
        
        const duration = Date.now() - startTime;
        console.log(`✓ Proxy request successful (${duration}ms)`);
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
      // Direct connection (no proxies configured)
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
