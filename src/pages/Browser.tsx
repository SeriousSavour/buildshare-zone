import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, RotateCw, X, MoreVertical, Maximize2, Minimize2, Shield, GripVertical, Plus, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import BrowserTaskbar from "@/components/browser/BrowserTaskbar";
import AnimatedPhilosopherQuote from "@/components/browser/AnimatedPhilosopherQuote";
import { 
  HomeIcon, 
  ActivityIcon, 
  FriendsIcon, 
  ChatIcon, 
  ToolsIcon, 
  HelpIcon, 
  PhilosophyIcon, 
  ProfileIcon, 
  SettingsIcon, 
  CreateIcon 
} from "@/components/browser/QuickLinkIcons";
import Games from "./Games";
import Friends from "./Friends";
import Chat from "./Chat";
import Tools from "./Tools";
import Help from "./Help";
import Philosophy from "./Philosophy";
import GameDetailContent from "@/components/browser/GameDetailContent";
import ProfileContent from "@/components/browser/ProfileContent";
import SettingsContent from "@/components/browser/SettingsContent";
import CreateContent from "@/components/browser/CreateContent";

interface Tab {
  id: string;
  title: string;
  url: string;
  type: "home" | "games" | "friends" | "chat" | "tools" | "help" | "philosophy" | "game" | "profile" | "settings" | "create";
  gameId?: string;
}

const STORAGE_KEY = 'browser_tabs_session';
const ACTIVE_TAB_KEY = 'browser_active_tab';
const QUICK_LINKS_KEY = 'browser_quick_links_order';

const DEFAULT_QUICK_LINKS = [
  { icon: HomeIcon, label: "Home", type: "home" as const, id: "home" },
  { icon: ActivityIcon, label: "Activity", type: "games" as const, id: "games" },
  { icon: FriendsIcon, label: "Friends", type: "friends" as const, id: "friends" },
  { icon: ChatIcon, label: "Chat", type: "chat" as const, id: "chat" },
  { icon: ToolsIcon, label: "Tools", type: "tools" as const, id: "tools" },
  { icon: HelpIcon, label: "Help", type: "help" as const, id: "help" },
  { icon: PhilosophyIcon, label: "Philosophy", type: "philosophy" as const, id: "philosophy" },
  { icon: ProfileIcon, label: "Profile", type: "profile" as const, id: "profile" },
  { icon: SettingsIcon, label: "Settings", type: "settings" as const, id: "settings" },
  { icon: CreateIcon, label: "Create", type: "create" as const, id: "create" },
];

