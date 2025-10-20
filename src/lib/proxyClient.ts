import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ptmeykacgbrsmvcvwrpp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bWV5a2FjZ2Jyc212Y3Z3cnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODY3MDAsImV4cCI6MjA3MzQ2MjcwMH0.7J3jVdRgQeiaVvMnH9-xr-mA1fRCVr-JksDK5SklRJI";
const PROXY_URL = `${SUPABASE_URL}/functions/v1/proxy-supabase`;

// Create a custom fetch function that routes through our proxy
const proxyFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  
  // Don't proxy the proxy endpoint itself or other edge functions
  if (url.includes('/functions/v1/')) {
    return fetch(input, init);
  }
  
  // Proxy all Supabase REST API and storage calls
  if (url.includes('supabase.co')) {
    const targetUrl = new URL(url);
    const targetPath = targetUrl.pathname + targetUrl.search;
    
    const proxyUrl = `${PROXY_URL}?path=${encodeURIComponent(targetPath)}`;
    
    console.log(`[PROXY ATTEMPT] ${init?.method || 'GET'} ${targetPath}`);
    
    try {
      // Try proxy first
      const response = await fetch(proxyUrl, init);
      
      if (response.ok) {
        console.log(`[PROXY SUCCESS] ${response.status}`);
        return response;
      }
      
      console.warn(`[PROXY FAILED] ${response.status}, falling back to direct`);
    } catch (error) {
      console.error(`[PROXY ERROR]`, error);
    }
    
    // Fallback to direct connection
    console.log(`[DIRECT] ${init?.method || 'GET'} ${targetPath}`);
    return await fetch(input, init);
  }
  
  // For non-Supabase requests: direct
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
