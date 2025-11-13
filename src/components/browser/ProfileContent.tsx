import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Upload, Settings, Trophy, Heart, Gamepad2 } from "lucide-react";
import { useQuestTracking } from "@/hooks/useQuestTracking";

interface ProfileData {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const ProfileContent = () => {
  const { trackQuestProgress } = useQuestTracking();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [stats, setStats] = useState({ gamesCreated: 0, totalLikes: 0, totalPlays: 0 });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please log in");
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (userError) throw userError;
      if (!userData || userData.length === 0) return;

      const { data: profileData, error: fetchError } = await supabase.rpc('get_profile_by_session', {
        _session_token: sessionToken
      });

      if (fetchError) throw fetchError;
      if (!profileData || profileData.length === 0) return;

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

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

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
      <div className="w-full max-w-5xl mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="w-full max-w-5xl mx-auto p-8">
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
        <div className="md:col-span-2 space-y-8">
          <Card className="animate-fade-in-delay-1">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input value={profile.username} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">Username cannot be changed</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  className="bg-muted/50"
                />
              </div>

              <Button
                onClick={handleUpdateProfile}
                disabled={uploading}
                className="w-full gap-2"
                size="lg"
              >
                <Settings className="w-4 h-4" />
                {uploading ? "Updating..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="animate-fade-in-delay-2">
            <CardHeader>
              <CardTitle className="text-lg">Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.gamesCreated}</p>
                  <p className="text-xs text-muted-foreground">Games Created</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalLikes}</p>
                  <p className="text-xs text-muted-foreground">Total Likes</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
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

          <Card className="animate-fade-in-delay-3">
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
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;
