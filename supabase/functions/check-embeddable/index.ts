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
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize and validate URL
    let normalizedUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Block http URLs (mixed content issue)
    if (normalizedUrl.startsWith('http://')) {
      return new Response(
        JSON.stringify({
          embeddable: false,
          reason: 'mixed-content',
          message: 'Only HTTPS links are allowed to prevent mixed content issues',
          url: normalizedUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHECK-EMBEDDABLE] Checking:', normalizedUrl);

    // Fetch headers
    const response = await fetch(normalizedUrl, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const xfo = (response.headers.get('x-frame-options') || '').toLowerCase();
    const csp = response.headers.get('content-security-policy') || '';
    
    // Check frame-ancestors in CSP
    const frameAncestorsMatch = /frame-ancestors\s+([^;]+)/i.exec(csp);
    const frameAncestors = (frameAncestorsMatch?.[1] || '').toLowerCase();

    // Determine if blocked
    const blockedByXFO = xfo.includes('deny') || xfo.includes('sameorigin');
    const blockedByCSP = frameAncestors.includes("'none'");
    const isBlocked = blockedByXFO || blockedByCSP;

    let reason = 'allowed';
    let message = 'This content can be embedded';

    if (blockedByXFO) {
      reason = 'x-frame-options';
      message = `Site blocks embedding via X-Frame-Options: ${xfo}`;
    } else if (blockedByCSP) {
      reason = 'csp-frame-ancestors';
      message = 'Site blocks embedding via Content-Security-Policy';
    }

    console.log('[CHECK-EMBEDDABLE] Result:', {
      embeddable: !isBlocked,
      xfo,
      frameAncestors,
      reason
    });

    return new Response(
      JSON.stringify({
        embeddable: !isBlocked,
        ok: response.ok,
        status: response.status,
        reason,
        message,
        xfo,
        frameAncestors,
        url: normalizedUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CHECK-EMBEDDABLE] Error:', error);
    return new Response(
      JSON.stringify({
        embeddable: false,
        reason: 'fetch-error',
        message: 'Failed to check if content can be embedded',
        error: error.message
      }),
      { 
        status: 502, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
