import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Play, Heart, Share2, User } from "lucide-react";

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
      
      <div className="container mx-auto px-4 py-12 relative z-10 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/games')}
          className="mb-8 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Button>

        {/* Game Player Section */}
        {game.game_url ? (
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{game.title}</h2>
              <div className="flex gap-2">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <iframe
                src={game.game_url}
                title={game.title}
                className="w-full border-2 border-primary/20 rounded-lg shadow-2xl resize overflow-auto"
                style={{
                  minHeight: '400px',
                  height: '600px',
                  maxHeight: '90vh',
                  resize: 'both'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded pointer-events-none">
                Drag corner to resize
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No game URL available</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Game Preview */}
          <div className="space-y-6">
            {game.image_url && (
              <Card className="overflow-hidden">
                <img
                  src={game.image_url}
                  alt={game.title}
                  className="w-full aspect-video object-cover"
                />
              </Card>
            )}
          </div>

          {/* Game Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                  {game.genre}
                </span>
              </div>
              <h1 className="text-5xl font-bold mb-4">{game.title}</h1>
              <p className="text-xl text-muted-foreground">
                {game.description || "No description available"}
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-5 h-5" />
                    <span>Creator</span>
                  </div>
                  <span className="font-medium">{game.creator_name}</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-muted-foreground">Max Players</span>
                  <span className="font-medium">{game.max_players}</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-muted-foreground">Likes</span>
                  <span className="font-medium flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    {game.likes}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plays</span>
                  <span className="font-medium flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {game.plays}
                  </span>
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
