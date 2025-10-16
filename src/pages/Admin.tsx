import { useState, useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabaseWithProxy as supabase } from "@/lib/proxyClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Flag, ScrollText, Shield, Trash2, UserPlus, UserMinus, Search } from "lucide-react";

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

const Admin = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contentFlags, setContentFlags] = useState<ContentFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [promoteUsername, setPromoteUsername] = useState("");
  const [loading, setLoading] = useState(false);
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
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold">Admin Panel</h1>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="flags" className="gap-2">
              <Flag className="w-4 h-4" />
              Content Flags
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <ScrollText className="w-4 h-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">User Management</h2>
              
              <div className="mb-6 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search users..."
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Username to promote"
                    value={promoteUsername}
                    onChange={(e) => setPromoteUsername(e.target.value)}
                  />
                  <Button onClick={handlePromoteUser} disabled={loading || !promoteUsername}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Promote to Admin
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover-lift"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.username}</p>
                        {user.role === 'admin' && (
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      {user.display_name && (
                        <p className="text-sm text-muted-foreground">{user.display_name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {user.role === 'admin' && user.username !== 'wild' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDemoteUser(user.username)}
                          disabled={loading}
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

          {/* Content Flags Tab */}
          <TabsContent value="flags" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Content Moderation</h2>
              <div className="space-y-2">
                {contentFlags.filter(f => f.status === 'pending').map((flag) => (
                  <div
                    key={flag.id}
                    className="p-4 bg-muted/50 rounded-lg hover-lift"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded">
                            {flag.severity}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {flag.content_type}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{flag.flagged_content}</p>
                        {flag.violation_words && flag.violation_words.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {flag.violation_words.map((word, i) => (
                              <span key={i} className="px-2 py-1 bg-destructive/10 text-xs rounded">
                                {word}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(flag.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleResolveFlag(flag.id)}
                        disabled={loading}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
                {contentFlags.filter(f => f.status === 'pending').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No pending flags
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Audit Logs</h2>
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{log.admin_username}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                            {log.action}
                          </span>
                        </div>
                        {log.target_username && (
                          <p className="text-sm text-muted-foreground">
                            Target: {log.target_username}
                          </p>
                        )}
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
