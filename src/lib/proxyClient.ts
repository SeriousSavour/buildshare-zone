import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ptmeykacgbrsmvcvwrpp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bWV5a2FjZ2Jyc212Y3Z3cnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODY3MDAsImV4cCI6MjA3MzQ2MjcwMH0.7J3jVdRgQeiaVvMnH9-xr-mA1fRCVr-JksDK5SklRJI";
const PROXY_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/proxy-supabase`;

// Create a custom fetch function that routes through our proxy
const proxyFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  
  // Only proxy Supabase API calls (excluding storage and edge functions)
  if (url.includes('supabase.co') && !url.includes('/storage/') && !url.includes('/functions/')) {
    try {
      const targetUrl = new URL(url);
      const targetPath = targetUrl.pathname + targetUrl.search;
      
      const proxyUrl = `${PROXY_FUNCTION_URL}?path=${encodeURIComponent(targetPath)}`;
      
      console.log('[Proxy] Routing:', targetPath);
      
      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(proxyUrl, {
        ...init,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok && response.status >= 500) {
        throw new Error(`Proxy server error: ${response.status}`);
      }
      
      console.log('[Proxy] Success:', response.status);
      return response;
    } catch (error) {
      console.warn('[Proxy] Failed, using direct connection:', error.message);
      
      // Fallback to direct connection
      try {
        return await fetch(input, init);
      } catch (directError) {
        console.error('[Direct] Also failed:', directError);
        throw directError;
      }
    }
  }
  
  // For non-Supabase requests or storage/functions, use normal fetch
  return fetch(input, init);
};

export const supabaseWithProxy = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: proxyFetch,
  },
});
