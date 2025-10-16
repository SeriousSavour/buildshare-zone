import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProxyServer {
  host: string;
  port: number;
  username: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get BrightData proxy configuration
    const proxyListEnv = Deno.env.get('BRIGHTDATA_PROXY_LIST');
    
    if (!proxyListEnv) {
      return new Response(
        JSON.stringify({ 
          error: 'BRIGHTDATA_PROXY_LIST not configured',
          message: 'Please add the BrightData proxy list secret and redeploy'
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const proxyList: ProxyServer[] = JSON.parse(proxyListEnv);
    const proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
    
    console.log(`Testing with proxy: ${proxy.host}:${proxy.port}`);

    // Test 1: Get IP address through proxy
    const ipTestUrl = 'https://api.ipify.org?format=json';
    
    let proxyResult;
    try {
      const proxyAuth = btoa(`${proxy.username}:${proxy.password}`);
      
      const response = await fetch(ipTestUrl, {
        headers: {
          'Proxy-Authorization': `Basic ${proxyAuth}`,
        },
      });
      
      const ipData = await response.json();
      
      // Get location info for this IP
      const locationResponse = await fetch(`http://ip-api.com/json/${ipData.ip}`);
      const locationData = await locationResponse.json();
      
      proxyResult = {
        success: true,
        ip: ipData.ip,
        location: {
          country: locationData.country,
          city: locationData.city,
          region: locationData.regionName,
          isp: locationData.isp,
          timezone: locationData.timezone,
        },
        proxy: `${proxy.host}:${proxy.port}`,
        timestamp: new Date().toISOString(),
      };
      
      console.log('✓ Proxy test successful:', proxyResult);
      
    } catch (error) {
      console.error('✗ Proxy test failed:', error);
      proxyResult = {
        success: false,
        error: error.message,
        proxy: `${proxy.host}:${proxy.port}`,
      };
    }

    // Test 2: Get direct IP (without proxy) for comparison
    let directResult;
    try {
      const directResponse = await fetch(ipTestUrl);
      const directIpData = await directResponse.json();
      
      const directLocationResponse = await fetch(`http://ip-api.com/json/${directIpData.ip}`);
      const directLocationData = await directLocationResponse.json();
      
      directResult = {
        ip: directIpData.ip,
        location: {
          country: directLocationData.country,
          city: directLocationData.city,
          region: directLocationData.regionName,
        },
      };
      
    } catch (error) {
      console.error('✗ Direct test failed:', error);
      directResult = { error: error.message };
    }

    return new Response(
      JSON.stringify({
        proxyTest: proxyResult,
        directTest: directResult,
        message: 'Call this endpoint multiple times to verify IP rotation',
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
