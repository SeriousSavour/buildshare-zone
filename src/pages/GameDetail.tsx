import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Particle {
  id: number;
  emoji: string;
  left: number;
  animationDuration: number;
  size: number;
}
import Navigation from "@/components/layout/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabaseWithProxy as supabase } from "@/lib/proxyClient";
import { toast } from "sonner";
import { ArrowLeft, Heart, Share2, User, Play, ChevronLeft, ChevronRight, Maximize2, Send } from "lucide-react";

interface Game {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  genre: string;
  max_players: string;
  creator_name: string;
  creator_id: string;
  creator_avatar?: string | null;
  likes: number;
  plays: number;
  game_url: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

const GameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [iframeSize, setIframeSize] = useState({ width: 900, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGame();
      checkIfLiked();
      fetchComments();
      
      // Set up realtime subscription
      const cleanup = subscribeToComments();
      return cleanup;
    }
  }, [id]);

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

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id);

      if (error) throw error;
      
      // Handle both array and single object responses
      const gameData = Array.isArray(data) ? data[0] : data;
      
      if (!gameData) {
        throw new Error('Game not found');
      }

      console.log('Game data fetched:', gameData);
      console.log('Game URL:', gameData.game_url);
      
      // Set game first to ensure we have the data
      setGame(gameData);
      
      // Fetch creator profile with avatar if creator_id exists
      if (gameData.creator_id) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('user_id', gameData.creator_id);
          
          const profile = Array.isArray(profileData) ? profileData[0] : profileData;
          
          // Update with avatar
          setGame(prev => prev ? {
            ...prev,
            creator_avatar: profile?.avatar_url
          } : null);
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          // Continue without avatar - game is already set
        }
      }
    } catch (error) {
      console.error('Error fetching game:', error);
      toast.error("Failed to load game");
      navigate('/games');
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    try {
      const { data: userData } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (!userData || userData.length === 0) return;

      const { data } = await supabase
        .from('game_likes')
        .select('id')
        .eq('game_id', id)
        .eq('user_id', userData[0].user_id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      // User hasn't liked the game
    }
  };

  useEffect(() => {
    // Increment play count when game loads
    if (game?.id) {
      incrementPlayCount();
    }
  }, [game?.id]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeDirection) return;
      
      setIframeSize(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;

        if (resizeDirection.includes('right')) {
          newWidth = Math.max(400, prev.width + e.movementX);
        }
        if (resizeDirection.includes('left')) {
          newWidth = Math.max(400, prev.width - e.movementX);
        }
        if (resizeDirection.includes('bottom')) {
          newHeight = Math.max(300, prev.height + e.movementY);
        }
        if (resizeDirection.includes('top')) {
          newHeight = Math.max(300, prev.height - e.movementY);
        }

        return { width: newWidth, height: newHeight };
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection]);

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    
    if (direction.includes('right') || direction.includes('left')) {
      document.body.style.cursor = 'ew-resize';
    } else if (direction.includes('top') || direction.includes('bottom')) {
      document.body.style.cursor = 'ns-resize';
    }
    
    if (direction === 'top-left' || direction === 'bottom-right') {
      document.body.style.cursor = 'nwse-resize';
    }
    if (direction === 'top-right' || direction === 'bottom-left') {
      document.body.style.cursor = 'nesw-resize';
    }
  };

  const incrementPlayCount = async () => {
    try {
      await supabase
        .from('games')
        .update({ plays: (game?.plays || 0) + 1 })
        .eq('id', id);
      
      setGame(prev => prev ? { ...prev, plays: prev.plays + 1 } : null);
    } catch (error) {
      console.error('Error updating play count:', error);
    }
  };

  const handleLike = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please login to like games");
      navigate('/login');
      return;
    }

    try {
      const { data: result } = await supabase.rpc('toggle_game_like', {
        _game_id: id,
        _user_id: (await supabase.rpc('get_user_by_session', {
          _session_token: sessionToken
        })).data[0].user_id
      });

      if (result) {
        setIsLiked(result.is_liked);
        setGame(prev => prev ? { ...prev, likes: result.like_count } : null);
        toast.success(result.is_liked ? "Game liked!" : "Like removed");
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like");
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleFullscreen = () => {
    if (!game?.game_url) return;

    const newTab = window.open('about:blank', '_blank');
    if (newTab) {
      newTab.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title></title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                background: #0a0a0a; 
                font-family: system-ui, -apple-system, sans-serif;
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 1rem 2rem;
                color: white;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              }
              .header h1 { font-size: 1.5rem; font-weight: 700; }
              .header button {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.2s;
              }
              .header button:hover {
                background: rgba(255,255,255,0.3);
              }
              iframe {
                width: 100%;
                height: calc(100vh - 72px);
                border: none;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎮 ${game.title}</h1>
              <button onclick="window.close()">✕ Close</button>
            </div>
            <iframe src="${game.game_url}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </body>
        </html>
      `);
      newTab.document.close();
    }
  };

  const fetchComments = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      setComments([]);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_game_comments_with_profiles', {
        _game_id: id,
        _session_token: sessionToken
      });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      console.log('Fetched comments with profiles:', data);
      
      // Transform the data to match the expected structure
      const commentsWithProfiles = (data || []).map(comment => ({
        id: comment.id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        is_deleted: comment.is_deleted,
        profiles: {
          username: comment.username,
          avatar_url: comment.avatar_url
        }
      }));
      
      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error in fetchComments:', error);
      toast.error("Failed to load comments");
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`game-comments-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_comments',
          filter: `game_id=eq.${id}`
        },
        (payload) => {
          console.log('New comment received:', payload);
          fetchComments(); // Refresh all comments when a new one is added
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_comments',
          filter: `game_id=eq.${id}`
        },
        (payload) => {
          console.log('Comment updated:', payload);
          fetchComments(); // Refresh when a comment is updated
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'game_comments',
          filter: `game_id=eq.${id}`
        },
        (payload) => {
          console.log('Comment deleted:', payload);
          fetchComments(); // Refresh when a comment is deleted
        }
      )
      .subscribe((status) => {
        console.log('Comments subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from comments');
      supabase.removeChannel(channel);
    };
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please login to comment");
      navigate('/login');
      return;
    }

    setSubmittingComment(true);
    try {
      const { error } = await supabase.rpc('insert_game_comment', {
        _session_token: sessionToken,
        _game_id: id,
        _content: newComment.trim()
      });

      if (error) throw error;

      setNewComment("");
      toast.success("Comment posted!");
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading game...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!game) return null;

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
        <div className="absolute top-[28%] right-[10%] text-4xl animate-bounce-delayed opacity-25">👻</div>
        <div className="absolute top-[18%] right-[85%] text-3xl animate-sway opacity-20">🦇</div>
        <div className="absolute top-[48%] left-[6%] text-4xl animate-sway-delayed opacity-25">💀</div>
        <div className="absolute top-[68%] right-[12%] text-5xl animate-bounce-slow opacity-30">🎃</div>
      </div>
      
      {/* Halloween decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[5%] text-6xl animate-float opacity-20">🎃</div>
        <div className="absolute top-32 right-[8%] text-5xl animate-float-delayed opacity-25">👻</div>
        <div className="absolute bottom-[20%] left-[10%] text-4xl animate-float opacity-15">🦇</div>
      </div>

      <Navigation />
      
      <div className="container mx-auto px-4 py-12 relative z-10 max-w-[100vw] flex flex-col items-center">
        {/* Back Button */}
        <div className="w-full max-w-7xl mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/games')}
            className="gap-2 hover-scale hover-glow"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Button>
        </div>

        {/* Header with Sidebar Toggle */}
        <div className="w-full max-w-7xl mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <Button
            onClick={() => setShowSidebar(!showSidebar)}
            size="lg"
            className="gap-2 bg-primary hover:bg-primary/90 text-lg px-6 py-6 shadow-lg"
          >
            {showSidebar ? (
              <>
                <ChevronRight className="w-5 h-5" />
                Hide Info
              </>
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                Show Info
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-8 w-full max-w-7xl">
          {/* Game Player - Centered */}
          <div className="flex-1 flex flex-col items-center gap-6">
            {game.game_url ? (
              <>
                <div className="relative inline-block">
                  {/* Edge Resize Handles */}
                  <div
                    className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50 z-10"
                    onMouseDown={handleResizeStart('left')}
                  />
                  <div
                    className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50 z-10"
                    onMouseDown={handleResizeStart('right')}
                  />
                  <div
                    className="absolute left-0 right-0 -top-1 h-2 cursor-ns-resize hover:bg-primary/50 z-10"
                    onMouseDown={handleResizeStart('top')}
                  />
                  <div
                    className="absolute left-0 right-0 -bottom-1 h-2 cursor-ns-resize hover:bg-primary/50 z-10"
                    onMouseDown={handleResizeStart('bottom')}
                  />
                  
                  {/* Corner Handles */}
                  <div
                    className="absolute -left-1 -top-1 w-4 h-4 cursor-nwse-resize bg-primary hover:bg-primary/80 z-20 rounded-full border-2 border-background"
                    onMouseDown={handleResizeStart('top-left')}
                  />
                  <div
                    className="absolute -right-1 -top-1 w-4 h-4 cursor-nesw-resize bg-primary hover:bg-primary/80 z-20 rounded-full border-2 border-background"
                    onMouseDown={handleResizeStart('top-right')}
                  />
                  <div
                    className="absolute -left-1 -bottom-1 w-4 h-4 cursor-nesw-resize bg-primary hover:bg-primary/80 z-20 rounded-full border-2 border-background"
                    onMouseDown={handleResizeStart('bottom-left')}
                  />
                  <div
                    className="absolute -right-1 -bottom-1 w-4 h-4 cursor-nwse-resize bg-primary hover:bg-primary/80 z-20 rounded-full border-2 border-background"
                    onMouseDown={handleResizeStart('bottom-right')}
                  />

                  <iframe
                    src={game.game_url}
                    title={game.title}
                    className="border-2 border-primary/20 rounded-lg shadow-2xl"
                    style={{
                      width: `${iframeSize.width}px`,
                      height: `${iframeSize.height}px`,
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Fullscreen Button */}
                <Button
                  onClick={handleFullscreen}
                  size="lg"
                  className="gap-2 w-full max-w-md"
                >
                  <Maximize2 className="w-5 h-5" />
                  Open in Fullscreen
                </Button>

                {/* Comments Section */}
                <Card className="w-full max-w-4xl">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 text-xl">Comments ({comments.length})</h3>
                    
                    {/* Comment Input */}
                    <div className="mb-6 space-y-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="resize-none"
                        rows={3}
                      />
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || submittingComment}
                        className="w-full gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {submittingComment ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No comments yet. Be the first to comment!
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-all duration-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              {comment.profiles?.avatar_url ? (
                                <img
                                  src={comment.profiles.avatar_url}
                                  alt={comment.profiles.username || 'User'}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                                  style={{ aspectRatio: '1/1' }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/20 flex-shrink-0">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    {comment.profiles?.username || 'Anonymous'}
                                    {comment.profiles?.username === 'wild' && (
                                      <span className="inline-flex items-center text-yellow-500" title="Admin">
                                        👑
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-foreground ml-[52px] leading-relaxed">{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
                <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No game URL available</p>
              </div>
            )}
          </div>

          {/* Sliding Sidebar */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              showSidebar ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'
            }`}
          >
            <Card className="h-full">
              <CardContent className="pt-6 space-y-6">
                {/* Action Buttons */}
                <div className="flex gap-2 pb-4 border-b border-border">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    className="flex-1"
                    onClick={handleLike}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Genre Badge */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                    {game.genre}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {game.description || "No description available"}
                  </p>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <User className="w-4 h-4" />
                      <span>Creator</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {game.creator_avatar ? (
                        <img
                          src={game.creator_avatar}
                          alt={game.creator_name}
                          className="w-6 h-6 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      <span className="text-sm font-medium">{game.creator_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Max Players</span>
                    <span className="text-sm font-medium">{game.max_players}</span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Likes</span>
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      {game.likes}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plays</span>
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      {game.plays}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
