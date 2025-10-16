import { useState, useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import GameCard from "@/components/games/GameCard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Grid3x3, List } from "lucide-react";
import { toast } from "sonner";

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
  category: string;
}

const Games = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [likedGames, setLikedGames] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGames();
    fetchLikedGames();
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, searchQuery, selectedGenre]);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('category', 'game')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGames(data || []);
      setFilteredGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedGames = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    try {
      const { data: userData } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (!userData || userData.length === 0) return;

      const userId = userData[0].user_id;

      const { data, error } = await supabase
        .from('game_likes')
        .select('game_id')
        .eq('user_id', userId);

      if (error) throw error;

      setLikedGames(new Set(data.map(like => like.game_id)));
    } catch (error) {
      console.error('Error fetching liked games:', error);
    }
  };

  const filterGames = () => {
    let filtered = [...games];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(game =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.creator_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by genre
    if (selectedGenre !== "all") {
      filtered = filtered.filter(game => game.genre === selectedGenre);
    }

    setFilteredGames(filtered);
  };

  const genres = Array.from(new Set(games.map(game => game.genre)));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading games...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-secondary/8 rounded-full blur-3xl animate-float" />
      </div>
      
      {/* Halloween decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[5%] text-6xl animate-float opacity-20">🎃</div>
        <div className="absolute top-32 right-[8%] text-5xl animate-float-delayed opacity-25">👻</div>
        <div className="absolute top-[20%] left-[15%] text-4xl animate-float opacity-15">🦇</div>
        <div className="absolute top-[40%] right-[12%] text-5xl animate-float-delayed opacity-20">🎃</div>
        <div className="absolute top-[60%] left-[8%] text-4xl animate-float opacity-15">💀</div>
        <div className="absolute bottom-[20%] right-[15%] text-6xl animate-float-delayed opacity-20">👻</div>
        <div className="absolute bottom-[40%] left-[20%] text-3xl animate-float opacity-10">🕷️</div>
        <div className="absolute top-[25%] right-[25%] text-4xl animate-float opacity-15">🍂</div>
        <div className="absolute bottom-[30%] right-[5%] text-5xl animate-float-delayed opacity-20">🎃</div>
        <div className="absolute top-[50%] left-[3%] text-4xl animate-float opacity-15">🦇</div>
        <div className="absolute bottom-10 left-[12%] text-3xl animate-float-delayed opacity-10">🕸️</div>
        <div className="absolute top-[15%] right-[35%] text-3xl animate-float opacity-12">💀</div>
      </div>
      
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="mb-12 space-y-4 animate-fade-in">
          <h1 className="text-5xl font-bold tracking-tight">
            Game <span className="text-primary">Library</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Explore {games.length} amazing games created by our community
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4 animate-fade-in-delay-1">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search games, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-card border-border"
              />
            </div>

            {/* Genre Filter */}
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full md:w-48 h-12 px-4 bg-card border border-border rounded-md text-foreground appearance-none cursor-pointer"
              >
                <option value="all">All Genres</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="lg"
                onClick={() => setViewMode("grid")}
                className="h-12"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="lg"
                onClick={() => setViewMode("list")}
                className="h-12"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredGames.length} of {games.length} games
          </p>
        </div>

        {/* Games Grid */}
        {filteredGames.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-2xl font-semibold">No games found</p>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-8 animate-fade-in-delay-2 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                description={game.description}
                imageUrl={game.image_url}
                genre={game.genre}
                maxPlayers={game.max_players}
                creatorName={game.creator_name}
                likes={game.likes}
                plays={game.plays}
                gameUrl={game.game_url}
                isLiked={likedGames.has(game.id)}
                onLikeToggle={fetchLikedGames}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;
