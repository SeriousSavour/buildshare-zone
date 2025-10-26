import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabaseWithProxy as supabase } from "@/lib/proxyClient";
import { X, Minimize2 } from "lucide-react";

interface Game {
  id: string;
  title: string;
  game_url: string | null;
}

const GameFullscreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get game data from navigation state first
    if (location.state?.game) {
      setGame(location.state.game);
      setLoading(false);
    } else if (id) {
      // Fallback: fetch game data if not passed via state
      fetchGame();
    }
  }, [id, location.state]);

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, title, game_url')
        .eq('id', id);

      if (error) throw error;
      
      const gameData = Array.isArray(data) ? data[0] : data;
      
      if (!gameData) {
        throw new Error('Game not found');
      }

      setGame(gameData);
    } catch (error) {
      console.error('Error fetching game:', error);
      navigate('/games');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    navigate(`/games/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game?.game_url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Game not found</p>
          <Button onClick={() => navigate('/games')}>Back to Games</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-primary/90 to-purple-600/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between shadow-lg z-50">
        <h1 className="text-2xl font-bold text-white">
          🎮 {game.title}
        </h1>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleExit}
            className="text-white hover:bg-white/20"
          >
            <Minimize2 className="w-4 h-4 mr-2" />
            Exit Fullscreen
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleExit}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Game iframe */}
      <div className="flex-1 relative">
        <iframe
          src={game.game_url}
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={game.title}
        />
      </div>
    </div>
  );
};

export default GameFullscreen;
