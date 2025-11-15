import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import GameCard from "@/components/games/GameCard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Grid3x3, List, Play, Heart } from "lucide-react";
import { toast } from "sonner";
import { StyledKeyword } from "@/components/ui/styled-text";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { QuestList } from "@/components/quests/QuestList";
interface Particle {
  id: number;
  emoji: string;
  left: number;
  animationDuration: number;
  size: number;
}
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [totalGamesCount, setTotalGamesCount] = useState(0);

  useEffect(() => {
    // Force clear cache on initial mount to ensure fresh data
    localStorage.removeItem('games_cache_v2');
    localStorage.removeItem('games_cache_v2_timestamp');
    
    fetchGames();
    fetchLikedGames();
    fetchPopularGames();
    fetchCurrentUser();
  }, []);

  // Real-time subscription for automatic cache invalidation
  useEffect(() => {
    const channel = supabase
      .channel('games-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'games'
        },
        (payload) => {
          console.log('Game data changed, invalidating cache:', payload);
          // Clear cache
          localStorage.removeItem('games_cache_v2');
          localStorage.removeItem('games_cache_v2_timestamp');
          // Refetch data
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
  useEffect(() => {
    const emojis = ['🎃', '👻', '🍁', '🦇', '🍂', '💀', '🕷️', '🌙'];
    let particleId = 0;
    const generateParticle = () => {
      const particle: Particle = {
        id: particleId++,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        left: Math.random() * 100,
        animationDuration: 8 + Math.random() * 8,
        size: 0.8 + Math.random() * 3
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
  useEffect(() => {
    filterAndSortGames();
  }, [games, searchQuery, selectedGenre, sortBy, categoryFilter, likedGames, currentUserId]);
  const fetchCurrentUser = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;
    try {
      const {
        data
      } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });
      if (data && data.length > 0) {
        const userId = data[0].user_id;
        setCurrentUserId(userId);
        
        // Check if user is admin
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
        
        if (rolesData && rolesData.length > 0) {
          setIsAdmin(rolesData[0].role === 'admin');
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };
  const fetchGames = async () => {
    try {
      // Check if we should force refresh (after game creation)
      const forceRefresh = sessionStorage.getItem('force_games_refresh');
      if (forceRefresh) {
        console.log('Force refreshing games after creation');
        sessionStorage.removeItem('force_games_refresh');
        localStorage.removeItem('games_cache_v2');
        localStorage.removeItem('games_cache_v2_timestamp');
      }
      
      // Check cache first (v2 cache key to force refresh)
      const cachedData = localStorage.getItem('games_cache_v2');
      const cacheTimestamp = localStorage.getItem('games_cache_v2_timestamp');
      const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
      
      if (cachedData && cacheTimestamp && !forceRefresh) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < CACHE_DURATION) {
          // Use cached data
          console.log('Loading games from cache');
          const cached = JSON.parse(cachedData);
          setGames(cached.games);
          setFilteredGames(cached.games);
          setFeaturedGame(cached.featuredGame);
          setTotalGamesCount(cached.games.length);
          setLoading(false);
          toast.success("Games Loaded!");
          return;
        }
      }
      
      // Cache miss - fetch from database
      setLoadingProgress(5);
      
      // First get the total count
      const { count } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'game');
      
      setTotalGamesCount(count || 0);
      setLoadingProgress(10);
      
      // Fetch ALL games at once
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('category', 'game')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      console.log(`Fetched ${data?.length || 0} games from database`);
      
      // If no games exist, clear the cache immediately
      if (!data || data.length === 0) {
        console.log('No games found in database, clearing cache');
        localStorage.removeItem('games_cache_v2');
        localStorage.removeItem('games_cache_v2_timestamp');
        setGames([]);
        setFilteredGames([]);
        setFeaturedGame(null);
        setLoading(false);
        return;
      }
      setLoadingProgress(40);

      // Fetch creator profiles
      if (data && data.length > 0) {
        const creatorIds = [...new Set(data.map(g => g.creator_id))];
        setLoadingProgress(50);
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, avatar_url')
          .in('user_id', creatorIds);
        
        setLoadingProgress(70);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.avatar_url]) || []);
        const gamesWithAvatars = data.map(game => ({
          ...game,
          creator_avatar: profileMap.get(game.creator_id)
        }));
        
        setLoadingProgress(85);
        console.log(`Displaying ${gamesWithAvatars.length} games with avatars`);
        setGames(gamesWithAvatars);
        setFilteredGames(gamesWithAvatars);

        // Set featured game (most played overall)
        const topGame = [...data].sort((a, b) => b.plays - a.plays)[0];
        let featured = null;
        if (topGame) {
          featured = {
            ...topGame,
            creator_avatar: profileMap.get(topGame.creator_id)
          };
          setFeaturedGame(featured);
        }
        
        // Cache the data (v2 cache key)
        localStorage.setItem('games_cache_v2', JSON.stringify({
          games: gamesWithAvatars,
          featuredGame: featured
        }));
        localStorage.setItem('games_cache_v2_timestamp', Date.now().toString());
        
        setLoadingProgress(100);
      } else {
        setGames([]);
        setFilteredGames([]);
        setLoadingProgress(100);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error("Failed to load games");
      setLoadingProgress(100);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularGames = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('games').select('*').eq('category', 'game').order('plays', {
        ascending: false
      }).limit(5);
      if (error) throw error;

      // Fetch creator profiles for popular games
      if (data && data.length > 0) {
        const creatorIds = [...new Set(data.map(g => g.creator_id))];
        const {
          data: profiles
        } = await supabase.from('profiles').select('user_id, avatar_url').in('user_id', creatorIds);
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
      const {
        data: userData
      } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });
      if (!userData || userData.length === 0) return;
      const userId = userData[0].user_id;
      const {
        data,
        error
      } = await supabase.from('game_likes').select('game_id').eq('user_id', userId);
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
      filtered = filtered.filter(game => game.title.toLowerCase().includes(searchQuery.toLowerCase()) || game.description?.toLowerCase().includes(searchQuery.toLowerCase()) || game.creator_name.toLowerCase().includes(searchQuery.toLowerCase()));
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
    return <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6 w-full max-w-md">
              <div className="space-y-3">
                <p className="text-3xl font-bold gradient-text-animated">Loading activities...</p>
                <p className="text-xl text-muted-foreground font-semibold">
                  Loading {totalGamesCount || '...'} assets
                </p>
                <p className="text-lg text-primary">
                  {loadingProgress}%
                </p>
              </div>
              
              {/* Animated Progress Bar */}
              <div className="relative w-full h-4 bg-card border-2 border-primary/40 rounded-full overflow-hidden shadow-lg">
                {/* Background track */}
                <div className="absolute inset-0 bg-gradient-to-r from-card via-card/50 to-card" />
                
                {/* Progress fill */}
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
                
                {/* Animated scanning line */}
                <div 
                  className="absolute inset-y-0 w-1 bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]"
                  style={{ 
                    left: `${loadingProgress}%`,
                    transition: 'left 0.3s ease-out'
                  }}
                />
                
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                  style={{ 
                    width: `${loadingProgress}%`,
                    backgroundSize: '200% 100%'
                  }}
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                Gathering activities...
              </p>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-secondary/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {!hideNavigation && <Navigation />}
      {!hideNavigation && <AnnouncementBanner />}
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Main Content - Full Width */}
        <div className="w-full">
        {/* Header with modern design */}
        <div className="mb-12 space-y-6 animate-fade-in">
          <div className="space-y-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight gradient-text-animated">
              Activity
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover and play amazing activities created by our community
            </p>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            <div className="px-4 py-2 bg-card/80 border border-border rounded-full backdrop-blur-sm">
              <p className="text-sm font-medium text-muted-foreground">
                <span className="text-primary font-bold">{games.length}</span> activities available
              </p>
            </div>
          </div>
        </div>

        {/* Featured Game Banner */}
        {featuredGame && <div className="mb-12 animate-fade-in-delay-1">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 group">
              <div className="absolute inset-0">
                {featuredGame.image_url && <img src={featuredGame.image_url} alt={featuredGame.title} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-300" />}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/70 to-transparent" />
              </div>
              <div className="relative p-8 md:p-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold border border-primary/30">
                    ⭐ Featured
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
                  {featuredGame.title}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-2xl line-clamp-2">
                  {featuredGame.description || "No description available"}
                </p>
                <div className="flex items-center gap-6 mb-6">
                  <span className="flex items-center gap-2 text-sm">
                    <Play className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{featuredGame.plays}</span>
                    <span className="text-muted-foreground">plays</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{featuredGame.likes}</span>
                    <span className="text-muted-foreground">likes</span>
                  </span>
                </div>
                <Button 
                  size="lg" 
                  className="gap-2" 
                  onClick={() => {
                    if (onGameClick) {
                      onGameClick(featuredGame.id, featuredGame.title);
                    } else {
                      navigate(`/games/${featuredGame.id}`);
                    }
                  }}
                >
                  <Play className="w-4 h-4" />
                  Play Now
                </Button>
              </div>
            </div>
          </div>}

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 animate-fade-in-delay-2">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="text" placeholder="Search activities..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-card border-border" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="w-full md:w-48 h-10 px-3 bg-card border border-border rounded-md text-foreground appearance-none cursor-pointer pr-10 text-sm">
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="likes">Most Liked</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* View Dropdown */}
            <div className="relative">
              <select value={cardSize} onChange={e => setCardSize(e.target.value as any)} className="w-full md:w-40 h-10 px-3 bg-card border border-border rounded-md text-foreground appearance-none cursor-pointer pr-10 text-sm">
                <option value="small">Compact</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              <Grid3x3 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button size="sm" variant={categoryFilter === "all" ? "default" : "outline"} onClick={() => setCategoryFilter("all")} className="whitespace-nowrap">
              All
            </Button>
            <Button size="sm" variant={categoryFilter === "favorites" ? "default" : "outline"} onClick={() => setCategoryFilter("favorites")} className="whitespace-nowrap">
              Favorites
            </Button>
            <Button size="sm" variant={categoryFilter === "popular" ? "default" : "outline"} onClick={() => setCategoryFilter("popular")} className="whitespace-nowrap">
              Popular
            </Button>
            <Button size="sm" variant={categoryFilter === "new" ? "default" : "outline"} onClick={() => setCategoryFilter("new")} className="whitespace-nowrap">
              New
            </Button>
            {genres.map(genre => <Button size="sm" key={genre} variant={selectedGenre === genre ? "default" : "outline"} onClick={() => {
            setSelectedGenre(genre);
            setCategoryFilter("all");
          }} className="whitespace-nowrap">
                {genre}
              </Button>)}
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            Showing {filteredGames.length} of {games.length} activities
          </p>
        </div>

        {/* Games Grid */}
        {filteredGames.length === 0 ? <div className="text-center py-16 space-y-4 max-w-xl mx-auto">
            <div className="text-4xl mb-2">🎮</div>
            <h3 className="text-2xl font-bold gradient-text">No Activities Found</h3>
            <p className="text-muted-foreground">
              {games.length === 0 
                ? "Be the first to add an activity!"
                : "Try adjusting your search or filters"}
            </p>
            {games.length === 0 && (
              <Button 
                onClick={() => navigate("/create")} 
                className="mt-4"
                size="lg"
              >
                Create New Activity
              </Button>
            )}
          </div> : <div className={`grid gap-6 animate-fade-in-delay-3 ${viewMode === "grid" ? getGridCols() : "grid-cols-1"}`}>
            {filteredGames.map(game => <GameCard key={game.id} title={game.title} description={game.description} imageUrl={game.image_url} genre={game.genre} maxPlayers={game.max_players} creatorName={game.creator_name} creatorAvatar={game.creator_avatar} likes={game.likes} plays={game.plays} gameUrl={game.game_url} isLiked={likedGames.has(game.id)} onLikeToggle={fetchLikedGames} id={game.id} isAdmin={isAdmin} creatorId={game.creator_id} onDelete={fetchGames} onGameClick={onGameClick} />)}
          </div>}
        </div>
      </div>

      {/* Fixed Right Sidebar - Quests & Leaderboard */}
      <div className="hidden xl:block fixed right-0 top-20 bottom-0 w-80 z-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/80 to-transparent pointer-events-none" />
        <div className="relative h-full overflow-y-auto py-4 pr-4 pl-2 pointer-events-auto space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          <QuestList />
          <Leaderboard />
        </div>
      </div>
    </div>;
};
export default Games;