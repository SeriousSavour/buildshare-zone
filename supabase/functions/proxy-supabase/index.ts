import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
};

// Helper function to make HTTP CONNECT tunnel request through proxy
async function makeProxyRequest(
  targetUrl: string,
  proxyHost: string,
  proxyPort: number,
  username: string,
  password: string,
  method: string,
  headers: Headers,
  body: string | null
): Promise<Response> {
  try {
    // Create proxy connection using HTTP CONNECT tunnel
    const proxyUrl = `http://${proxyHost}:${proxyPort}`;
    const targetHostname = new URL(targetUrl).hostname;
    
    console.log(`Establishing HTTP CONNECT tunnel to ${targetHostname} via ${proxyHost}:${proxyPort}`);
    
    // Open TCP connection to proxy
    const conn = await Deno.connect({ 
      hostname: proxyHost, 
      port: proxyPort 
    });
    
    // Send CONNECT request
    const proxyAuth = btoa(`${username}:${password}`);
    const connectRequest = [
      `CONNECT ${targetHostname}:443 HTTP/1.1`,
      `Host: ${targetHostname}:443`,
      `Proxy-Authorization: Basic ${proxyAuth}`,
      `Proxy-Connection: Keep-Alive`,
      ``,
      ``
    ].join('\r\n');
    
    await conn.write(new TextEncoder().encode(connectRequest));
    
    // Read CONNECT response
    const connectResponse = new Uint8Array(1024);
    const n = await conn.read(connectResponse);
    const responseText = new TextDecoder().decode(connectResponse.subarray(0, n!));
    
    if (!responseText.includes('200')) {
      conn.close();
      throw new Error(`Proxy CONNECT failed: ${responseText}`);
    }
    
    console.log('HTTP CONNECT tunnel established successfully');
    
    // Now we have a tunneled connection, upgrade to TLS
    const tlsConn = await Deno.startTls(conn, { hostname: targetHostname });
    
    // Build HTTP request to send through tunnel
    const requestHeaders = new Headers(headers);
    requestHeaders.set('Host', targetHostname);
    
    let httpRequest = `${method} ${new URL(targetUrl).pathname}${new URL(targetUrl).search} HTTP/1.1\r\n`;
    requestHeaders.forEach((value, key) => {
      httpRequest += `${key}: ${value}\r\n`;
    });
    httpRequest += '\r\n';
    
    if (body) {
      httpRequest += body;
    }
    
    await tlsConn.write(new TextEncoder().encode(httpRequest));
    
    // Read response
    const responseBuffer = new Uint8Array(65536);
    const responseN = await tlsConn.read(responseBuffer);
    const fullResponse = new TextDecoder().decode(responseBuffer.subarray(0, responseN!));
    
    // Parse HTTP response
    const [headersPart, ...bodyParts] = fullResponse.split('\r\n\r\n');
    const [statusLine, ...headerLines] = headersPart.split('\r\n');
    const statusMatch = statusLine.match(/HTTP\/1\.\d (\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1]) : 200;
    
    const responseHeaders = new Headers();
    for (const line of headerLines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        responseHeaders.set(key, value);
      }
    }
    
    tlsConn.close();
    
    return new Response(bodyParts.join('\r\n\r\n'), {
      status,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('Proxy request error:', error);
    // Fallback to direct request if proxy fails
    console.log('Falling back to direct request');
    return fetch(targetUrl, { method, headers, body });
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const proxyList = Deno.env.get('DECODO_PROXY_LIST');
    if (!proxyList) {
      console.warn('DECODO_PROXY_LIST not configured, using direct connection');
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

    // Parse proxy list and randomly select one (rotating proxy)
    const proxies = proxyList.trim().split('\n').filter(line => line.trim());
    const selectedProxy = proxies[Math.floor(Math.random() * proxies.length)];
    
    // Parse proxy credentials: gate.decodo.com:10001:speeleczsj:7nJO=ru8fsCnu4e2sL
    const [proxyHost, portStr, username, password] = selectedProxy.split(':');
    const proxyPort = parseInt(portStr);
    
    console.log(`🔄 Rotating proxy selected: ${proxyHost}:${proxyPort}`);

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

    console.log(`🌐 Proxying ${req.method} request to: ${supabaseUrl}`);
    
    // Make request through the rotating proxy
    const supabaseResponse = await makeProxyRequest(
      supabaseUrl,
      proxyHost,
      proxyPort,
      username,
      password,
      req.method,
      headers,
      body
    );

    console.log(`✅ Proxy request completed with status: ${supabaseResponse.status}`);

    // Forward response with CORS headers
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
    console.error('❌ Proxy error:', error);
    return new Response(JSON.stringify({ 
      error: 'Proxy routing failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
