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
    // Try IPRoyal first, then BrightData
    let proxyList: ProxyServer[] = [];
    let proxyType = 'none';
    
    const iproyalEnv = Deno.env.get('IPROYAL_PROXY_LIST');
    if (iproyalEnv) {
      try {
        proxyList = JSON.parse(iproyalEnv);
        proxyType = 'IPRoyal';
        console.log(`Using IPRoyal with ${proxyList.length} servers`);
      } catch (e) {
        console.error('Failed to parse IPROYAL_PROXY_LIST:', e);
      }
    }
    
    if (proxyList.length === 0) {
      const brightdataEnv = Deno.env.get('BRIGHTDATA_PROXY_LIST');
      if (brightdataEnv) {
        try {
          proxyList = JSON.parse(brightdataEnv);
          proxyType = 'BrightData';
          console.log(`Using BrightData with ${proxyList.length} servers`);
        } catch (e) {
          console.error('Failed to parse BRIGHTDATA_PROXY_LIST:', e);
        }
      }
    }
    
    if (proxyList.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No proxy configured',
          message: 'Neither IPROYAL_PROXY_LIST nor BRIGHTDATA_PROXY_LIST is configured',
          note: 'The system will work with direct connections, but proxy testing is not available'
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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
        proxyType,
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
