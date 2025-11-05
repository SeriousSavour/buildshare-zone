import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCw, X, Plus, Home, MoreVertical, Heart, Share2, Maximize2, Minimize2, Search, Filter, Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GameCard from "@/components/games/GameCard";
import QuickLinks from "@/components/browser/QuickLinks";

interface Tab {
  id: string;
  title: string;
  url: string;
  type: "home" | "games" | "game";
  gameId?: string;
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

const BrowserView = () => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Home", url: "shadow://home", type: "home" }
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [addressBar, setAddressBar] = useState("shadow://home");
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeSize, setIframeSize] = useState({ width: 900, height: 600 });
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [useDirectUrl, setUseDirectUrl] = useState(false);
  
  // Games page filters and options
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cardSize, setCardSize] = useState<"small" | "medium" | "large">("medium");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "likes">("popular");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "favorites" | "popular" | "new">("all");
  const [likedGames, setLikedGames] = useState<Set<string>>(new Set());
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const activeTabData = tabs.find(t => t.id === activeTab);
    if (activeTabData?.type === "games") {
      fetchGames();
      fetchLikedGames();
      fetchCurrentUser();
    }
  }, [activeTab]);

  useEffect(() => {
    if (games.length > 0) {
      filterAndSortGames();
    }
  }, [games, searchQuery, selectedGenre, sortBy, categoryFilter, likedGames]);

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "New Tab",
      url: "shadow://home",
      type: "home"
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
    setAddressBar(newTab.url);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    if (newTabs.length === 0) {
      navigate("/");
      return;
    }
    setTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs[0].id);
      setAddressBar(newTabs[0].url);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setAddressBar(tab.url);
      if (tab.type === "game" && tab.gameId) {
        loadGameInBrowser(tab.gameId);
      }
    }
  };

  const navigateToGames = () => {
    const gamesTab = tabs.find(t => t.type === "games");
    if (gamesTab) {
      setActiveTab(gamesTab.id);
      setAddressBar(gamesTab.url);
    } else {
      const newTab: Tab = {
        id: Date.now().toString(),
        title: "Games",
        url: "shadow://games",
        type: "games"
      };
      setTabs([...tabs, newTab]);
      setActiveTab(newTab.id);
      setAddressBar(newTab.url);
    }
  };

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
    setLoadingGames(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('category', 'game')
        .order('created_at', { ascending: false });
      
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
        
        setGames(gamesWithAvatars);
        setFilteredGames(gamesWithAvatars);
        
        // Set featured game (most played)
        const topGame = [...gamesWithAvatars].sort((a, b) => b.plays - a.plays)[0];
        if (topGame) {
          setFeaturedGame(topGame);
        }
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error("Failed to load games");
    } finally {
      setLoadingGames(false);
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

  const openGameInNewTab = (game: Game) => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: game.title,
      url: `shadow://game/${game.id}`,
      type: "game",
      gameId: game.id
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
    setAddressBar(newTab.url);
    loadGameInBrowser(game.id);
  };

  const loadGameInBrowser = async (gameId: string) => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;

      // Fetch creator profile
      if (data.creator_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', data.creator_id)
          .single();
        
        data.creator_avatar = profileData?.avatar_url;
      }

      setCurrentGame(data);
      checkIfLiked(gameId);
      incrementPlayCount(gameId);
      
      // Load game content
      if (data.game_url) {
        loadGameContent(data.game_url);
      }
    } catch (error) {
      console.error('Error loading game:', error);
      toast.error("Failed to load game");
    }
  };

  const decodeHtmlEntities = (html: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  };

  const loadGameContent = async (gameUrl: string) => {
    const isRawHtml = gameUrl.trim().startsWith('<') || 
                      gameUrl.includes('<!DOCTYPE') ||
                      gameUrl.includes('<html') ||
                      gameUrl.includes('&lt;');
    
    if (isRawHtml) {
      const decodedHtml = decodeHtmlEntities(gameUrl);
      setHtmlContent(decodedHtml);
      setUseDirectUrl(false);
      return;
    }
    
    if (gameUrl.endsWith('.html')) {
      try {
        const response = await fetch(gameUrl);
        const html = await response.text();
        
        const baseMatch = html.match(/<base\s+href=["']([^"']+)["']/i);
        if (baseMatch && baseMatch[1]) {
          const baseUrl = baseMatch[1];
          if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
            setUseDirectUrl(true);
            setHtmlContent(baseUrl);
            return;
          }
        }
        
        setHtmlContent(html);
        setUseDirectUrl(false);
      } catch (error) {
        console.error('Error fetching HTML:', error);
        setHtmlContent(gameUrl);
        setUseDirectUrl(true);
      }
    } else {
      setHtmlContent(gameUrl);
      setUseDirectUrl(true);
    }
  };

  const checkIfLiked = async (gameId: string) => {
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
        .eq('game_id', gameId)
        .eq('user_id', userData[0].user_id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      setIsLiked(false);
    }
  };

  const incrementPlayCount = async (gameId: string) => {
    try {
      await supabase.rpc('increment_game_plays', { _game_id: gameId });
    } catch (error) {
      console.error('Error updating play count:', error);
    }
  };

  const handleLike = async () => {
    if (!currentGame) return;
    
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please login to like games");
      return;
    }

    try {
      const { data: userData } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });
      
      if (!userData || userData.length === 0) return;

      const { data: result } = await supabase.rpc('toggle_game_like', {
        _game_id: currentGame.id,
        _user_id: userData[0].user_id
      });

      if (result) {
        setIsLiked(result.is_liked);
        setCurrentGame(prev => prev ? { ...prev, likes: result.like_count } : null);
        toast.success(result.is_liked ? "Game liked!" : "Like removed");
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like");
    }
  };

  const handleShare = () => {
    if (currentGame) {
      const shareUrl = `${window.location.origin}/games/${currentGame.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fullscreen Game View */}
      {isFullscreen && currentGame?.game_url && (
        <>
          <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary/90 to-purple-600/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">🎮 {currentGame.title}</h1>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <iframe
            src={useDirectUrl ? htmlContent || undefined : undefined}
            srcDoc={!useDirectUrl ? htmlContent || undefined : undefined}
            className="fixed inset-0 w-full h-full z-[99] bg-background pt-[72px]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation"
          />
        </>
      )}

      {/* Tab Bar */}
      <div className="bg-card border-b border-border flex items-center px-2 py-1">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
          <div className="flex items-center gap-1">
            <TabsList className="h-9 bg-transparent p-0 gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative group h-9 rounded-t-lg rounded-b-none px-4 data-[state=active]:bg-background data-[state=active]:border-t data-[state=active]:border-x border-border data-[state=inactive]:bg-muted/50"
                >
                  <span className="text-sm max-w-[120px] truncate">{tab.title}</span>
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              variant="ghost"
              size="sm"
              onClick={addNewTab}
              className="h-7 w-7 p-0 rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Tabs>
      </div>

      {/* Navigation Bar */}
      <div className="bg-card border-b border-border px-3 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 relative">
          <Input
            value={addressBar}
            readOnly
            className="w-full bg-muted/50 border-border pr-10"
            placeholder="shadow://..."
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => {
              setActiveTab(tabs[0].id);
              setAddressBar(tabs[0].url);
            }}
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} className="h-full">
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="h-full m-0 p-0">
              {tab.type === "home" && (
                <div className="flex flex-col items-center justify-center min-h-full p-8">
                  <div className="w-full max-w-4xl">
                    <QuickLinks />
                  </div>
                </div>
              )}

              {tab.type === "games" && (
                <div className="min-h-full bg-background">
                  <div className="container mx-auto px-4 py-8">
                    {/* Featured Game of the Week */}
                    {featuredGame && (
                      <section className="mb-12">
                        <h2 className="text-4xl font-bold mb-6 gradient-text-animated text-glow">
                          🏆 Game of the Week
                        </h2>
                        <div 
                          className="relative overflow-hidden rounded-2xl border-2 border-primary/50 hover:border-primary transition-all duration-500 cursor-pointer group shadow-2xl"
                          onClick={() => openGameInNewTab(featuredGame)}
                        >
                          <div className="aspect-[21/9] relative">
                            {featuredGame.image_url ? (
                              <img
                                src={featuredGame.image_url}
                                alt={featuredGame.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                              <div className="flex items-end justify-between">
                                <div className="flex-1">
                                  <h3 className="text-5xl font-bold mb-3 text-glow">{featuredGame.title}</h3>
                                  <p className="text-xl text-muted-foreground/90 mb-4 max-w-2xl line-clamp-2">
                                    {featuredGame.description || "No description available"}
                                  </p>
                                  <div className="flex items-center gap-6 text-lg">
                                    <span className="flex items-center gap-2">
                                      <Heart className="w-5 h-5 text-primary" />
                                      {featuredGame.likes} likes
                                    </span>
                                    <span className="flex items-center gap-2">
                                      👥 {featuredGame.plays} plays
                                    </span>
                                    <span className="px-3 py-1 bg-primary/20 rounded-full">
                                      {featuredGame.genre}
                                    </span>
                                  </div>
                                </div>
                                <Button size="lg" className="glow-orange hover-scale">
                                  Play Now
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Search and Filters */}
                    <div className="mb-10 space-y-6">
                      {/* Search Bar with View Mode */}
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            placeholder="Search games, creators, or descriptions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 text-base bg-card/50 border-2 hover:border-primary/30 focus:border-primary transition-colors rounded-xl"
                          />
                        </div>
                        <div className="flex gap-2 bg-card/50 p-2 rounded-xl border-2 border-border">
                          <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="icon"
                            className="h-10 w-10 rounded-lg transition-all"
                            onClick={() => setViewMode("grid")}
                          >
                            <Grid3x3 className="w-5 h-5" />
                          </Button>
                          <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="icon"
                            className="h-10 w-10 rounded-lg transition-all"
                            onClick={() => setViewMode("list")}
                          >
                            <List className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>

                      {/* Modern Filter Pills */}
                      <div className="bg-card/50 rounded-2xl p-6 border-2 border-border space-y-5">
                        {/* Category Filters */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            <Filter className="w-4 h-4" />
                            <span>Categories</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={categoryFilter === "all" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCategoryFilter("all")}
                              className="rounded-full px-5 h-9 font-medium transition-all hover:scale-105"
                            >
                              All Games
                            </Button>
                            <Button
                              variant={categoryFilter === "popular" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCategoryFilter("popular")}
                              className="rounded-full px-5 h-9 font-medium transition-all hover:scale-105"
                            >
                              🔥 Popular
                            </Button>
                            <Button
                              variant={categoryFilter === "new" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCategoryFilter("new")}
                              className="rounded-full px-5 h-9 font-medium transition-all hover:scale-105"
                            >
                              ✨ New
                            </Button>
                            <Button
                              variant={categoryFilter === "favorites" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCategoryFilter("favorites")}
                              className="rounded-full px-5 h-9 font-medium transition-all hover:scale-105"
                            >
                              <Heart className={`w-4 h-4 mr-2 ${categoryFilter === "favorites" ? "fill-current" : ""}`} />
                              Favorites
                            </Button>
                          </div>
                        </div>

                        {/* Genre Filters */}
                        <div className="space-y-3">
                          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Genres
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={selectedGenre === "all" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedGenre("all")}
                              className="rounded-full px-5 h-9 font-medium transition-all hover:scale-105"
                            >
                              All Genres
                            </Button>
                            {genres.map((genre) => (
                              <Button
                                key={genre}
                                variant={selectedGenre === genre ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedGenre(genre)}
                                className="rounded-full px-5 h-9 font-medium transition-all hover:scale-105"
                              >
                                {genre}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Sort and Display Options */}
                        <div className="flex flex-wrap gap-6 pt-2 border-t border-border/50">
                          {/* Sort By */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-muted-foreground">Sort:</span>
                            <div className="flex gap-2">
                              <Button
                                variant={sortBy === "popular" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSortBy("popular")}
                                className="rounded-lg px-4 h-9 font-medium transition-all hover:scale-105"
                              >
                                🔥 Popular
                              </Button>
                              <Button
                                variant={sortBy === "newest" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSortBy("newest")}
                                className="rounded-lg px-4 h-9 font-medium transition-all hover:scale-105"
                              >
                                ⏰ Newest
                              </Button>
                              <Button
                                variant={sortBy === "likes" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSortBy("likes")}
                                className="rounded-lg px-4 h-9 font-medium transition-all hover:scale-105"
                              >
                                💖 Most Liked
                              </Button>
                            </div>
                          </div>

                          {/* Card Size */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-muted-foreground">Size:</span>
                            <div className="flex gap-1 bg-background/50 p-1 rounded-lg">
                              <Button
                                variant={cardSize === "small" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setCardSize("small")}
                                className="rounded-md px-3 h-8 text-xs font-medium transition-all"
                              >
                                S
                              </Button>
                              <Button
                                variant={cardSize === "medium" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setCardSize("medium")}
                                className="rounded-md px-3 h-8 text-xs font-medium transition-all"
                              >
                                M
                              </Button>
                              <Button
                                variant={cardSize === "large" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setCardSize("large")}
                                className="rounded-md px-3 h-8 text-xs font-medium transition-all"
                              >
                                L
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Games Grid */}
                    {loadingGames ? (
                      <div className="text-center py-20">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-2xl font-bold gradient-text-animated">Loading games...</p>
                      </div>
                    ) : filteredGames.length === 0 ? (
                      <div className="text-center py-20">
                        <p className="text-2xl font-bold text-muted-foreground mb-4">No games found</p>
                        <p className="text-muted-foreground">Try adjusting your filters or search query</p>
                      </div>
                    ) : (
                      <div className={`grid ${getGridCols()} gap-8`}>
                        {filteredGames.map((game) => (
                          <div key={game.id} onClick={() => openGameInNewTab(game)} className="cursor-pointer">
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
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab.type === "game" && currentGame && (
                <div className="h-full flex flex-col">
                  {/* Game Header */}
                  <div className="bg-card border-b border-border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {currentGame.image_url && (
                        <img src={currentGame.image_url} alt={currentGame.title} className="w-12 h-12 rounded object-cover" />
                      )}
                      <div>
                        <h2 className="text-xl font-bold">{currentGame.title}</h2>
                        <p className="text-sm text-muted-foreground">by {currentGame.creator_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isLiked ? "default" : "outline"}
                        size="sm"
                        onClick={handleLike}
                      >
                        <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                        {currentGame.likes}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
                        <Maximize2 className="w-4 h-4 mr-2" />
                        Fullscreen
                      </Button>
                    </div>
                  </div>

                  {/* Game Iframe */}
                  <div className="flex-1 flex items-center justify-center bg-background p-8">
                    {currentGame.game_url && htmlContent ? (
                      <div className="relative" style={{ width: `${iframeSize.width}px`, height: `${iframeSize.height}px` }}>
                        <iframe
                          ref={iframeRef}
                          src={useDirectUrl ? htmlContent || undefined : undefined}
                          srcDoc={!useDirectUrl ? htmlContent || undefined : undefined}
                          className="w-full h-full border-2 border-border rounded-lg bg-white"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation"
                        />
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <p className="text-muted-foreground">No game URL available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default BrowserView;
