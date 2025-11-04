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

const ENGINE_ORIGIN = window.location.origin;
const ENGINE_PREFIX = '/sengine/scramjet/';

function normalizeUserInput(input: string): string {
  let s = input.trim();
  const isSearch = s.includes(' ') ||
    (!/^https?:\/\//i.test(s) && !s.includes('.'));

  if (isSearch) {
    return `https://www.google.com/search?q=${encodeURIComponent(s)}`;
  }
  if (!/^https?:\/\//i.test(s)) {
    s = 'https://' + s;
  }
  return s;
}

function toEngineUrl(targetUrl: string): string {
  // IMPORTANT: full target URL must be percent-encoded
  return `${ENGINE_ORIGIN}${ENGINE_PREFIX}${encodeURIComponent(targetUrl)}`;
}

function wrapIfNotEngine(raw: string) {
  if (!raw) return raw;
  const want = `${ENGINE_ORIGIN}${ENGINE_PREFIX}`;
  return raw.startsWith(want) ? raw : `${want}${encodeURIComponent(raw)}`;
}

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
  const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});

  const currentTab = tabs.find(tab => tab.id === activeTab);

  useEffect(() => {
    if (currentTab) {
      // Show the decoded original URL in the address bar, not the engine URL
      const displayUrl = currentTab.history[currentTab.historyIndex] || "";
      setUrlInput(displayUrl);
    }
  }, [activeTab, currentTab]);

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
    if (!url) return;
    setIsLoading(true);

    let fullUrl = url.trim();
    
    if (fullUrl.startsWith("shadow://")) {
      handleSpecialProtocol(fullUrl);
      setIsLoading(false);
      return;
    }

    // normalize/search handling
    const isSearch = fullUrl.includes(" ") || (!/^https?:\/\//i.test(fullUrl) && !fullUrl.includes("."));
    fullUrl = isSearch 
      ? `https://www.google.com/search?q=${encodeURIComponent(fullUrl)}`
      : /^https?:\/\//i.test(fullUrl) ? fullUrl : `https://${fullUrl}`;

    const engineUrl = toEngineUrl(fullUrl);

    setTabs(prev =>
      prev.map(tab => {
        if (tab.id !== activeTab) return tab;
        const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), fullUrl];
        return {
          ...tab,
          url: engineUrl,             // iframe sees ENGINE url
          title: new URL(fullUrl).hostname,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      })
    );
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
    const fullUrl = currentTab.history[newIndex];
    const engineUrl = toEngineUrl(fullUrl);
    
    setTabs(tabs.map(tab => {
      if (tab.id === activeTab) {
        return {
          ...tab,
          url: engineUrl,
          historyIndex: newIndex
        };
      }
      return tab;
    }));
  };

  const goForward = () => {
    if (!currentTab || currentTab.historyIndex >= currentTab.history.length - 1) return;
    
    const newIndex = currentTab.historyIndex + 1;
    const fullUrl = currentTab.history[newIndex];
    const engineUrl = toEngineUrl(fullUrl);
    
    setTabs(tabs.map(tab => {
      if (tab.id === activeTab) {
        return {
          ...tab,
          url: engineUrl,
          historyIndex: newIndex
        };
      }
      return tab;
    }));
  };

  const refresh = () => {
    if (currentTab?.url) {
      setIsLoading(true);
      const iframe = iframeRefs.current[activeTab];
      if (iframe) {
        iframe.src = iframe.src; // Force reload
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
                      if (!el) return;
                      iframeRefs.current[tab.id] = el;

                      // 1) Keep engine prefix on every nav the iframe tries to make
                      const keepWrapped = () => {
                        try {
                          const cur = el.src || "";
                          const fixed = wrapIfNotEngine(cur);
                          if (fixed !== cur) {
                            el.src = fixed;
                          }
                        } catch {
                          // cross-origin read may throw; just ignore
                        }
                      };

                      // Guard on initial set
                      keepWrapped();

                      // 2) Watch for src mutations (redirects, JS navs, link clicks, etc.)
                      const mo = new MutationObserver(() => keepWrapped());
                      mo.observe(el, { attributes: true, attributeFilter: ["src"] });

                      // 3) After each load, run the guard again (some sites rewrite location)
                      const onLoad = () => {
                        setIsLoading(false);
                        keepWrapped();
                      };
                      el.addEventListener("load", onLoad);

                      // Clean up when tab unmounts
                      el.addEventListener("error", () => setIsLoading(false));

                      return () => {
                        el.removeEventListener("load", onLoad);
                        mo.disconnect();
                      };
                    }}
                    src={wrapIfNotEngine(tab.url)}
                    className="w-full h-full border-0"
                    title={tab.title}
                    referrerPolicy="no-referrer"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-popups allow-modals"
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
                    Powered by Scramjet
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

export default Browser;
