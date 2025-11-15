import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import GameCard from "@/components/games/GameCard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid3x3, List, Play, Heart } from "lucide-react";
import { toast } from "sonner";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { QuestList } from "@/components/quests/QuestList";

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

interface GamesProps {
  onGameClick?: (gameId: string, gameTitle: string) => void;
  hideNavigation?: boolean;
}

const Games = ({ onGameClick, hideNavigation = false }: GamesProps = {}) => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cardSize, setCardSize] = useState<"small" | "medium" | "large">("medium");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "likes">("popular");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "favorites" | "popular" | "new" | string>("all");
  const [likedGames, setLikedGames] = useState<Set<string>>(new Set());
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const gamesGridRef = useRef<HTMLDivElement>(null);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    localStorage.removeItem('games_cache_v2');
    localStorage.removeItem('games_cache_v2_timestamp');
    
    fetchGames();
    fetchLikedGames();
    fetchPopularGames();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('games-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games'
        },
        (payload) => {
          console.log('Game data changed, invalidating cache:', payload);
          localStorage.removeItem('games_cache_v2');
          localStorage.removeItem('games_cache_v2_timestamp');
          fetchGames();
          fetchPopularGames();
          toast.success('Activities updated!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('category', 'game')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        localStorage.removeItem('games_cache_v2');
        localStorage.removeItem('games_cache_v2_timestamp');
        setGames([]);
        setFilteredGames([]);
        setFeaturedGame(null);
        setLoading(false);
        return;
      }

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

        const topGame = [...data].sort((a, b) => b.plays - a.plays)[0];
        let featured = null;
        if (topGame) {
          featured = {
            ...topGame,
            creator_avatar: profileMap.get(topGame.creator_id)
          };
          setFeaturedGame(featured);
        }
        
        localStorage.setItem('games_cache_v2', JSON.stringify({
          games: gamesWithAvatars,
          featuredGame: featured
        }));
        localStorage.setItem('games_cache_v2_timestamp', Date.now().toString());
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
      
      const { data } = await supabase
        .from('game_likes')
        .select('game_id')
        .eq('user_id', userId);
      
      if (data) {
        setLikedGames(new Set(data.map(like => like.game_id)));
      }
    } catch (error) {
      console.error('Error fetching liked games:', error);
    }
  };

  const fetchCurrentUser = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    try {
      const { data: userData } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (userData && userData.length > 0) {
        const userId = userData[0].user_id;
        setCurrentUserId(userId);

        const { data: roleData } = await supabase.rpc('get_user_role', {
          _user_id: userId
        });

        setIsAdmin(roleData === 'admin');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    let filtered = [...games];

    if (searchQuery) {
      filtered = filtered.filter(game =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        game.creator_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGenre !== "all") {
      filtered = filtered.filter(game => game.genre === selectedGenre);
    }

    if (categoryFilter === "favorites") {
      filtered = filtered.filter(game => likedGames.has(game.id));
    } else if (categoryFilter === "popular") {
      filtered = filtered.filter(game => popularGames.some(pg => pg.id === game.id));
    } else if (categoryFilter === "new") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(game => new Date(game.created_at) >= sevenDaysAgo);
    }

    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "popular") {
      filtered.sort((a, b) => b.plays - a.plays);
    } else if (sortBy === "likes") {
      filtered.sort((a, b) => b.likes - a.likes);
    }

    setIsFiltering(true);
    setFilteredGames(filtered);
    
    // Smooth scroll to games grid when filters change
    if (gamesGridRef.current && !loading) {
      setTimeout(() => {
        gamesGridRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 100);
    }
    
    // Reset filtering state after animation
    setTimeout(() => setIsFiltering(false), 600);
  }, [searchQuery, selectedGenre, games, sortBy, categoryFilter, likedGames, popularGames, loading]);

  const genres = Array.from(new Set(games.map(game => game.genre))).filter(Boolean);

  const handleGameClick = (gameId: string, gameTitle: string) => {
    if (onGameClick) {
      onGameClick(gameId, gameTitle);
    } else {
      navigate(`/games/${gameId}`);
    }
  };

  const getGridClass = () => {
    if (viewMode === "list") {
      return "grid gap-4 grid-cols-1";
    }
    
    switch (cardSize) {
      case "small":
        return "grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
      case "large":
        return "grid gap-6 grid-cols-1 md:grid-cols-2";
      default:
        return "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {!hideNavigation && <Navigation />}
      {!hideNavigation && <AnnouncementBanner />}

      <div className="container mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Play className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold gradient-text-animated">
              Activity Center
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Discover and play amazing games
          </p>
        </div>

        {/* Featured Game Banner */}
        {featuredGame && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-border bg-card relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="relative p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="relative w-full md:w-40 h-40 rounded-xl overflow-hidden flex-shrink-0 border border-border/50">
                  {featuredGame.image_url ? (
                    <img 
                      src={featuredGame.image_url} 
                      alt={featuredGame.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                    ⭐ Featured
                  </div>
                  <h2 className="text-2xl font-bold gradient-text">
                    {featuredGame.title}
                  </h2>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {featuredGame.description || 'No description available'}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" /> {featuredGame.plays.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {featuredGame.likes.toLocaleString()}
                    </span>
                  </div>
                  <Button 
                    size="sm"
                    className="mt-2"
                    onClick={() => handleGameClick(featuredGame.id, featuredGame.title)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
              className="rounded-full"
            >
              All
            </Button>
            <Button
              variant={categoryFilter === "popular" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCategoryFilter("popular")}
              className="rounded-full"
            >
              🔥 Popular
            </Button>
            <Button
              variant={categoryFilter === "new" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCategoryFilter("new")}
              className="rounded-full"
            >
              ✨ New
            </Button>
            <Button
              variant={categoryFilter === "favorites" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCategoryFilter("favorites")}
              className="rounded-full"
            >
              ❤️ Favorites
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading games...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredGames.length === 0 && (
          <div className="text-center py-20 space-y-4 border border-border rounded-2xl bg-card">
            <Play className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
            <h3 className="text-xl font-semibold">No games found</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {searchQuery || selectedGenre !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Be the first to create a game"}
            </p>
          </div>
        )}

        {/* Games Grid */}
        {!loading && filteredGames.length > 0 && (
          <div 
            ref={gamesGridRef}
            className={`${getGridClass()} transition-opacity duration-300 ${isFiltering ? 'opacity-50' : 'opacity-100'}`}
          >
            {filteredGames.map((game, index) => (
              <div
                key={game.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <GameCard
                  id={game.id}
                  title={game.title}
                  description={game.description}
                  imageUrl={game.image_url}
                  genre={game.genre}
                  maxPlayers={game.max_players}
                  creatorName={game.creator_name}
                  creatorAvatar={game.creator_avatar}
                  creatorId={game.creator_id}
                  likes={game.likes}
                  plays={game.plays}
                  gameUrl={game.game_url}
                  isLiked={likedGames.has(game.id)}
                  isAdmin={isAdmin}
                  onGameClick={() => handleGameClick(game.id, game.title)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Sidebar Widgets */}
        {!hideNavigation && (
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <h3 className="text-xl font-bold gradient-text-secondary">Leaderboard</h3>
              <Leaderboard />
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-bold gradient-text-accent">Quests</h3>
              <QuestList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;
