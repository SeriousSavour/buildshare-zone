import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Home, Plus, X, ChevronLeft, ChevronRight, RotateCw, 
  Menu, Settings, Gamepad2, MessageSquare, Code, Maximize, 
  ExternalLink, Search, Globe, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Tab {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIndex: number;
}

const Browser = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", url: "", title: "New Tab", history: [""], historyIndex: 0 }
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [urlInput, setUrlInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scramjetReady, setScramjetReady] = useState(false);
  const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});

  const currentTab = tabs.find(tab => tab.id === activeTab);

  useEffect(() => {
    if (currentTab) {
      setUrlInput(currentTab.url);
    }
  }, [activeTab, currentTab]);

  // Initialize Scramjet
  useEffect(() => {
    const initializeScramjet = async () => {
      try {
        console.log('🚀 Step 1: Loading BareMux...');
        await loadScript('https://unpkg.com/@mercuryworkshop/bare-mux@2.0.5/dist/index.js');
        console.log('✅ BareMux loaded');

        console.log('🚀 Step 2: Loading Epoxy...');
        await loadScript('https://unpkg.com/@mercuryworkshop/epoxy-transport@2.1.9/dist/index.js');
        console.log('✅ Epoxy loaded');
        
        console.log('🚀 Step 3: Loading Scramjet...');
        await loadScript('https://unpkg.com/@mercuryworkshop/scramjet@2.0.0-alpha.9/dist/scramjet.all.js');
        console.log('✅ Scramjet loaded');

        // @ts-ignore - Scramjet globals
        if (!window.$scramjetLoadController) {
          throw new Error('Scramjet controller not available');
        }

        console.log('🚀 Step 4: Initializing Scramjet controller...');
        // @ts-ignore
        const { ScramjetController } = window.$scramjetLoadController();

        const scramjet = new ScramjetController({
          files: {
            wasm: "https://unpkg.com/@mercuryworkshop/scramjet@2.0.0-alpha.9/dist/scramjet.wasm.wasm",
            all: "https://unpkg.com/@mercuryworkshop/scramjet@2.0.0-alpha.9/dist/scramjet.all.js",
            sync: "https://unpkg.com/@mercuryworkshop/scramjet@2.0.0-alpha.9/dist/scramjet.sync.js",
          }
        });

        console.log('🚀 Step 5: Calling scramjet.init()...');
        await scramjet.init();
        console.log('✅ Scramjet controller initialized');

        // Register service worker
        if ('serviceWorker' in navigator) {
          console.log('🚀 Step 6: Registering service worker...');
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });
          console.log('✅ Service Worker registered:', registration);

          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('✅ Service Worker ready');
        }

        // @ts-ignore - BareMux global
        if (!window.BareMux) {
          throw new Error('BareMux not available');
        }

        console.log('🚀 Step 7: Creating BareMux connection...');
        // @ts-ignore
        const connection = new window.BareMux.BareMuxConnection("https://unpkg.com/@mercuryworkshop/bare-mux@2.0.5/dist/worker.js");
        
        console.log('🚀 Step 8: Setting transport...');
        // Use Epoxy transport
        await connection.setTransport("https://unpkg.com/@mercuryworkshop/epoxy-transport@2.1.9/dist/index.mjs", [{ wisp: "wss://wisp.mercurywork.shop/" }]);
        
        console.log('✅ Scramjet fully initialized!');
        setScramjetReady(true);
        
        toast({
          title: "Browser Engine Ready",
          description: "Scramjet proxy is active",
        });
      } catch (error) {
        console.error('❌ Failed to initialize Scramjet:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        toast({
          title: "Initialization Failed",
          description: error instanceof Error ? error.message : "Could not start proxy engine",
          variant: "destructive",
        });
      }
    };

    initializeScramjet();
  }, [toast]);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: "",
      title: "New Tab",
      history: [""],
      historyIndex: 0,
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) {
      toast({
        title: "Cannot close last tab",
        description: "At least one tab must remain open",
      });
      return;
    }
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTab === tabId) {
      setActiveTab(newTabs[0].id);
    }
  };

  const navigateToUrl = async (url: string) => {
    if (!url || !scramjetReady) {
      if (!scramjetReady) {
        toast({
          title: "Please wait",
          description: "Proxy engine is still initializing",
        });
      }
      return;
    }

    console.log('🌐 Navigating to:', url);
    setIsLoading(true);

    // Add protocol if missing
    let fullUrl = url;
    
    // Check if it's a search query
    const isSearchQuery = (url.includes(' ') || (!url.includes('.') && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('shadow://')));
    
    if (isSearchQuery) {
      fullUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      console.log('🔍 Search query detected, redirecting to:', fullUrl);
    } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('shadow://')) {
      fullUrl = 'https://' + url;
    }

    // Handle special shadow:// protocol
    if (fullUrl.startsWith('shadow://')) {
      handleSpecialProtocol(fullUrl);
      setIsLoading(false);
      return;
    }

    try {
      // Encode URL for Scramjet
      const encodedUrl = __scramjet$encodeUrl(fullUrl);
      
      // Update tabs
      setTabs(prevTabs => prevTabs.map(tab => {
        if (tab.id === activeTab) {
          const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), fullUrl];
          return {
            ...tab,
            url: fullUrl,
            title: new URL(fullUrl).hostname,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }
        return tab;
      }));

      // Navigate iframe
      const iframe = iframeRefs.current[activeTab];
      if (iframe) {
        iframe.src = encodedUrl;
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
      toast({
        title: "Navigation Failed",
        description: "Could not load the page",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecialProtocol = (url: string) => {
    const protocol = url.replace('shadow://', '');
    
    switch (protocol) {
      case 'games':
        navigate('/games');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'blank':
        window.open('about:blank', '_blank');
        break;
      default:
        toast({
          title: "Unknown protocol",
          description: `Protocol "${protocol}" is not recognized`,
          variant: "destructive",
        });
    }
  };

  const goBack = () => {
    if (!currentTab || currentTab.historyIndex === 0) return;
    
    const newIndex = currentTab.historyIndex - 1;
    const previousUrl = currentTab.history[newIndex];
    
    setTabs(tabs.map(tab => {
      if (tab.id === activeTab) {
        return {
          ...tab,
          url: previousUrl,
          historyIndex: newIndex
        };
      }
      return tab;
    }));

    const iframe = iframeRefs.current[activeTab];
    if (iframe && previousUrl) {
      iframe.src = __scramjet$encodeUrl(previousUrl);
    }
  };

  const goForward = () => {
    if (!currentTab || currentTab.historyIndex >= currentTab.history.length - 1) return;
    
    const newIndex = currentTab.historyIndex + 1;
    const nextUrl = currentTab.history[newIndex];
    
    setTabs(tabs.map(tab => {
      if (tab.id === activeTab) {
        return {
          ...tab,
          url: nextUrl,
          historyIndex: newIndex
        };
      }
      return tab;
    }));

    const iframe = iframeRefs.current[activeTab];
    if (iframe && nextUrl) {
      iframe.src = __scramjet$encodeUrl(nextUrl);
    }
  };

  const refresh = () => {
    if (currentTab?.url) {
      const iframe = iframeRefs.current[activeTab];
      if (iframe) {
        iframe.src = __scramjet$encodeUrl(currentTab.url);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'new-tab':
        addNewTab();
        break;
      case 'games':
        navigate('/games');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'chat':
        navigate('/chat');
        break;
      case 'fullscreen':
        toggleFullscreen();
        break;
      case 'about-blank':
        window.open('about:blank', '_blank');
        break;
      case 'discord':
        window.open('https://discord.gg/shadow', '_blank');
        break;
      default:
        toast({
          title: "Coming soon",
          description: `${action} feature is under development`,
        });
    }
  };


  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Browser Header */}
      <div className="flex flex-col border-b border-border bg-card/50 backdrop-blur-sm">
        {/* Tab Bar */}
        <div className="flex items-center gap-2 px-2 pt-2">
          <div className="flex-1 flex items-center gap-1">
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                className={`relative group cursor-pointer px-4 py-2 rounded-t-lg rounded-b-none transition-colors ${
                  activeTab === tab.id ? 'bg-background' : 'hover:bg-background/50'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="max-w-[150px] truncate text-sm">{tab.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={addNewTab}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleMenuAction('new-tab')}>
                <Plus className="w-4 h-4 mr-2" />
                New Tab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuAction('games')}>
                <Gamepad2 className="w-4 h-4 mr-2" />
                Games
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuAction('chat')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuAction('settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuAction('devtools')}>
                <Code className="w-4 h-4 mr-2" />
                Devtools
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuAction('fullscreen')}>
                <Maximize className="w-4 h-4 mr-2" />
                Fullscreen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuAction('about-blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                About:Blank
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuAction('discord')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Discord
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Address Bar */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            disabled={!currentTab || currentTab.historyIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goForward}
            disabled={!currentTab || currentTab.historyIndex >= currentTab.history.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateToUrl("")}
          >
            <Home className="w-4 h-4" />
          </Button>

          <div className="flex-1 relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigateToUrl(urlInput);
                }
              }}
              placeholder="Search or enter address..."
              className="pl-10 bg-background"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => navigateToUrl(urlInput)}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Browser Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative overflow-hidden bg-muted/30">
          {tabs.map(tab => (
            <TabsContent 
              key={tab.id} 
              value={tab.id} 
              className="h-full m-0 data-[state=active]:flex flex-col"
            >
            {tab.url ? (
                <div className="relative w-full h-full">
                  {isLoading && activeTab === tab.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Loading {tab.title}...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    ref={(el) => {
                      if (el && activeTab === tab.id) {
                        iframeRefs.current[tab.id] = el;
                      }
                    }}
                    className="w-full h-full border-0"
                    title={tab.title}
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <Shield className="w-24 h-24 text-primary relative" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Shadow Browser
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Secure, Private, Anonymous
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {scramjetReady ? "Powered by Scramjet" : "Initializing proxy engine..."}
                  </p>
                  <div className="flex gap-4 mt-4">
                    <Button onClick={() => navigate('/games')} size="lg" className="gap-2">
                      <Gamepad2 className="w-5 h-5" />
                      Browse Games
                    </Button>
                    <Button 
                      onClick={() => navigateToUrl('google.com')} 
                      variant="outline" 
                      size="lg" 
                      className="gap-2"
                      disabled={!scramjetReady}
                    >
                      <Globe className="w-5 h-5" />
                      Start Browsing
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

// Helper function for encoding URLs (will be available from Scramjet)
function __scramjet$encodeUrl(url: string): string {
  // @ts-ignore
  if (typeof window.__scramjet$encodeUrl === 'function') {
    // @ts-ignore
    return window.__scramjet$encodeUrl(url);
  }
  // Fallback: use service worker scope
  return '/service/' + url;
}

export default Browser;
