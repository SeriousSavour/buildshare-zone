import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Upload, Settings, Trophy, Heart, Gamepad2, Shield } from "lucide-react";
import { useQuestTracking } from "@/hooks/useQuestTracking";

interface Particle {
  id: number;
  emoji: string;
  left: number;
  animationDuration: number;
  size: number;
}

interface ProfileData {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { trackQuestProgress } = useQuestTracking();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [stats, setStats] = useState({ gamesCreated: 0, totalLikes: 0, totalPlays: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchStats();
    checkAdminStatus();
  }, []);

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

  const fetchProfile = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      navigate('/login');
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (userError) throw userError;

      if (!userData || userData.length === 0) {
        navigate('/login');
        return;
      }

      // Fetch profile using RPC function
      const { data: profileData, error: fetchError } = await supabase.rpc('get_profile_by_session', {
        _session_token: sessionToken
      });

      if (fetchError) {
        throw fetchError;
      }

      if (!profileData || profileData.length === 0) {
        toast.error("Profile not found. Please contact support.");
        return;
      }

      const profile = profileData[0];
      setProfile(profile);
      setDisplayName(profile.display_name || "");
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error(error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    try {
      const { data: userData } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (!userData || userData.length === 0) return;

      const userId = userData[0].user_id;

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;

      const hasAdminRole = roles?.some(r => r.role === 'admin') || false;
      setIsAdmin(hasAdminRole);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchStats = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    try {
      const { data: userData } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (!userData || userData.length === 0) return;

      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('likes, plays')
        .eq('creator_id', userData[0].user_id);

      if (gamesError) throw gamesError;

      const totalLikes = games?.reduce((sum, game) => sum + game.likes, 0) || 0;
      const totalPlays = games?.reduce((sum, game) => sum + game.plays, 0) || 0;

      setStats({
        gamesCreated: games?.length || 0,
        totalLikes,
        totalPlays
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setAvatarFile(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    setUploading(true);
    try {
      let avatarUrl = profile.avatar_url;
      const hadNoAvatar = !profile.avatar_url;

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('game-images')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('game-images')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Track quest progress if avatar was just uploaded
      if (avatarFile && hadNoAvatar) {
        await trackQuestProgress('upload_avatar', profile.user_id);
      }

      toast.success("Profile updated successfully!");
      fetchProfile();
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Falling Particles - Full Page */}
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

      {/* Bouncing decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[12%] left-[8%] text-5xl animate-bounce-slow opacity-30">🎃</div>
        <div className="absolute top-[28%] right-[10%] text-4xl animate-bounce-delayed opacity-25">👻</div>
        <div className="absolute top-[18%] right-[82%] text-3xl animate-sway opacity-20">🦇</div>
        <div className="absolute top-[48%] left-[6%] text-4xl animate-sway-delayed opacity-25">💀</div>
        <div className="absolute top-[68%] right-[14%] text-5xl animate-bounce-slow opacity-30">🎃</div>
      </div>

      {/* Halloween decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[5%] text-6xl animate-float opacity-20">🎃</div>
        <div className="absolute top-32 right-[8%] text-5xl animate-float-delayed opacity-25">👻</div>
        <div className="absolute bottom-[20%] left-[10%] text-4xl animate-float opacity-15">🦇</div>
      </div>

      <Navigation />
      <AnnouncementBanner />
      
      <div className="container mx-auto px-4 py-12 relative z-10 max-w-5xl">
        {/* Header */}
        <div className="mb-12 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              Your <span className="text-primary">Profile</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Manage your account and view your gaming stats
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <div className="md:col-span-2 space-y-8">
            <Card className="animate-fade-in-delay-1 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profile.avatar_url || avatarFile ? (
                      <img
                        src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url!}
                        alt={profile.username}
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-4 border-primary/20">
                        <User className="w-12 h-12 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <Upload className="w-4 h-4" />
                        {avatarFile ? avatarFile.name : "Upload new avatar"}
                      </div>
                    </label>
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                {/* Username (read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={profile.username}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Username cannot be changed
                  </p>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <label htmlFor="displayName" className="text-sm font-medium">
                    Display Name
                  </label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    className="bg-muted/50"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleUpdateProfile}
                  disabled={uploading}
                  className="w-full gap-2 hover-scale hover-glow"
                  size="lg"
                >
                  <Settings className="w-4 h-4" />
                  {uploading ? "Updating..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <Card className="animate-fade-in-delay-2 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.gamesCreated}</p>
                    <p className="text-xs text-muted-foreground">Games Created</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalLikes}</p>
                    <p className="text-xs text-muted-foreground">Total Likes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalPlays}</p>
                    <p className="text-xs text-muted-foreground">Total Plays</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-delay-3 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs">{profile.user_id.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>

            {/* Admin Panel Button */}
            {isAdmin && (
              <Card className="animate-fade-in-delay-4 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Admin Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate('/admin')}
                    className="w-full gap-2 bg-gradient-to-r from-primary to-primary-glow hover-scale hover-glow"
                    size="lg"
                  >
                    <Shield className="w-4 h-4" />
                    Open Admin Panel
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
