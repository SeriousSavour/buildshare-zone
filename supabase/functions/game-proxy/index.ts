import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const gameUrl = url.searchParams.get('url');
    
    if (!gameUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GAME PROXY] Fetching:', gameUrl);

    // Fetch the external game content
    const gameResponse = await fetch(gameUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!gameResponse.ok) {
      throw new Error(`Failed to fetch game: ${gameResponse.status}`);
    }

    let content = await gameResponse.text();
    const contentType = gameResponse.headers.get('content-type') || 'text/html';

    console.log('[GAME PROXY] Fetched content type:', contentType);
    console.log('[GAME PROXY] Content length:', content.length);

    // If it's HTML, rewrite URLs to be absolute
    if (contentType.includes('text/html')) {
      const baseUrl = new URL(gameUrl);
      const baseUrlString = `${baseUrl.protocol}//${baseUrl.host}`;
      
      // Fix relative URLs in HTML
      content = content
        // Fix relative src attributes
        .replace(/src=["'](?!https?:\/\/|\/\/|data:)([^"']+)["']/gi, (match, p1) => {
          const absoluteUrl = new URL(p1, gameUrl).href;
          return `src="${absoluteUrl}"`;
        })
        // Fix relative href attributes
        .replace(/href=["'](?!https?:\/\/|\/\/|#|javascript:|data:)([^"']+)["']/gi, (match, p1) => {
          const absoluteUrl = new URL(p1, gameUrl).href;
          return `href="${absoluteUrl}"`;
        })
        // Add base tag if not present
        .replace(/<head>/i, `<head>\n  <base href="${baseUrlString}/">`);
      
      console.log('[GAME PROXY] Rewritten HTML preview:', content.substring(0, 500));
    }

    // Return the proxied content with appropriate headers
    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        // Remove X-Frame-Options to allow embedding
        // Add permissive CSP to allow all resources
        'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *;",
      },
    });

  } catch (error) {
    console.error('[GAME PROXY] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch game content',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
