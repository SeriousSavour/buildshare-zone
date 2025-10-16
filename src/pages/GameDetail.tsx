import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Heart, Share2, User, Play, ChevronLeft, ChevronRight } from "lucide-react";

interface Game {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  genre: string;
  max_players: string;
  creator_name: string;
  likes: number;
  plays: number;
  game_url: string | null;
}

const GameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [iframeSize, setIframeSize] = useState({ width: 900, height: 600 });
  const resizingRef = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchGame();
      checkIfLiked();
    }
  }, [id]);

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setGame(data);
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
      if (!resizingRef.current) return;
      
      const direction = resizingRef.current;
      
      if (direction.includes('right')) {
        setIframeSize(prev => ({ ...prev, width: Math.max(400, prev.width + e.movementX) }));
      }
      if (direction.includes('left')) {
        setIframeSize(prev => ({ ...prev, width: Math.max(400, prev.width - e.movementX) }));
      }
      if (direction.includes('bottom')) {
        setIframeSize(prev => ({ ...prev, height: Math.max(300, prev.height + e.movementY) }));
      }
      if (direction.includes('top')) {
        setIframeSize(prev => ({ ...prev, height: Math.max(300, prev.height - e.movementY) }));
      }
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (resizingRef.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingRef.current]);

  const handleResizeStart = (direction: string) => {
    resizingRef.current = direction;
    document.body.style.cursor = direction.includes('right') || direction.includes('left') ? 'ew-resize' : 'ns-resize';
    if (direction === 'top-left' || direction === 'bottom-right') document.body.style.cursor = 'nwse-resize';
    if (direction === 'top-right' || direction === 'bottom-left') document.body.style.cursor = 'nesw-resize';
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
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Button>
        </div>

        {/* Header with Toggle Sidebar Button */}
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
          <div className="flex-1 flex justify-center items-start">
            {game.game_url ? (
              <div className="relative inline-block">
                {/* Resize Handles */}
                <div
                  className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50 z-10"
                  onMouseDown={() => handleResizeStart('left')}
                />
                <div
                  className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50 z-10"
                  onMouseDown={() => handleResizeStart('right')}
                />
                <div
                  className="absolute left-0 right-0 -top-1 h-2 cursor-ns-resize hover:bg-primary/50 z-10"
                  onMouseDown={() => handleResizeStart('top')}
                />
                <div
                  className="absolute left-0 right-0 -bottom-1 h-2 cursor-ns-resize hover:bg-primary/50 z-10"
                  onMouseDown={() => handleResizeStart('bottom')}
                />
                
                {/* Corner Handles */}
                <div
                  className="absolute -left-1 -top-1 w-3 h-3 cursor-nwse-resize hover:bg-primary z-20 rounded-full border-2 border-primary"
                  onMouseDown={() => handleResizeStart('top-left')}
                />
                <div
                  className="absolute -right-1 -top-1 w-3 h-3 cursor-nesw-resize hover:bg-primary z-20 rounded-full border-2 border-primary"
                  onMouseDown={() => handleResizeStart('top-right')}
                />
                <div
                  className="absolute -left-1 -bottom-1 w-3 h-3 cursor-nesw-resize hover:bg-primary z-20 rounded-full border-2 border-primary"
                  onMouseDown={() => handleResizeStart('bottom-left')}
                />
                <div
                  className="absolute -right-1 -bottom-1 w-3 h-3 cursor-nwse-resize hover:bg-primary z-20 rounded-full border-2 border-primary"
                  onMouseDown={() => handleResizeStart('bottom-right')}
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
                    <span className="text-sm font-medium">{game.creator_name}</span>
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
