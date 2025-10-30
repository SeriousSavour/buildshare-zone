// Clean API wrapper - no Supabase exposed to browser
const API_BASE = "https://ptmeykacgbrsmvcvwrpp.supabase.co/functions/v1/api-gateway";

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {} } = options;
  
  const sessionToken = localStorage.getItem('session_token');
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bWV5a2FjZ2Jyc212Y3Z3cnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODY3MDAsImV4cCI6MjA3MzQ2MjcwMH0.7J3jVdRgQeiaVvMnH9-xr-mA1fRCVr-JksDK5SklRJI';
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };
  
  if (sessionToken) {
    defaultHeaders['X-Session-Token'] = sessionToken;
  }
  
  const url = `${API_BASE}?path=${encodeURIComponent(endpoint)}`;
  
  console.log(`[API] ${method} ${endpoint}`);
  
  const response = await fetch(url, {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }
  
  return response.json();
}

// API methods
export const api = {
  // Games
  async getGames(filters?: { category?: string; orderBy?: string; limit?: number }) {
    let endpoint = '/rest/v1/games?select=*';
    if (filters?.category) endpoint += `&category=eq.${filters.category}`;
    if (filters?.orderBy) endpoint += `&order=${filters.orderBy}`;
    if (filters?.limit) endpoint += `&limit=${filters.limit}`;
    return apiCall(endpoint);
  },
  
  async getGame(id: string) {
    return apiCall(`/rest/v1/games?select=*&id=eq.${id}`);
  },
  
  async createGame(data: any) {
    const sessionToken = localStorage.getItem('session_token');
    return apiCall('/rest/v1/rpc/create_game_with_context', {
      method: 'POST',
      body: { _session_token: sessionToken, ...data },
    });
  },
  
  async updateGame(id: string, data: any) {
    const sessionToken = localStorage.getItem('session_token');
    // Transform data keys to match RPC function parameters (add underscore prefix)
    const transformedData: any = {};
    if (data.title !== undefined) transformedData._title = data.title;
    if (data.description !== undefined) transformedData._description = data.description;
    if (data.genre !== undefined) transformedData._genre = data.genre;
    if (data.max_players !== undefined) transformedData._max_players = data.max_players;
    if (data.game_url !== undefined) transformedData._game_url = data.game_url;
    if (data.image_url !== undefined) transformedData._image_url = data.image_url;
    
    return apiCall('/rest/v1/rpc/update_game_with_context', {
      method: 'POST',
      body: { _session_token: sessionToken, _game_id: id, ...transformedData },
    });
  },
  
  async deleteGame(id: string) {
    const sessionToken = localStorage.getItem('session_token');
    return apiCall('/rest/v1/rpc/delete_game_with_context', {
      method: 'POST',
      body: { _session_token: sessionToken, _game_id: id },
    });
  },
  
  // Auth
  async login(username: string, password: string) {
    const userId = await apiCall('/rest/v1/rpc/validate_user_login', {
      method: 'POST',
      body: { _username: username, _password: password },
    });
    
    if (userId) {
      const sessionToken = await apiCall('/rest/v1/rpc/create_secure_user_session', {
        method: 'POST',
        body: { _user_id: userId },
      });
      localStorage.setItem('session_token', sessionToken);
      return { success: true, sessionToken };
    }
    throw new Error('Invalid credentials');
  },
  
  async register(username: string, password: string) {
    // Check if username exists
    const exists = await apiCall('/rest/v1/rpc/check_username_exists', {
      method: 'POST',
      body: { _username: username },
    });
    
    if (exists) {
      throw new Error('Username already exists');
    }
    
    // Hash password and create user
    const hash = await apiCall('/rest/v1/rpc/hash_password', {
      method: 'POST',
      body: { _password: password },
    });
    
    // Insert user
    const result = await apiCall('/rest/v1/user_auth', {
      method: 'POST',
      body: { username, password_hash: hash },
      headers: { 'Prefer': 'return=representation' },
    });
    
    return this.login(username, password);
  },
  
  async getCurrentUser() {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return null;
    
    const result = await apiCall('/rest/v1/rpc/get_user_by_session', {
      method: 'POST',
      body: { _session_token: sessionToken },
    });
    
    return result?.[0] || null;
  },
  
  async logout() {
    localStorage.removeItem('session_token');
  },
  
  // Likes
  async toggleLike(gameId: string) {
    const sessionToken = localStorage.getItem('session_token');
    const user = await this.getCurrentUser();
    return apiCall('/rest/v1/rpc/toggle_game_like', {
      method: 'POST',
      body: { _game_id: gameId, _user_id: user.user_id },
    });
  },
  
  async getUserLikes() {
    const user = await this.getCurrentUser();
    if (!user) return [];
    return apiCall(`/rest/v1/game_likes?select=game_id&user_id=eq.${user.user_id}`);
  },
  
  // Profiles
  async getProfile(userId: string) {
    return apiCall(`/rest/v1/profiles?select=*&user_id=eq.${userId}`);
  },
  
  async updateProfile(data: any) {
    const user = await this.getCurrentUser();
    return apiCall(`/rest/v1/profiles?user_id=eq.${user.user_id}`, {
      method: 'PATCH',
      body: data,
    });
  },
  
  // User roles
  async getUserRoles() {
    const user = await this.getCurrentUser();
    if (!user) return [];
    return apiCall(`/rest/v1/user_roles?select=role&user_id=eq.${user.user_id}`);
  },
};
