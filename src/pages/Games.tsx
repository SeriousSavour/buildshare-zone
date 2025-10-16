import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import GameCard from "@/components/games/GameCard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Grid3x3, List, Play, Heart } from "lucide-react";
import { toast } from "sonner";
import { StyledKeyword } from "@/components/ui/styled-text";

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
  const [categoryFilter, setCategoryFilter] = useState<"all" | "favorites" | "popular" | "new" | string>("all");
  const [likedGames, setLikedGames] = useState<Set<string>>(new Set());
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
    fetchLikedGames();
    fetchPopularGames();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    filterAndSortGames();
  }, [games, searchQuery, selectedGenre, sortBy, categoryFilter, likedGames, currentUserId]);

  const fetchCurrentUser = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    try {
      const { data } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });
      if (data && data.length > 0) {
        setCurrentUserId(data[0].user_id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

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
        
        // Set featured game (most played)
        const featured = [...gamesWithAvatars].sort((a, b) => b.plays - a.plays)[0];
        setFeaturedGame(featured || null);
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

    // Filter by category
    switch (categoryFilter) {
      case "favorites":
        if (currentUserId) {
          filtered = filtered.filter(game => likedGames.has(game.id));
        }
        break;
      case "popular":
        filtered = filtered.filter(game => game.plays > 20);
        break;
      case "new":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(game => new Date(game.created_at) > weekAgo);
        break;
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
        <div className="mb-8 space-y-4 animate-fade-in text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Spooky <StyledKeyword keyword="Games" className="text-primary" /> 🎃 👻
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover spine-chilling games this October! 🎃✨
          </p>
          <p className="text-sm text-muted-foreground">
            🦇 {games.length} haunted games waiting for you 🦇
          </p>
        </div>

        {/* Featured Game Banner */}
        {featuredGame && (
          <div className="mb-12 animate-fade-in-delay-1">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
              <div className="absolute inset-0">
                {featuredGame.image_url && (
                  <img
                    src={featuredGame.image_url}
                    alt={featuredGame.title}
                    className="w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              </div>
              <div className="relative p-8 md:p-12">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary/90 text-primary-foreground rounded-full text-xs font-medium">
                    👑 Featured Game (2/5)
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  {featuredGame.title}
                </h2>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl line-clamp-2">
                  {featuredGame.description || "No description available"}
                </p>
                <div className="flex items-center gap-6 mb-6 text-sm">
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {featuredGame.plays} plays
                  </span>
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    {featuredGame.likes} likes
                  </span>
                </div>
                <Button
                  size="lg"
                  className="gap-2 glow-orange"
                  onClick={() => navigate(`/games/${featuredGame.id}`)}
                >
                  <Play className="w-4 h-4" />
                  Play Now! 🎮
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 animate-fade-in-delay-2">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Find your next favorite game... 🎮"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-card border-border"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full md:w-52 h-12 px-4 bg-card border border-border rounded-md text-foreground appearance-none cursor-pointer pr-10"
              >
                <option value="newest">📅 Sort: Newest</option>
                <option value="popular">🔥 Sort: Most Popular</option>
                <option value="likes">❤️ Sort: Most Liked</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* View Dropdown */}
            <div className="relative">
              <select
                value={cardSize}
                onChange={(e) => setCardSize(e.target.value as any)}
                className="w-full md:w-44 h-12 px-4 bg-card border border-border rounded-md text-foreground appearance-none cursor-pointer pr-10"
              >
                <option value="small">⬜ View: Compact</option>
                <option value="medium">🟧 View: Comfy</option>
                <option value="large">🟥 View: Spacious</option>
              </select>
              <Grid3x3 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              onClick={() => setCategoryFilter("all")}
              className="gap-2 whitespace-nowrap"
            >
              🎮 All Games
            </Button>
            <Button
              variant={categoryFilter === "favorites" ? "default" : "outline"}
              onClick={() => setCategoryFilter("favorites")}
              className="gap-2 whitespace-nowrap"
            >
              ❤️ Favorites
            </Button>
            <Button
              variant={categoryFilter === "popular" ? "default" : "outline"}
              onClick={() => setCategoryFilter("popular")}
              className="gap-2 whitespace-nowrap"
            >
              🔥 Popular
            </Button>
            <Button
              variant={categoryFilter === "new" ? "default" : "outline"}
              onClick={() => setCategoryFilter("new")}
              className="gap-2 whitespace-nowrap"
            >
              ✨ New
            </Button>
            {genres.map(genre => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                onClick={() => {
                  setSelectedGenre(genre);
                  setCategoryFilter("all");
                }}
                className="whitespace-nowrap"
              >
                {genre}
              </Button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredGames.length} of {games.length} games
            {categoryFilter !== "all" && ` in ${categoryFilter}`}
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
