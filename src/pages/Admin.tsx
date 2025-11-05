import { useState, useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Users, Flag, ScrollText, Shield, Trash2, UserPlus, UserMinus, Search, Megaphone, Ban, BarChart3, Plus, X, Gamepad2, Settings } from "lucide-react";
import SiteSettingsPanel from "@/components/admin/SiteSettingsPanel";
import { ChristmasThemeToggle } from "@/components/theme/ChristmasThemeToggle";

interface Particle {
  id: number;
  emoji: string;
  left: number;
  animationDuration: number;
  size: number;
}

interface User {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: 'admin' | 'user';
}

interface ContentFlag {
  id: string;
  content_type: string;
  content_id: string;
  user_id: string;
  flagged_content: string;
  violation_words: string[];
  severity: string;
  status: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  created_at: string;
  admin_username: string;
  action: string;
  target_username: string;
  details: any;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface BlockedWord {
  id: string;
  word: string;
  severity: string;
  created_at: string;
}

interface Game {
  id: string;
  title: string;
  description: string | null;
  genre: string;
  creator_name: string;
  image_url: string | null;
  likes: number;
  plays: number;
  created_at: string;
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  email: string;
  status: string;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const Admin = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contentFlags, setContentFlags] = useState<ContentFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalGames: 0, activeFlags: 0, totalPlays: 0 });
  
  // Network diagnostics state
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [testResults, setTestResults] = useState<{
    directRest: 'pending' | 'success' | 'blocked' | 'error';
    gatewayRest: 'pending' | 'success' | 'blocked' | 'error';
    diagnosticsApi: 'pending' | 'success' | 'blocked' | 'error';
  }>({
    directRest: 'pending',
    gatewayRest: 'pending',
    diagnosticsApi: 'pending',
  });
  
  const [searchUsername, setSearchUsername] = useState("");
  const [promoteUsername, setPromoteUsername] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Announcement form
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState("info");
  
  // Blocked word form
  const [newBlockedWord, setNewBlockedWord] = useState("");
  const [wordSeverity, setWordSeverity] = useState("moderate");
  
  // Game editing state
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editGameTitle, setEditGameTitle] = useState("");
  const [editGameDescription, setEditGameDescription] = useState("");
  const [editGameGenre, setEditGameGenre] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    const emojis = ['🎃', '👻', '🍁', '🦇', '🍂', '💀', '🕷️', '🌙'];
    let particleId = 0;

    const generateParticle = () => {
      const particle: Particle = {
        id: particleId++,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        left: Math.random() * 100,
        animationDuration: 8 + Math.random() * 8,
        size: 0.8 + Math.random() * 3,
      };
      
      setParticles(prev => [...prev, particle]);

      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== particle.id));
      }, particle.animationDuration * 1000);
    };

    const interval = setInterval(() => {
      generateParticle();
    }, 600);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchContentFlags();
    fetchAuditLogs();
    fetchAnnouncements();
    fetchBlockedWords();
    fetchGames();
    fetchStats();
    fetchBugReports();
    fetchContactMessages();
  }, []);

  const fetchUsers = async (retryCount = 0) => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) {
      toast({
        title: "Authentication Error",
        description: "No session token found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add timeout to prevent hanging on restricted networks
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout")), 15000)
      );

      const rpcPromise = supabase.rpc("get_users_with_roles", {
        _admin_session_token: sessionToken,
      });

      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

      if (error) {
        // Check if it's a token validation error
        if (error.message?.includes("token") || error.message?.includes("session")) {
          throw new Error("Session expired or invalid. Please log in again.");
        }
        throw error;
      }

      setUsers(data || []);
      console.log("✅ Users loaded successfully:", data?.length || 0);
    } catch (error: any) {
      console.error("❌ Failed to fetch users:", error);
      
      // Retry logic for network errors (but not auth errors)
      if (retryCount < 2 && error.message === "Request timeout") {
        console.log(`🔄 Retrying user fetch (attempt ${retryCount + 2}/3)...`);
        setTimeout(() => fetchUsers(retryCount + 1), 2000);
        return;
      }

      toast({
        title: "Error Loading Users",
        description: error.message || "Network error. Check your connection and try refreshing.",
        variant: "destructive",
      });
    }
  };

  const fetchContentFlags = async () => {
    try {
      const { data, error } = await supabase
        .from("content_flags")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setContentFlags(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAuditLogs = async () => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    try {
      const { data, error } = await supabase.rpc("get_audit_logs", {
        _admin_session_token: sessionToken,
        _limit: 50,
      });

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async (userId: string) => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("ban_user", {
        _target_user_id: userId,
        _admin_session_token: sessionToken,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User banned successfully",
      });
      fetchUsers();
      fetchAuditLogs();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async () => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken || !promoteUsername) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("promote_user_to_admin", {
        _target_username: promoteUsername,
        _admin_session_token: sessionToken,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${promoteUsername} promoted to admin`,
      });
      setPromoteUsername("");
      fetchUsers();
      fetchAuditLogs();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoteUser = async (username: string) => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("demote_admin_to_user", {
        _target_username: username,
        _admin_session_token: sessionToken,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${username} demoted to user`,
      });
      fetchUsers();
      fetchAuditLogs();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFlag = async (flagId: string) => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("update_content_flag", {
        _flag_id: flagId,
        _status: "resolved",
        _admin_action: "reviewed",
        _admin_session_token: sessionToken,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Flag resolved",
      });
      fetchContentFlags();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error("Error fetching announcements:", error);
    }
  };

  const fetchBlockedWords = async () => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    try {
      const { data, error } = await supabase
        .from("blocked_words")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlockedWords(data || []);
    } catch (error: any) {
      console.error("Error fetching blocked words:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersResult, gamesResult, flagsResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("games").select("plays", { count: "exact" }),
        supabase.from("content_flags").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const totalPlays = gamesResult.data?.reduce((sum, game) => sum + (game.plays || 0), 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalGames: gamesResult.count || 0,
        activeFlags: flagsResult.count || 0,
        totalPlays: totalPlays,
      });
      
      console.log("📊 Admin stats updated:", {
        totalUsers: usersResult.count,
        totalGames: gamesResult.count,
        activeFlags: flagsResult.count,
        totalPlays
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch admin stats",
        variant: "destructive",
      });
    }
  };

  const fetchBugReports = async () => {
    try {
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBugReports(data || []);
    } catch (error: any) {
      console.error("Error fetching bug reports:", error);
    }
  };

  const fetchContactMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContactMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching contact messages:", error);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle || !announcementMessage) {
      toast({
        title: "Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase.rpc("get_user_by_session", {
        _session_token: sessionToken,
      });

      if (!userData || userData.length === 0) throw new Error("Invalid session");

      const { error } = await supabase.from("announcements").insert({
        title: announcementTitle,
        message: announcementMessage,
        type: announcementType,
        created_by: userData[0].user_id,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement created",
      });
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAnnouncement = async (id: string, isActive: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Announcement ${!isActive ? "activated" : "deactivated"}`,
      });
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement deleted",
      });
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlockedWord = async () => {
    if (!newBlockedWord.trim()) {
      toast({
        title: "Error",
        description: "Word cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    setLoading(true);
    try {
      await supabase.rpc('set_session_context', { _session_token: sessionToken });
      
      const { error } = await supabase.from("blocked_words").insert({
        word: newBlockedWord.toLowerCase().trim(),
        severity: wordSeverity,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blocked word added",
      });
      setNewBlockedWord("");
      fetchBlockedWords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlockedWord = async (id: string) => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;
    
    setLoading(true);
    try {
      await supabase.rpc('set_session_context', { _session_token: sessionToken });
      
      const { error } = await supabase.from("blocked_words").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blocked word removed",
      });
      fetchBlockedWords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error: any) {
      console.error("Error fetching games:", error);
    }
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setEditGameTitle(game.title);
    setEditGameDescription(game.description || "");
    setEditGameGenre(game.genre);
  };

  const handleUpdateGame = async () => {
    if (!editingGame || !editGameTitle.trim()) {
      toast({
        title: "Error",
        description: "Game title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('session_token');
      
      const { error } = await supabase.rpc('update_game_with_context', {
        _session_token: sessionToken,
        _game_id: editingGame.id,
        _title: editGameTitle.trim(),
        _description: editGameDescription.trim() || null,
        _genre: editGameGenre,
      });

      if (error) throw error;

      // Clear games cache so the Games page updates
      localStorage.removeItem('games_cache_v2');
      localStorage.removeItem('games_cache_v2_timestamp');

      toast({
        title: "Success",
        description: "Game updated successfully",
      });
      
      setEditingGame(null);
      setEditGameTitle("");
      setEditGameDescription("");
      setEditGameGenre("");
      fetchGames();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update game',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!window.confirm("Are you sure you want to delete this game?")) {
      return;
    }

    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("delete_game_with_context", {
        _session_token: sessionToken,
        _game_id: gameId,
      });

      if (error) throw error;

      // Clear games cache so the Games page updates
      localStorage.removeItem('games_cache_v2');
      localStorage.removeItem('games_cache_v2_timestamp');

      toast({
        title: "Success",
        description: "Game deleted successfully",
      });
      fetchGames();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runNetworkDiagnostics = async () => {
    setLoading(true);
    setTestResults({
      directRest: 'pending',
      gatewayRest: 'pending',
      diagnosticsApi: 'pending',
    });

    // Test 1: Direct REST API call
    try {
      const response = await fetch('https://ptmeykacgbrsmvcvwrpp.supabase.co/rest/v1/games?select=id&limit=1', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bWV5a2FjZ2Jyc212Y3Z3cnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODY3MDAsImV4cCI6MjA3MzQ2MjcwMH0.7J3jVdRgQeiaVvMnH9-xr-mA1fRCVr-JksDK5SklRJI'
        }
      });
      setTestResults(prev => ({
        ...prev,
        directRest: response.ok ? 'success' : 'error'
      }));
    } catch {
      setTestResults(prev => ({ ...prev, directRest: 'blocked' }));
    }

    // Test 2: Gateway REST API call
    try {
      const response = await fetch('https://ptmeykacgbrsmvcvwrpp.supabase.co/functions/v1/api-gateway?path=/rest/v1/games?select=id&limit=1', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bWV5a2FjZ2Jyc212Y3Z3cnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODY3MDAsImV4cCI6MjA3MzQ2MjcwMH0.7J3jVdRgQeiaVvMnH9-xr-mA1fRCVr-JksDK5SklRJI'
        }
      });
      setTestResults(prev => ({
        ...prev,
        gatewayRest: response.ok ? 'success' : 'error'
      }));
    } catch {
      setTestResults(prev => ({ ...prev, gatewayRest: 'blocked' }));
    }

    // Test 3: Network diagnostics API
    try {
      const response = await fetch('https://ptmeykacgbrsmvcvwrpp.supabase.co/functions/v1/network-diagnostics');
      const data = await response.json();
      setDiagnosticsData(data);
      setTestResults(prev => ({
        ...prev,
        diagnosticsApi: response.ok ? 'success' : 'error'
      }));
    } catch {
      setTestResults(prev => ({ ...prev, diagnosticsApi: 'blocked' }));
    }

    setLoading(false);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchUsername.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Falling Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.left}%`,
              top: '-100px',
              fontSize: `${particle.size}rem`,
              animation: `fall ${particle.animationDuration}s linear forwards`,
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      <Navigation />
      <AnnouncementBanner />
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Enhanced Header */}
        <div className="flex items-center gap-4 mb-10 animate-fade-in">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 glow-festive">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h1 className="text-5xl font-bold gradient-text">Admin Panel</h1>
            <p className="text-lg text-muted-foreground mt-1">Manage your community and content</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-fade-in-delay-1">
          <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 hover:border-primary/50 transition-all hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-primary opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 hover:border-accent/50 transition-all hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Games</p>
                <p className="text-3xl font-bold">{stats.totalGames}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-accent opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 hover:border-destructive/50 transition-all hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Flags</p>
                <p className="text-3xl font-bold">{stats.activeFlags}</p>
              </div>
              <Flag className="w-10 h-10 text-destructive opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 hover:border-primary/50 transition-all hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Plays</p>
                <p className="text-3xl font-bold">{stats.totalPlays.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-primary opacity-50" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full animate-fade-in-delay-2">
          <TabsList className="grid w-full grid-cols-10 mb-8 h-14 bg-card/60 backdrop-blur-sm p-1.5 rounded-xl border-2 border-border/50">
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg font-semibold">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="games" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg font-semibold">
              <Gamepad2 className="w-4 h-4" />
              Games
            </TabsTrigger>
            <TabsTrigger value="flags" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg font-semibold">
              <Flag className="w-4 h-4" />
              Flags
            </TabsTrigger>
            <TabsTrigger value="bugs" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg font-semibold">
              <Flag className="w-4 h-4" />
              Bug Reports
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg font-semibold">
              <ScrollText className="w-4 h-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg font-semibold">
              <Megaphone className="w-4 h-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="blocked" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg font-semibold">
              <Ban className="w-4 h-4" />
              Blocked Words
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg font-semibold">
              <ScrollText className="w-4 h-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg font-semibold">
              <Shield className="w-4 h-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="site-settings" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg font-semibold">
              <Settings className="w-4 h-4" />
              Site
            </TabsTrigger>
          </TabsList>

          {/* Users Tab - Enhanced */}
          <TabsContent value="users" className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
                <Users className="w-8 h-8" />
                User Management
              </h2>
              
              <div className="mb-8 space-y-5">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      className="pl-12 h-14 bg-muted/50 border-2 border-border/50 hover:border-primary/40 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Input
                    placeholder="Username to promote"
                    value={promoteUsername}
                    onChange={(e) => setPromoteUsername(e.target.value)}
                    className="flex-1 h-14 bg-muted/50 border-2 border-border/50 rounded-xl"
                  />
                  <Button 
                    onClick={handlePromoteUser} 
                    disabled={loading || !promoteUsername}
                    className="h-14 px-6 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 glow-festive font-semibold shadow-lg"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Promote to Admin
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-6 bg-muted/30 border-2 border-border/30 rounded-xl hover:border-primary/40 transition-all hover-lift"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-12 h-12 rounded-full border-2 border-primary/30" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-lg">{user.username}</p>
                          {user.role === 'admin' && (
                            <span className="px-3 py-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-xs font-bold rounded-full shadow-lg">
                              👑 Admin
                            </span>
                          )}
                        </div>
                        {user.display_name && (
                          <p className="text-sm text-muted-foreground">{user.display_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {user.role === 'admin' && user.username !== 'wild' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDemoteUser(user.username)}
                          disabled={loading}
                          className="border-2 hover-scale"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Demote
                        </Button>
                      )}
                      {user.username !== 'wild' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBanUser(user.user_id)}
                          disabled={loading}
                          className="hover-scale shadow-lg"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Ban
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
                <Gamepad2 className="w-8 h-8" />
                Game Management
              </h2>
              
              {/* Edit Game Form */}
              {editingGame && (
                <div className="mb-8 p-6 bg-primary/5 border-2 border-primary/20 rounded-xl space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Edit Game</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingGame(null);
                        setEditGameTitle("");
                        setEditGameDescription("");
                        setEditGameGenre("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Game title..."
                    value={editGameTitle}
                    onChange={(e) => setEditGameTitle(e.target.value)}
                    className="h-12 bg-card/50 border-2 border-border/50 rounded-xl"
                  />
                  <Textarea
                    placeholder="Game description..."
                    value={editGameDescription}
                    onChange={(e) => setEditGameDescription(e.target.value)}
                    className="min-h-24 bg-card/50 border-2 border-border/50 rounded-xl"
                  />
                  <Input
                    placeholder="Genre..."
                    value={editGameGenre}
                    onChange={(e) => setEditGameGenre(e.target.value)}
                    className="h-12 bg-card/50 border-2 border-border/50 rounded-xl"
                  />
                  <Button
                    onClick={handleUpdateGame}
                    disabled={loading || !editGameTitle.trim()}
                    className="h-12 px-6 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 glow-festive font-semibold shadow-lg"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
              
              <div className="space-y-3">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-6 bg-muted/30 border-2 border-border/30 rounded-xl hover:border-primary/40 transition-all hover-lift"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {game.image_url ? (
                        <img src={game.image_url} alt={game.title} className="w-16 h-16 rounded-lg object-cover border-2 border-primary/30" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/25 to-accent/20 flex items-center justify-center">
                          <Gamepad2 className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-lg">{game.title}</p>
                          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                            {game.genre}
                          </span>
                        </div>
                        {game.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{game.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>By {game.creator_name}</span>
                          <span>❤️ {game.likes}</span>
                          <span>▶️ {game.plays}</span>
                          <span>{new Date(game.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGame(game)}
                        disabled={loading}
                        className="hover-scale border-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteGame(game.id)}
                        disabled={loading}
                        className="hover-scale shadow-lg"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {games.length === 0 && (
                  <div className="text-center py-16">
                    <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-xl text-muted-foreground">No games found</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Content Flags Tab - Enhanced */}
          <TabsContent value="flags" className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
                <Flag className="w-8 h-8" />
                Content Moderation
              </h2>
              <div className="space-y-3">
                {contentFlags.filter(f => f.status === 'pending').map((flag) => (
                  <div
                    key={flag.id}
                    className="p-6 bg-destructive/5 border-2 border-destructive/20 rounded-xl hover:border-destructive/40 transition-all hover-lift"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-4 py-2 bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground text-sm font-bold rounded-full shadow-lg">
                            {flag.severity}
                          </span>
                          <span className="px-3 py-1 bg-muted text-sm font-medium rounded-full">
                            {flag.content_type}
                          </span>
                        </div>
                        <p className="text-base mb-3 font-medium">{flag.flagged_content}</p>
                        {flag.violation_words && flag.violation_words.length > 0 && (
                          <div className="flex gap-2 flex-wrap mb-3">
                            {flag.violation_words.map((word, i) => (
                              <span key={i} className="px-3 py-1 bg-destructive/15 text-destructive text-sm font-medium rounded-lg">
                                {word}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {new Date(flag.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={() => handleResolveFlag(flag.id)}
                        disabled={loading}
                        className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 glow-festive hover-scale shadow-lg"
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
                {contentFlags.filter(f => f.status === 'pending').length === 0 && (
                  <div className="text-center py-16">
                    <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-xl text-muted-foreground">No pending flags</p>
                    <p className="text-sm text-muted-foreground/70 mt-2">All content has been reviewed ✨</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
                <Megaphone className="w-8 h-8" />
                Manage Announcements
              </h2>
              
              {/* Create Announcement Form */}
              <div className="mb-8 p-6 bg-primary/5 border-2 border-primary/20 rounded-xl space-y-4">
                <h3 className="text-xl font-bold mb-4">Create New Announcement</h3>
                <Input
                  placeholder="Announcement title..."
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="h-12 bg-card/50 border-2 border-border/50 rounded-xl"
                />
                <Textarea
                  placeholder="Announcement message..."
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  className="min-h-24 bg-card/50 border-2 border-border/50 rounded-xl"
                />
                <div className="flex gap-3">
                  <select
                    value={announcementType}
                    onChange={(e) => setAnnouncementType(e.target.value)}
                    className="flex-1 h-12 px-4 bg-card/50 border-2 border-border/50 rounded-xl text-foreground"
                  >
                    <option value="info">ℹ️ Info</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="success">✅ Success</option>
                    <option value="error">❌ Error</option>
                  </select>
                  <Button
                    onClick={handleCreateAnnouncement}
                    disabled={loading || !announcementTitle || !announcementMessage}
                    className="h-12 px-6 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 glow-festive font-semibold shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create
                  </Button>
                </div>
              </div>

              {/* Announcements List */}
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-6 border-2 rounded-xl transition-all hover-lift ${
                      announcement.is_active 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-muted/30 border-border/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{announcement.title}</h3>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            announcement.is_active 
                              ? 'bg-gradient-to-r from-primary to-primary-glow text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {announcement.is_active ? '🟢 Active' : '⚫ Inactive'}
                          </span>
                          <span className="px-3 py-1 bg-muted text-xs font-medium rounded-full">
                            {announcement.type}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-3">{announcement.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(announcement.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAnnouncement(announcement.id, announcement.is_active)}
                          disabled={loading}
                          className="hover-scale border-2"
                        >
                          {announcement.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          disabled={loading}
                          className="hover-scale"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="text-center py-16">
                    <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-xl text-muted-foreground">No announcements yet</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Blocked Words Tab */}
          <TabsContent value="blocked" className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
                <Ban className="w-8 h-8" />
                Blocked Words
              </h2>
              
              {/* Add Blocked Word Form */}
              <div className="mb-8 p-6 bg-destructive/5 border-2 border-destructive/20 rounded-xl">
                <h3 className="text-xl font-bold mb-4">Add Blocked Word</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter word to block..."
                    value={newBlockedWord}
                    onChange={(e) => setNewBlockedWord(e.target.value)}
                    className="flex-1 h-12 bg-card/50 border-2 border-border/50 rounded-xl"
                  />
                  <select
                    value={wordSeverity}
                    onChange={(e) => setWordSeverity(e.target.value)}
                    className="h-12 px-4 bg-card/50 border-2 border-border/50 rounded-xl text-foreground"
                  >
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <Button
                    onClick={handleAddBlockedWord}
                    disabled={loading || !newBlockedWord.trim()}
                    className="h-12 px-6 bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Word
                  </Button>
                </div>
              </div>

              {/* Blocked Words List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {blockedWords.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between p-4 bg-muted/30 border-2 border-border/30 rounded-xl hover:border-destructive/40 transition-all hover-lift"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-mono font-bold text-lg">{word.word}</span>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        word.severity === 'critical' ? 'bg-destructive text-destructive-foreground' :
                        word.severity === 'high' ? 'bg-destructive/70 text-destructive-foreground' :
                        word.severity === 'moderate' ? 'bg-destructive/40 text-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {word.severity}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBlockedWord(word.id)}
                      disabled={loading}
                      className="hover:bg-destructive/10 hover:text-destructive hover-scale"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {blockedWords.length === 0 && (
                  <div className="col-span-2 text-center py-16">
                    <Ban className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-xl text-muted-foreground">No blocked words</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab - Enhanced */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
                <ScrollText className="w-8 h-8" />
                Audit Logs
              </h2>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-6 bg-muted/30 border-2 border-border/30 rounded-xl hover:border-primary/40 transition-all hover-lift"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-lg">{log.admin_username}</span>
                          <span className="text-muted-foreground text-xl">→</span>
                          <span className="px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 text-foreground text-sm font-bold rounded-full border-2 border-primary/30">
                            {log.action}
                          </span>
                        </div>
                        {log.target_username && (
                          <p className="text-base text-muted-foreground mb-2">
                            Target: <span className="font-semibold text-foreground">{log.target_username}</span>
                          </p>
                        )}
                        {log.details && (
                          <p className="text-sm text-muted-foreground/80 font-mono bg-muted/50 p-3 rounded-lg mt-2">
                            {JSON.stringify(log.details, null, 2)}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground px-3 py-1 bg-muted/50 rounded-lg">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="text-center py-16">
                    <ScrollText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-xl text-muted-foreground">No audit logs yet</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Bug Reports Tab */}
          <TabsContent value="bugs" className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
                <Flag className="w-8 h-8" />
                Bug Reports
              </h2>
              
              <div className="space-y-3">
                {bugReports.length > 0 ? (
                  bugReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-start justify-between p-6 bg-muted/30 border-2 border-border/30 rounded-xl hover:border-primary/40 transition-all hover-lift"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-lg">{report.title}</p>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            report.status === 'resolved' 
                              ? 'bg-green-500/20 text-green-400' 
                              : report.status === 'reviewed' 
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-primary/20 text-primary'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>📧 {report.email}</span>
                          <span>📅 {new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {report.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await supabase
                                  .from('bug_reports')
                                  .update({ status: 'reviewed' })
                                  .eq('id', report.id);
                                fetchBugReports();
                                toast({ title: "Success", description: "Marked as reviewed" });
                              } catch (error: any) {
                                toast({ title: "Error", description: error.message, variant: "destructive" });
                              }
                            }}
                          >
                            Mark Reviewed
                          </Button>
                        )}
                        {report.status === 'reviewed' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await supabase
                                  .from('bug_reports')
                                  .update({ status: 'resolved' })
                                  .eq('id', report.id);
                                fetchBugReports();
                                toast({ title: "Success", description: "Marked as resolved" });
                              } catch (error: any) {
                                toast({ title: "Error", description: error.message, variant: "destructive" });
                              }
                            }}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-xl text-muted-foreground">No bug reports yet</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Contact Messages Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
                <ScrollText className="w-8 h-8" />
                Contact Messages
              </h2>
              
              <div className="space-y-3">
                {contactMessages.length > 0 ? (
                  contactMessages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start justify-between p-6 bg-muted/30 border-2 border-border/30 rounded-xl hover:border-primary/40 transition-all hover-lift"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-lg">{message.subject}</p>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            message.status === 'resolved' 
                              ? 'bg-green-500/20 text-green-400' 
                              : message.status === 'reviewed' 
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-primary/20 text-primary'
                          }`}>
                            {message.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{message.message}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>👤 {message.name}</span>
                          <span>📧 {message.email}</span>
                          <span>📅 {new Date(message.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {message.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await supabase
                                  .from('contact_messages')
                                  .update({ status: 'reviewed' })
                                  .eq('id', message.id);
                                fetchContactMessages();
                                toast({ title: "Success", description: "Marked as reviewed" });
                              } catch (error: any) {
                                toast({ title: "Error", description: error.message, variant: "destructive" });
                              }
                            }}
                          >
                            Mark Reviewed
                          </Button>
                        )}
                        {message.status === 'reviewed' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await supabase
                                  .from('contact_messages')
                                  .update({ status: 'resolved' })
                                  .eq('id', message.id);
                                fetchContactMessages();
                                toast({ title: "Success", description: "Marked as resolved" });
                              } catch (error: any) {
                                toast({ title: "Error", description: error.message, variant: "destructive" });
                              }
                            }}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <ScrollText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-xl text-muted-foreground">No contact messages yet</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Network Diagnostics Tab */}
          <TabsContent value="diagnostics" className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
                <Shield className="w-8 h-8" />
                Network Diagnostics
              </h2>
              
              <div className="mb-6">
                <Button 
                  onClick={runNetworkDiagnostics} 
                  disabled={loading}
                  className="h-12 px-6 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 glow-festive font-semibold shadow-lg"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Run Diagnostics
                </Button>
              </div>

              <div className="space-y-4">
                {/* Test Results */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="p-4 bg-muted/30 border-2 border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Direct REST API</h3>
                      {testResults.directRest === 'success' && <span className="text-green-500">✓ Accessible</span>}
                      {testResults.directRest === 'blocked' && <span className="text-red-500">✗ Blocked</span>}
                      {testResults.directRest === 'error' && <span className="text-yellow-500">! Error</span>}
                      {testResults.directRest === 'pending' && <span className="text-muted-foreground">Pending</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">/rest/v1/games endpoint</p>
                  </Card>

                  <Card className="p-4 bg-muted/30 border-2 border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Gateway REST API</h3>
                      {testResults.gatewayRest === 'success' && <span className="text-green-500">✓ Accessible</span>}
                      {testResults.gatewayRest === 'blocked' && <span className="text-red-500">✗ Blocked</span>}
                      {testResults.gatewayRest === 'error' && <span className="text-yellow-500">! Error</span>}
                      {testResults.gatewayRest === 'pending' && <span className="text-muted-foreground">Pending</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">/functions/v1/api-gateway</p>
                  </Card>

                  <Card className="p-4 bg-muted/30 border-2 border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Diagnostics API</h3>
                      {testResults.diagnosticsApi === 'success' && <span className="text-green-500">✓ Accessible</span>}
                      {testResults.diagnosticsApi === 'blocked' && <span className="text-red-500">✗ Blocked</span>}
                      {testResults.diagnosticsApi === 'error' && <span className="text-yellow-500">! Error</span>}
                      {testResults.diagnosticsApi === 'pending' && <span className="text-muted-foreground">Pending</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">/functions/v1/network-diagnostics</p>
                  </Card>
                </div>

                {/* Network Analysis */}
                {diagnosticsData && (
                  <Card className="p-6 bg-muted/30 border-2 border-border/30 mt-6">
                    <h3 className="text-xl font-bold mb-4 gradient-text">Network Analysis</h3>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-semibold mb-2">Client Info</h4>
                        <dl className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">IP Address:</dt>
                            <dd className="font-mono">{diagnosticsData.client?.ip || 'Unknown'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">User Agent:</dt>
                            <dd className="font-mono text-xs truncate max-w-xs">{diagnosticsData.client?.userAgent || 'Unknown'}</dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Network Characteristics</h4>
                        <dl className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Via Proxy:</dt>
                            <dd className={diagnosticsData.network?.viaProxy ? 'text-green-500' : 'text-red-500'}>
                              {diagnosticsData.network?.viaProxy ? 'Yes' : 'No'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Proxy Detected:</dt>
                            <dd className={diagnosticsData.network?.proxyDetected ? 'text-yellow-500' : 'text-muted-foreground'}>
                              {diagnosticsData.network?.proxyDetected ? 'Yes' : 'No'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Cloudflare:</dt>
                            <dd className={diagnosticsData.network?.cloudflare ? 'text-blue-500' : 'text-muted-foreground'}>
                              {diagnosticsData.network?.cloudflare ? 'Yes' : 'No'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-3">Filtering Detection</h4>
                      {testResults.directRest === 'blocked' && testResults.gatewayRest === 'success' && (
                        <div className="text-sm space-y-2">
                          <p className="text-green-500 font-semibold">✓ Endpoint Pattern Filtering Detected</p>
                          <p className="text-muted-foreground">
                            Direct REST API is blocked but gateway works. Network filters by endpoint patterns (e.g., "/rest/v1/").
                          </p>
                        </div>
                      )}
                      {testResults.directRest === 'blocked' && testResults.gatewayRest === 'blocked' && testResults.diagnosticsApi === 'blocked' && (
                        <div className="text-sm space-y-2">
                          <p className="text-red-500 font-semibold">✗ Domain-Level Blocking Detected</p>
                          <p className="text-muted-foreground">
                            All Supabase endpoints blocked. Network blocks entire *.supabase.co domain.
                          </p>
                        </div>
                      )}
                      {testResults.directRest === 'success' && testResults.gatewayRest === 'success' && (
                        <div className="text-sm space-y-2">
                          <p className="text-green-500 font-semibold">✓ No Filtering Detected</p>
                          <p className="text-muted-foreground">
                            All endpoints accessible. Network does not block Supabase services.
                          </p>
                        </div>
                      )}
                      {diagnosticsData.network?.viaProxy && (
                        <div className="text-sm space-y-2 mt-3 pt-3 border-t border-border/30">
                          <p className="text-blue-500 font-semibold">ℹ IP Rotation Active</p>
                          <p className="text-muted-foreground">
                            Requests are being routed through proxy with IP rotation from IPRoyal.
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
