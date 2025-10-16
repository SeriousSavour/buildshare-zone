import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import GameCard from "@/components/games/GameCard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Grid3x3, List, Play } from "lucide-react";
import { toast } from "sonner";

interface Game {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  genre: string;
  max_players: string;
  creator_name: string;
  creator_id: string;
  likes: number;
  plays: number;
  game_url: string | null;
  category: string;
  created_at: string;
  creator_avatar?: string | null;
}

const Games = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cardSize, setCardSize] = useState<"small" | "medium" | "large">("medium");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "likes">("newest");
  const [likedGames, setLikedGames] = useState<Set<string>>(new Set());
  const [popularGames, setPopularGames] = useState<Game[]>([]);

  useEffect(() => {
    fetchGames();
    fetchLikedGames();
    fetchPopularGames();
  }, []);

  useEffect(() => {
    filterAndSortGames();
  }, [games, searchQuery, selectedGenre, sortBy]);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('category', 'game')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch creator profiles
      if (data && data.length > 0) {
        const creatorIds = [...new Set(data.map(g => g.creator_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, avatar_url')
          .in('user_id', creatorIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.avatar_url]) || []);
        
        const gamesWithAvatars = data.map(game => ({
          ...game,
          creator_avatar: profileMap.get(game.creator_id)
        }));

        setGames(gamesWithAvatars);
        setFilteredGames(gamesWithAvatars);
      } else {
        setGames([]);
        setFilteredGames([]);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('category', 'game')
        .order('plays', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch creator profiles for popular games
      if (data && data.length > 0) {
        const creatorIds = [...new Set(data.map(g => g.creator_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, avatar_url')
          .in('user_id', creatorIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.avatar_url]) || []);
        
        const gamesWithAvatars = data.map(game => ({
          ...game,
          creator_avatar: profileMap.get(game.creator_id)
        }));

        setPopularGames(gamesWithAvatars);
      }
    } catch (error) {
      console.error('Error fetching popular games:', error);
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

  const filterAndSortGames = () => {
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

    // Sort games
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.plays - a.plays;
        case "likes":
          return b.likes - a.likes;
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredGames(filtered);
  };

  const genres = Array.from(new Set(games.map(game => game.genre)));

  const getGridCols = () => {
    switch (cardSize) {
      case "small":
        return "grid-cols-1 md:grid-cols-3 lg:grid-cols-4";
      case "large":
        return "grid-cols-1 md:grid-cols-2";
      case "medium":
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

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
        <div className="mb-8 space-y-4 animate-fade-in">
          <h1 className="text-5xl font-bold tracking-tight">
            Game <span className="text-primary">Library</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Explore {games.length} amazing games created by our community
          </p>
        </div>

        {/* Popular Games Banner */}
        {popularGames.length > 0 && (
          <div className="mb-12 animate-fade-in-delay-1">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              Popular Games
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {popularGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => navigate(`/games/${game.id}`)}
                  className="group cursor-pointer relative overflow-hidden rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
                >
                  <div className="aspect-square relative overflow-hidden">
                    {game.image_url ? (
                      <img
                        src={game.image_url}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Play className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-bold text-white text-sm line-clamp-2">{game.title}</p>
                      <p className="text-xs text-white/80">{game.plays} plays</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 space-y-4 animate-fade-in-delay-2">
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

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full md:w-40 h-12 px-4 bg-card border border-border rounded-md text-foreground appearance-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Played</option>
                <option value="likes">Most Liked</option>
              </select>
            </div>

            {/* Card Size */}
            <div className="flex gap-2">
              <Button
                variant={cardSize === "small" ? "default" : "outline"}
                size="lg"
                onClick={() => setCardSize("small")}
                className="h-12"
                title="Small cards"
              >
                S
              </Button>
              <Button
                variant={cardSize === "medium" ? "default" : "outline"}
                size="lg"
                onClick={() => setCardSize("medium")}
                className="h-12"
                title="Medium cards"
              >
                M
              </Button>
              <Button
                variant={cardSize === "large" ? "default" : "outline"}
                size="lg"
                onClick={() => setCardSize("large")}
                className="h-12"
                title="Large cards"
              >
                L
              </Button>
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
            {sortBy !== "newest" && ` • Sorted by ${sortBy === "popular" ? "most played" : "most liked"}`}
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
            className={`grid gap-8 animate-fade-in-delay-3 ${
              viewMode === "grid"
                ? getGridCols()
                : "grid-cols-1"
            }`}
          >
            {filteredGames.map((game) => (
              <div key={game.id} onClick={() => navigate(`/games/${game.id}`)} className="cursor-pointer">
                <GameCard
                title={game.title}
                description={game.description}
                imageUrl={game.image_url}
                genre={game.genre}
                maxPlayers={game.max_players}
                creatorName={game.creator_name}
                creatorAvatar={game.creator_avatar}
                likes={game.likes}
                plays={game.plays}
                gameUrl={game.game_url}
                isLiked={likedGames.has(game.id)}
                onLikeToggle={fetchLikedGames}
                id={game.id}
              />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;