const Browser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: settings, isLoading } = useSiteSettings();
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  
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
  const [draggedLink, setDraggedLink] = useState<string | null>(null);
  const [isEditingLinks, setIsEditingLinks] = useState(false);

  // Load quick links from localStorage or use defaults
  const [quickLinks, setQuickLinks] = useState(() => {
    try {
      const saved = localStorage.getItem(QUICK_LINKS_KEY);
      console.log("Saved quick links from localStorage:", saved);
      if (saved) {
        const savedOrder = JSON.parse(saved);
        console.log("Parsed saved order:", savedOrder);
        // If empty array, use defaults
        if (!savedOrder || savedOrder.length === 0) {
          console.log("Empty saved order, using DEFAULT_QUICK_LINKS");
          return DEFAULT_QUICK_LINKS;
        }
        // Reconstruct the quick links array with actual icon components
        const reconstructed = savedOrder.map((id: string) => 
          DEFAULT_QUICK_LINKS.find(link => link.id === id)
        ).filter(Boolean);
        console.log("Reconstructed quick links:", reconstructed.length, "items");
        return reconstructed;
      }
    } catch (error) {
      console.error("Failed to load quick links:", error);
    }
    console.log("Using DEFAULT_QUICK_LINKS:", DEFAULT_QUICK_LINKS.length, "items");
    return DEFAULT_QUICK_LINKS;
  });

  const siteName = settings?.site_name || "shadow";
  const philosopherDefinition = "φιλόσοφος (philósophos) - Lover of Wisdom";

  // Save quick links order to localStorage whenever they change
  useEffect(() => {
    try {
      // Only save the IDs, not the entire objects with icon components
      const order = quickLinks.map(link => link.id);
      localStorage.setItem(QUICK_LINKS_KEY, JSON.stringify(order));
    } catch (error) {
      console.error("Failed to save quick links:", error);
    }
  }, [quickLinks]);

  // Check if user is "wild" for admin access
  useEffect(() => {
    const checkUser = async () => {
      const sessionToken = localStorage.getItem("session_token");
      if (!sessionToken) return;

      try {
        const { data: userData } = await supabase.rpc('get_user_by_session', {
          _session_token: sessionToken
        });

        if (userData && userData.length > 0) {
          const user = userData[0].username;
          setUsername(user);
          
          // Check if username is exactly "wild"
          if (user === "wild") {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };

    checkUser();
  }, []);

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

  const handleDragStart = (e: React.DragEvent, linkId: string) => {
    setDraggedLink(linkId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedLink || draggedLink === targetId) return;

    const draggedIndex = quickLinks.findIndex(link => link.id === draggedLink);
    const targetIndex = quickLinks.findIndex(link => link.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newLinks = [...quickLinks];
    const [draggedItem] = newLinks.splice(draggedIndex, 1);
    newLinks.splice(targetIndex, 0, draggedItem);

    setQuickLinks(newLinks);
    setDraggedLink(null);
  };

  const resetQuickLinks = () => {
    setQuickLinks(DEFAULT_QUICK_LINKS);
  };

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
      games: "Activity",
      friends: "Friends",
      chat: "Chat",
      tools: "Tools",
      help: "Help",
      philosophy: "Philosophy",
      game: "Game",
      profile: "Profile",
      settings: "Settings",
      create: "Create"
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
        <div className="w-full max-w-4xl flex items-center justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div className="text-gray-400 text-lg">Loading...</div>
        </div>
      );
    }

    // Wrap content with transition
    const content = (() => {

    switch (activeTabData.type) {
      case "home":
        return (
          <div className="w-full max-w-5xl mx-auto px-8">
            <div className="space-y-12 w-full">
              {/* Site branding - Windows style */}
              <div className="text-center space-y-4 pt-8">
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 grid grid-cols-2 gap-2">
                    <div className="bg-primary rounded-sm"></div>
                    <div className="bg-secondary rounded-sm"></div>
                    <div className="bg-accent rounded-sm"></div>
                    <div className="bg-blue-500 rounded-sm"></div>
                  </div>
                </div>
                <h1 className="text-7xl font-light tracking-wide text-foreground">
                  {siteName}
                </h1>
                <p className="text-muted-foreground text-base tracking-wide italic">{philosopherDefinition}</p>
                
                {/* Animated Philosopher Quote */}
                <AnimatedPhilosopherQuote />
              </div>
              
              {/* Quick links - Windows tiles style */}
              <div className="max-w-4xl mx-auto">
                {/* Edit controls */}
                <div className="flex justify-end gap-2 mb-4">
                  <Button
                    variant={isEditingLinks ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditingLinks(!isEditingLinks)}
                    className="gap-2"
                  >
                    <GripVertical className="w-4 h-4" />
                    {isEditingLinks ? "Done" : "Rearrange Links"}
                  </Button>
                  {isEditingLinks && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetQuickLinks}
                    >
                      Reset to Default
                    </Button>
                  )}
                </div>

                {/* First 9 links in 3x3 grid */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {(() => {
                    console.log("Rendering quick links. Total links:", quickLinks.length);
                    console.log("First 9 links:", quickLinks.slice(0, 9));
                    return quickLinks.slice(0, 9).map((link) => {
                      console.log("Rendering link:", link.id, "Icon type:", typeof link.icon);
                      const IconComponent = link.icon;
                      return (
                      <button
                        key={link.id}
                        onClick={() => !isEditingLinks && navigateToContent(link.type)}
                        draggable={isEditingLinks}
                        onDragStart={(e) => handleDragStart(e, link.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, link.id)}
                        className={`group relative flex flex-col items-center justify-center gap-4 p-8 rounded-sm bg-card border border-border transition-all duration-200 ${
                          isEditingLinks 
                            ? 'cursor-move hover:border-primary hover:scale-105' 
                            : 'cursor-pointer hover:bg-card/80 hover:border-primary/50'
                        } ${draggedLink === link.id ? 'opacity-50' : ''}`}
                      >
                        {isEditingLinks && (
                          <div className="absolute top-2 right-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <IconComponent className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        <span className="text-base font-normal text-foreground tracking-wide">
                          {link.label}
                        </span>
                      </button>
                      );
                    });
                  })()}
                </div>
                
                {/* Create button centered */}
                {quickLinks[9] && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => !isEditingLinks && navigateToContent(quickLinks[9].type)}
                      draggable={isEditingLinks}
                      onDragStart={(e) => handleDragStart(e, quickLinks[9].id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, quickLinks[9].id)}
                      className={`group relative flex flex-col items-center justify-center gap-4 p-8 rounded-sm bg-primary/10 border-2 border-primary transition-all duration-200 w-64 ${
                        isEditingLinks 
                          ? 'cursor-move hover:scale-105' 
                          : 'cursor-pointer hover:bg-primary/20'
                      } ${draggedLink === quickLinks[9].id ? 'opacity-50' : ''}`}
                    >
                      {isEditingLinks && (
                        <div className="absolute top-2 right-2">
                          <GripVertical className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      {(() => {
                        const CreateIcon = quickLinks[9].icon;
                        return <CreateIcon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-200" />;
                      })()}
                      <span className="text-base font-semibold text-primary tracking-wide">
                        {quickLinks[9].label}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* DMCA Takedown Section with Painted Arrow */}
              <div className="relative mt-16 max-w-4xl mx-auto">
                {/* Hand-drawn painted arrow pointing to DMCA button */}
                <svg 
                  className="absolute -top-24 right-20 w-32 h-32 text-primary animate-pulse" 
                  viewBox="0 0 100 100" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(var(--primary), 0.5))' }}
                >
                  {/* Painted brush stroke arrow */}
                  <path 
                    d="M 20 10 Q 30 15, 35 25 Q 40 35, 42 45 Q 43 55, 45 65 Q 48 75, 55 82 L 60 87 L 55 85 L 50 80 M 60 87 L 58 80 L 63 83" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ 
                      paintOrder: 'stroke',
                      filter: 'url(#roughen)'
                    }}
                  />
                  {/* Add texture filter for painted look */}
                  <defs>
                    <filter id="roughen">
                      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise"/>
                      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
                    </filter>
                  </defs>
                </svg>

                <div className="p-8 rounded-lg bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-2 border-destructive/30 animate-fade-in hover:border-destructive/50 transition-all duration-300">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-destructive mb-2">
                        📋 DMCA Takedown Notice
                      </h3>
                      <p className="text-muted-foreground">
                        Report copyright infringement or submit a DMCA takedown request. 
                        We take intellectual property rights seriously and will respond promptly.
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      variant="destructive"
                      className="px-8 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200 shadow-lg animate-pulse"
                      onClick={() => {
                        navigateToContent("help");
                        setTimeout(() => {
                          const dmcaSection = document.getElementById('dmca-section');
                          dmcaSection?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                    >
                      Submit DMCA Request
                    </Button>
                  </div>
                </div>
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
      case "philosophy":
        return <Philosophy />;
      case "profile":
        return <ProfileContent />;
      case "settings":
        return <SettingsContent />;
      case "create":
        return <CreateContent />;
      default:
        return null;
    }
    })();

    return (
      <div 
        key={activeTab}
        className="animate-in fade-in-0 slide-in-from-right-4 duration-500 ease-out w-full h-full"
      >
        {content}
      </div>
    );
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
                  if (activeTab !== tab.id) {
                    setActiveTab(tab.id);
                    setAddressBar(tab.url);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 border-t border-x rounded-t-lg min-w-[180px] cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
                  activeTab === tab.id 
                    ? 'bg-[#1a1f29] border-white/10 shadow-lg' 
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

            {/* Profile Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 hover:bg-white/5 text-gray-400 hover:text-gray-200 flex items-center gap-2"
              onClick={() => navigateToContent("profile")}
              title="Profile"
            >
              <User className="h-4 w-4" />
              <span className="text-xs">Profile</span>
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 hover:bg-white/5 text-gray-400 hover:text-gray-200 flex items-center gap-2"
              onClick={() => navigateToContent("settings")}
              title="Settings"
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="text-xs">Settings</span>
            </Button>

            {/* Admin Panel Button (only for "wild" user) */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 hover:bg-white/5 text-gray-400 hover:text-gray-200 flex items-center gap-2"
                onClick={() => navigate("/admin")}
                title="Admin Panel"
              >
                <Shield className="h-4 w-4" />
                <span className="text-xs">Admin</span>
              </Button>
            )}

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
      <div className={`flex-1 overflow-auto transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-40' 
          : activeTabData?.type === 'home' 
            ? 'flex items-center justify-center p-8' 
            : ''
      } ${!isFullscreen ? 'pb-12' : ''}`}>
        {renderContent()}
      </div>

      {/* Taskbar */}
      {!isFullscreen && (
        <BrowserTaskbar
          tabs={tabs}
          activeTab={activeTab}
          onTabSelect={(tabId) => {
            if (activeTab !== tabId) {
              setActiveTab(tabId);
              const tab = tabs.find(t => t.id === tabId);
              if (tab) setAddressBar(tab.url);
            }
          }}
          onTabClose={(tabId) => {
            const mockEvent = { stopPropagation: () => {} } as React.MouseEvent;
            closeTab(tabId, mockEvent);
          }}
          onNewTab={addNewTab}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default Browser;
