import { useState, useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";

interface Particle {
  id: number;
  emoji: string;
  left: number;
  animationDuration: number;
  size: number;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, UserPlus, UserMinus, Check, X, Search } from "lucide-react";
import { useQuestTracking } from "@/hooks/useQuestTracking";

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  user_profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  friend_profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Friends = ({ hideNavigation = false }: { hideNavigation?: boolean } = {}) => {
  const { trackQuestProgress } = useQuestTracking();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    fetchFriends();
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

  const fetchFriends = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_friends_with_context', {
        _session_token: sessionToken
      });

      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!searchUsername.trim()) {
      toast.error("Please enter a username");
      return;
    }

    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please login first");
      return;
    }

    setSendingRequest(true);
    try {
      const { data, error } = await supabase.rpc('send_friend_request_with_context', {
        _session_token: sessionToken,
        _friend_username: searchUsername.trim()
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Friend request sent!");
        setSearchUsername("");
        fetchFriends();
      } else {
        toast.error(data.error || "Failed to send friend request");
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error("Failed to send friend request");
    } finally {
      setSendingRequest(false);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    try {
      const { data, error } = await supabase.rpc('accept_friend_request_with_context', {
        _session_token: sessionToken,
        _request_id: requestId
      });

      if (error) throw error;

      if (data.success) {
        // Track quest progress
        await trackQuestProgress('add_friends');
        
        toast.success("Friend request accepted!");
        fetchFriends();
      } else {
        toast.error(data.error || "Failed to accept request");
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error("Failed to accept friend request");
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    try {
      const { data, error } = await supabase.rpc('reject_friend_request_with_context', {
        _session_token: sessionToken,
        _request_id: requestId
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Friend request rejected");
        fetchFriends();
      } else {
        toast.error(data.error || "Failed to reject request");
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error("Failed to reject friend request");
    }
  };

  const acceptedFriends = friends.filter(f => f.status === 'accepted');
  const pendingRequests = friends.filter(f => f.status === 'pending');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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

      {/* Bouncing decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[8%] text-5xl animate-bounce-slow opacity-30">🎃</div>
        <div className="absolute top-[30%] right-[10%] text-4xl animate-bounce-delayed opacity-25">👻</div>
        <div className="absolute top-[20%] right-[85%] text-3xl animate-sway opacity-20">🦇</div>
        <div className="absolute top-[50%] left-[6%] text-4xl animate-sway-delayed opacity-25">💀</div>
        <div className="absolute top-[70%] right-[12%] text-5xl animate-bounce-slow opacity-30">🎃</div>
      </div>
      
      {/* Halloween decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[5%] text-6xl animate-float opacity-20">🎃</div>
        <div className="absolute top-32 right-[8%] text-5xl animate-float-delayed opacity-25">👻</div>
        <div className="absolute bottom-[20%] left-[10%] text-4xl animate-float opacity-15">🦇</div>
      </div>

      {!hideNavigation && <Navigation />}
      {!hideNavigation && <AnnouncementBanner />}
      
      <div className="container mx-auto px-4 py-12 relative z-10 max-w-4xl">
        {/* Header */}
        <div className="mb-12 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <Users className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold tracking-tight">
              Your <span className="text-primary">Friends</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Connect with other players
          </p>
        </div>

        {/* Add Friend */}
        <Card className="mb-8 animate-fade-in-delay-1">
          <CardHeader>
            <CardTitle>Add New Friend</CardTitle>
            <CardDescription>Search by username to send a friend request</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter username..."
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendFriendRequest()}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={sendFriendRequest}
                disabled={sendingRequest}
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {sendingRequest ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card className="mb-8 animate-fade-in-delay-2">
            <CardHeader>
              <CardTitle>Pending Requests ({pendingRequests.length})</CardTitle>
              <CardDescription>Accept or reject friend requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.map((request) => {
                const profile = request.user_profile || request.friend_profile;
                if (!profile) return null;
                
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{profile.username}</p>
                        <p className="text-sm text-muted-foreground">Friend request</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => acceptFriendRequest(request.id)}
                        className="gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectFriendRequest(request.id)}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Friends List */}
        <Card className="animate-fade-in-delay-3">
          <CardHeader>
            <CardTitle>Friends ({acceptedFriends.length})</CardTitle>
            <CardDescription>Your gaming buddies</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading friends...
              </div>
            ) : acceptedFriends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No friends yet. Add some using the search above!
              </div>
            ) : (
              <div className="space-y-3">
                {acceptedFriends.map((friend) => {
                  const profile = friend.user_profile || friend.friend_profile;
                  if (!profile) return null;
                  
                  return (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{profile.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {profile.display_name || "Gamer"}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Friends;
