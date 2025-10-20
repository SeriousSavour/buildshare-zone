import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client information
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const referer = req.headers.get('referer') || 'direct';
    
    // Check if request came through proxy
    const viaProxy = req.headers.get('x-proxied') === 'true';
    
    // Detect network characteristics
    const diagnostics = {
      timestamp: new Date().toISOString(),
      client: {
        ip: clientIp,
        userAgent: userAgent,
        referer: referer,
      },
      network: {
        viaProxy: viaProxy,
        proxyDetected: req.headers.get('via') !== null,
        cloudflare: req.headers.get('cf-ray') !== null,
        forwardedProtocol: req.headers.get('x-forwarded-proto') || 'unknown',
      },
      headers: {
        acceptLanguage: req.headers.get('accept-language'),
        acceptEncoding: req.headers.get('accept-encoding'),
        connection: req.headers.get('connection'),
        cacheControl: req.headers.get('cache-control'),
      },
      supabase: {
        region: Deno.env.get('DENO_REGION') || 'unknown',
        deploymentId: Deno.env.get('DENO_DEPLOYMENT_ID') || 'unknown',
      }
    };

    return new Response(JSON.stringify(diagnostics), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Diagnostics-Version': '1.0'
      },
    });
  } catch (error) {
    console.error('Diagnostics error:', error);
    return new Response(JSON.stringify({ 
      error: 'Diagnostics failed',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
