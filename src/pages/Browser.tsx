import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Gamepad2, Users, MessageCircle, Wrench, HelpCircle, ArrowLeft, ArrowRight, RotateCw, X, Plus, MoreVertical, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { StyledText } from "@/components/ui/styled-text";
import Games from "./Games";
import Friends from "./Friends";
import Chat from "./Chat";
import Tools from "./Tools";
import Help from "./Help";
import GameDetailContent from "@/components/browser/GameDetailContent";

interface Tab {
  id: string;
  title: string;
  url: string;
  type: "home" | "games" | "friends" | "chat" | "tools" | "help" | "game";
  gameId?: string;
}

const STORAGE_KEY = 'browser_tabs_session';
const ACTIVE_TAB_KEY = 'browser_active_tab';

const Browser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: settings, isLoading } = useSiteSettings();

  // Redirect to index if user didn't come from mode selection
  useEffect(() => {
    if (!location.state?.fromIndex) {
      navigate("/", { replace: true });
    }
  }, [location.state, navigate]);
  
  // Load tabs from localStorage or use default
  const [tabs, setTabs] = useState<Tab[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : [{ id: "1", title: "Home", url: "shadow://home", type: "home" }];
      }
    } catch (error) {
      console.error("Failed to load saved tabs:", error);
    }
    return [{ id: "1", title: "Home", url: "shadow://home", type: "home" }];
  });
  
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_TAB_KEY);
      if (saved && tabs.find(t => t.id === saved)) {
        return saved;
      }
    } catch (error) {
      console.error("Failed to load active tab:", error);
    }
    return tabs[0]?.id || "1";
  });
  
  const [addressBar, setAddressBar] = useState(() => {
    const activeTabData = tabs.find(t => t.id === activeTab);
    return activeTabData?.url || "shadow://home";
  });
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  const siteName = settings?.site_name || "shadow";
  const discordInvite = settings?.discord_invite || "discord.gg/goshadow";

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch (error) {
      console.error("Failed to save tabs:", error);
    }
  }, [tabs]);

  // Save active tab whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    } catch (error) {
      console.error("Failed to save active tab:", error);
    }
  }, [activeTab]);

  // Handle ESC key to exit fullscreen and keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
      // Ctrl+W or Cmd+W to close current tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (tabs.length > 1) {
          const currentTab = tabs.find(t => t.id === activeTab);
          if (currentTab) {
            const mockEvent = { stopPropagation: () => {} } as React.MouseEvent;
            closeTab(currentTab.id, mockEvent);
          }
        }
      }
      // Ctrl+T or Cmd+T to open new tab
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        addNewTab();
      }
      // Ctrl+Tab to switch to next tab
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(t => t.id === activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        const nextTab = tabs[nextIndex];
        setActiveTab(nextTab.id);
        setAddressBar(nextTab.url);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, tabs, activeTab]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const quickLinks = [
    { icon: Home, label: "Home", type: "home" as const },
    { icon: Gamepad2, label: "Games", type: "games" as const },
    { icon: Users, label: "Friends", type: "friends" as const },
    { icon: MessageCircle, label: "Chat", type: "chat" as const },
    { icon: Wrench, label: "Tools", type: "tools" as const },
    { icon: HelpCircle, label: "Help", type: "help" as const },
  ];

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
    
    // Don't allow closing the last tab
    if (tabs.length === 1) {
      return;
    }
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    // If closing the active tab, switch to another tab
    if (activeTab === tabId) {
      // Try to activate the tab to the right, or the one to the left if at the end
      const newActiveIndex = tabIndex >= newTabs.length ? newTabs.length - 1 : tabIndex;
      const newActiveTab = newTabs[newActiveIndex];
      setActiveTab(newActiveTab.id);
      setAddressBar(newActiveTab.url);
    }
  };

  const navigateToContent = (type: Tab["type"]) => {
    const titles: Record<Tab["type"], string> = {
      home: "Home",
      games: "Games",
      friends: "Friends", 
      chat: "Chat",
      tools: "Tools",
      help: "Help",
      game: "Game"
    };

    const activeTabData = tabs.find(t => t.id === activeTab);
    if (activeTabData) {
      const updatedTabs = tabs.map(t => 
        t.id === activeTab 
          ? { ...t, title: titles[type], url: `shadow://${type}`, type }
          : t
      );
      setTabs(updatedTabs);
      setAddressBar(`shadow://${type}`);
    }
  };

  const renderContent = () => {
    const activeTabData = tabs.find(t => t.id === activeTab);
    if (!activeTabData) return null;

    // Show loading state while settings are loading for home page
    if (activeTabData.type === "home" && isLoading) {
      return (
        <div className="w-full max-w-4xl flex items-center justify-center">
          <div className="text-gray-400 text-lg">Loading...</div>
        </div>
      );
    }

    switch (activeTabData.type) {
      case "home":
        return (
          <div className="w-full max-w-4xl">
            <div className="space-y-8 w-full">
              <div className="text-center space-y-3">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent drop-shadow-2xl">
                  <StyledText text={siteName} weirdLetterIndex={0} />
                </h1>
                <p className="text-gray-400 text-sm">{discordInvite}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                {quickLinks.map((link, index) => (
                  <button
                    key={link.type}
                    onClick={() => navigateToContent(link.type)}
                    className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                      <link.icon className="w-7 h-7 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                    </div>
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                      <StyledText text={link.label} weirdLetterIndex={0} />
                    </span>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/5 transition-all duration-300 pointer-events-none" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case "games":
        return <Games onGameClick={openGameInTab} hideNavigation={true} />;
      case "game":
        return activeTabData.gameId ? <GameDetailContent gameId={activeTabData.gameId} isFullscreen={isFullscreen} /> : null;
      case "friends":
        return <Friends hideNavigation={true} />;
      case "chat":
        return <Chat hideNavigation={true} />;
      case "tools":
        return <Tools hideNavigation={true} />;
      case "help":
        return <Help hideNavigation={true} />;
      default:
        return null;
    }
  };

  const openGameInTab = (gameId: string, gameTitle: string) => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: gameTitle,
      url: `shadow://game/${gameId}`,
      type: "game",
      gameId: gameId
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
    setAddressBar(newTab.url);
  };

  const background = settings?.login_background || 'radial-gradient(ellipse at center, hsl(220 70% 10%) 0%, hsl(220 70% 5%) 50%, hsl(220 70% 2%) 100%)';

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div 
      className="min-h-screen flex flex-col relative"
      style={{ background }}
    >
      {/* Browser Chrome */}
      {!isFullscreen && (
        <div className="bg-[#0f1419] border-b border-white/5">
          {/* Tab Bar */}
          <div className="flex items-center px-2 py-1 bg-[#0a0e13]">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setAddressBar(tab.url);
                }}
                className={`flex items-center gap-2 px-4 py-2 border-t border-x rounded-t-lg min-w-[180px] cursor-pointer transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-[#1a1f29] border-white/10' 
                    : 'bg-[#0f1419] border-white/5 hover:bg-[#1a1f29]/50'
                }`}
              >
                <span className="text-sm truncate text-gray-300">{tab.title}</span>
                {tabs.length > 1 && (
                  <button 
                    onClick={(e) => closeTab(tab.id, e)}
                    className="ml-auto opacity-70 hover:opacity-100 transition-opacity hover:bg-white/10 rounded p-0.5"
                  >
                    <X className="h-3 w-3 text-gray-400 hover:text-gray-200" />
                  </button>
                )}
              </div>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 ml-1 hover:bg-white/5 text-gray-400 hover:text-gray-200"
              onClick={addNewTab}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Bar */}
          <div className="px-3 py-2 flex items-center gap-2 bg-[#0f1419]">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5 text-gray-400 hover:text-gray-200">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5 text-gray-400 hover:text-gray-200">
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5 text-gray-400 hover:text-gray-200">
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Address Bar */}
            <div className="flex-1 relative">
              <Input
                value={addressBar}
                onChange={(e) => setAddressBar(e.target.value)}
                className="w-full bg-[#1a1f29] border-white/10 pr-10 text-gray-300 placeholder:text-gray-500 focus:border-white/20"
                placeholder="Enter URL..."
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-white/5 text-gray-400 hover:text-gray-200"
                onClick={() => navigateToContent("home")}
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-white/5 text-gray-400 hover:text-gray-200"
              onClick={toggleFullscreen}
              title="Enter fullscreen (ESC to exit)"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5 text-gray-400 hover:text-gray-200">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen Exit Button - Floating */}
      {isFullscreen && (
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 right-4 z-50 h-10 px-4 bg-black/80 hover:bg-black/90 text-white border border-white/20 backdrop-blur-sm"
          onClick={toggleFullscreen}
        >
          <Minimize2 className="h-4 w-4 mr-2" />
          Exit Fullscreen (ESC)
        </Button>
      )}

      {/* Content Area */}
      <div className={`flex-1 overflow-auto ${
        isFullscreen 
          ? 'fixed inset-0 z-40' 
          : activeTabData?.type === 'home' 
            ? 'flex items-center justify-center p-8' 
            : ''
      }`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default Browser;
