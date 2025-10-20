import { useState, useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabaseWithProxy as supabase } from "@/lib/proxyClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Flag, ScrollText, Shield, Trash2, UserPlus, UserMinus, Search, Megaphone, Ban, BarChart3, Plus, X, Gamepad2 } from "lucide-react";

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

const Admin = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contentFlags, setContentFlags] = useState<ContentFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalGames: 0, activeFlags: 0, totalPlays: 0 });
  
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
  }, []);

  const fetchUsers = async () => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    try {
      const { data, error } = await supabase.rpc("get_users_with_roles", {
        _admin_session_token: sessionToken,
      });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
      await supabase.rpc('set_session_context', { _session_token: sessionToken });
      
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
        supabase.from("games").select("*, plays", { count: "exact" }),
        supabase.from("content_flags").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const totalPlays = gamesResult.data?.reduce((sum, game) => sum + (game.plays || 0), 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalGames: gamesResult.count || 0,
        activeFlags: flagsResult.count || 0,
        totalPlays: totalPlays,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
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
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Enhanced Header */}
        <div className="flex items-center gap-4 mb-10 animate-fade-in">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 glow-orange">
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
          <TabsList className="grid w-full grid-cols-6 mb-8 h-14 bg-card/60 backdrop-blur-sm p-1.5 rounded-xl border-2 border-border/50">
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
                    className="h-14 px-6 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 glow-orange font-semibold"
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
                        className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 glow-orange hover-scale"
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
                    className="h-12 px-6 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 glow-orange font-semibold"
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
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
