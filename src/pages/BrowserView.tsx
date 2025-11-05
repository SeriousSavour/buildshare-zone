import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCw, X, Plus, Home, MoreVertical, Heart, Share2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GameCard from "@/components/games/GameCard";

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
  const [loadingGames, setLoadingGames] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeSize, setIframeSize] = useState({ width: 900, height: 600 });
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [useDirectUrl, setUseDirectUrl] = useState(false);

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
    fetchGames();
  };

  const fetchGames = async () => {
    setLoadingGames(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('category', 'game')
        .order('plays', { ascending: false });
      
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
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error("Failed to load games");
    } finally {
      setLoadingGames(false);
    }
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
                <div className="flex flex-col items-center justify-center min-h-full p-8 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Home className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                      shadow browser
                    </h1>
                    <p className="text-muted-foreground text-lg">Your gaming hub in browser mode</p>
                  </div>
                  <div className="space-y-4 max-w-md">
                    <Button onClick={navigateToGames} size="lg" className="w-full">
                      Browse Games
                    </Button>
                    <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                      Return to Main App
                    </Button>
                  </div>
                </div>
              )}

              {tab.type === "games" && (
                <div className="p-8">
                  <h2 className="text-3xl font-bold mb-6 gradient-text-animated">All Games</h2>
                  {loadingGames ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-muted-foreground mt-4">Loading games...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {games.map((game) => (
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
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
