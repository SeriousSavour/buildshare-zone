// Simplified client - browser only knows about API wrapper
export { api } from '@/lib/api';

// Legacy export for compatibility (will be removed)
import { supabaseWithProxy } from '@/lib/proxyClient';
export const supabase = supabaseWithProxy;