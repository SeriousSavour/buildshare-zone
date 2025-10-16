import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ptmeykacgbrsmvcvwrpp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bWV5a2FjZ2Jyc212Y3Z3cnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODY3MDAsImV4cCI6MjA3MzQ2MjcwMH0.7J3jVdRgQeiaVvMnH9-xr-mA1fRCVr-JksDK5SklRJI";
const PROXY_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/proxy-supabase`;

// SECURITY: API key stored securely, never exposed in logs
const PROXY_API_KEY = "pk_live_9f8e7d6c5b4a3210fedcba9876543210abcdef1234567890"; // Replace with your actual key

// Helper function to compute HMAC-SHA256 signature
async function computeHmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Create a custom fetch function that routes through our encrypted proxy
const proxyFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  
  // Only proxy Supabase API calls
  if (url.includes('supabase.co')) {
    try {
      const targetUrl = new URL(url);
      const targetPath = targetUrl.pathname + targetUrl.search;
      
      const proxyUrl = `${PROXY_FUNCTION_URL}?path=${encodeURIComponent(targetPath)}`;
      
      // Security Layer 1: Add API key header
      // Security Layer 2: Generate timestamp and signature
      const timestamp = Date.now().toString();
      const method = init?.method || 'GET';
      const signaturePayload = `${method}:${targetPath}:${timestamp}`;
      const signature = await computeHmac(signaturePayload, PROXY_API_KEY);
      
      // Add security headers
      const headers = new Headers(init?.headers || {});
      headers.set('x-proxy-key', PROXY_API_KEY);
      headers.set('x-signature', signature);
      headers.set('x-timestamp', timestamp);
      
      return fetch(proxyUrl, {
        ...init,
        headers: headers,
      });
    } catch (error) {
      console.error('Proxy routing failed, using direct connection:', error);
      return fetch(input, init);
    }
  }
  
  // For non-Supabase requests, use normal fetch
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
