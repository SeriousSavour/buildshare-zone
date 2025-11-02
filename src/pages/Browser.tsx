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
  content?: string;
}

const Browser = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", url: "", title: "New Tab", history: [""], historyIndex: 0, content: "" }
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [urlInput, setUrlInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentTab = tabs.find(tab => tab.id === activeTab);

  useEffect(() => {
    if (currentTab) {
      setUrlInput(currentTab.url);
    }
  }, [activeTab, currentTab]);

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: "",
      title: "New Tab",
      history: [""],
      historyIndex: 0,
      content: ""
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

    console.log('🚀 Navigate called with URL:', url);
    setIsLoading(true);
    setLoadError(null);

    // Add protocol if missing
    let fullUrl = url;
    
    // Check if it's a search query (contains spaces or no dots and not a special protocol)
    const isSearchQuery = (url.includes(' ') || (!url.includes('.') && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('shadow://')));
    
    if (isSearchQuery) {
      // Redirect to Google search
      fullUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      console.log('🔍 Detected search query, redirecting to:', fullUrl);
    } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('shadow://')) {
      fullUrl = 'https://' + url;
    }

    console.log('🌐 Full URL after protocol check:', fullUrl);

    // Handle special shadow:// protocol
    if (fullUrl.startsWith('shadow://')) {
      handleSpecialProtocol(fullUrl);
      setIsLoading(false);
      return;
    }

    // Fetch HTML content via proxy and inject with srcDoc
    try {
      const proxyUrl = getProxyUrl(fullUrl);
      console.log('🔗 Generated proxy URL:', proxyUrl);
      console.log('🔑 Worker URL from env:', import.meta.env.VITE_PROXY_WORKER_URL);
      
      let response = await fetch(proxyUrl);
      console.log('📡 Fetch response status:', response.status);
      console.log('📄 Fetch response Content-Type:', response.headers.get('content-type'));
      console.log('🔍 Using proxy:', proxyUrl.includes('workers.dev') ? 'CLOUDFLARE' : 'SUPABASE');
      
      // If Cloudflare Worker is rate-limited or failed, fallback to Supabase
      if (response.status === 429 || !response.ok) {
        const errorText = await response.text();
        console.log('⚠️ Primary proxy failed:', errorText);
        console.log('🔄 Falling back to Supabase proxy...');
        
        const supabaseUrl = 'https://ptmeykacgbrsmvcvwrpp.supabase.co';
        const fallbackUrl = `${supabaseUrl}/functions/v1/proxy?url=${encodeURIComponent(fullUrl)}`;
        console.log('🔗 Fallback URL:', fallbackUrl);
        
        response = await fetch(fallbackUrl);
        console.log('📡 Fallback response status:', response.status);
        
        if (!response.ok) {
          const fallbackError = await response.text();
          console.error('❌ Fallback also failed:', fallbackError);
          throw new Error(`Both proxies failed. Primary: ${response.status}, Fallback error: ${fallbackError.substring(0, 100)}`);
        }
        
        console.log('✅ Loaded via Supabase fallback');
      }
      
      const html = await response.text();
      console.log('📝 Received HTML length:', html.length);
      console.log('🔍 HTML starts with:', html.substring(0, 100));
      
      // Check if images are in the HTML
      const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["']/gi);
      console.log('🖼️ Found', imgMatches?.length || 0, 'image tags');
      if (imgMatches) {
        console.log('🖼️ First image src:', imgMatches[0]);
      }
      
      // Check if base tag exists
      const hasBase = html.includes('<base');
      const hasCSPMeta = html.includes('Content-Security-Policy');
      console.log('🏠 Has base tag:', hasBase);
      console.log('🔒 Has CSP meta tag:', hasCSPMeta);
      console.log('🔍 First 800 chars of HTML:', html.substring(0, 800));
      console.log('📦 Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      // Clear any previous errors
      setLoadError(null);
      
      // Update tabs with new content
      setTabs(prevTabs => {
        const newTabs = prevTabs.map(tab => {
          if (tab.id === activeTab) {
            const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), fullUrl];
            console.log('✏️ Updating tab:', tab.id, 'with', html.length, 'bytes of content');
            return {
              ...tab,
              url: fullUrl,
              title: new URL(fullUrl).hostname,
              history: newHistory,
              historyIndex: newHistory.length - 1,
              content: html
            };
          }
          return tab;
        });
        console.log('📋 New tabs state:', newTabs.find(t => t.id === activeTab));
        return newTabs;
      });
      
      setIsLoading(false);
      console.log('✅ Navigation complete');
    } catch (error) {
      console.error('Failed to load:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load website');
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
    
    setTabs(tabs.map(tab => {
      if (tab.id === activeTab) {
        const newIndex = tab.historyIndex - 1;
        return {
          ...tab,
          url: tab.history[newIndex],
          historyIndex: newIndex
        };
      }
      return tab;
    }));
  };

  const goForward = () => {
    if (!currentTab || currentTab.historyIndex >= currentTab.history.length - 1) return;
    
    setTabs(tabs.map(tab => {
      if (tab.id === activeTab) {
        const newIndex = tab.historyIndex + 1;
        return {
          ...tab,
          url: tab.history[newIndex],
          historyIndex: newIndex
        };
      }
      return tab;
    }));
  };

  const refresh = () => {
    if (currentTab?.url) {
      navigateToUrl(currentTab.url);
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

  const getProxyUrl = (targetUrl: string) => {
    if (!targetUrl || targetUrl.startsWith('shadow://')) {
      console.warn('⚠️ Invalid target URL for proxy:', targetUrl);
      return '';
    }
    
    // Always use Supabase relay - this hides the actual proxy backend completely
    const supabaseUrl = 'https://ptmeykacgbrsmvcvwrpp.supabase.co';
    const proxyUrl = `${supabaseUrl}/functions/v1/browser-proxy?url=${encodeURIComponent(targetUrl)}`;
    console.log('🔒 Using secure relay proxy (backend hidden)');
    return proxyUrl;
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
                {loadError && activeTab === tab.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                    <div className="max-w-md p-6 rounded-lg border border-destructive bg-destructive/10">
                      <h3 className="text-lg font-semibold text-destructive mb-2">Failed to Load</h3>
                      <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
                      <Button onClick={() => navigateToUrl(tab.url)} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
                {tab.content && !loadError && (
                  <iframe
                    key={`iframe-${tab.id}-${tab.historyIndex}`}
                    ref={activeTab === tab.id ? iframeRef : null}
                    src={URL.createObjectURL(new Blob([tab.content], { type: 'text/html' }))}
                    title={tab.title}
                    className="w-full h-full border-none"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
                    referrerPolicy="no-referrer"
                    onLoad={() => {
                      console.log('🎯 Iframe loaded successfully for tab:', tab.id);
                      setIsLoading(false);
                    }}
                    onError={(e) => {
                      console.error('❌ Iframe error:', e);
                      setIsLoading(false);
                      setLoadError('Failed to load website');
                    }}
                  />
                )}
                {!tab.content && !loadError && !isLoading && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No content loaded</p>
                  </div>
                )}
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
                  <div className="flex gap-4 mt-4">
                    <Button onClick={() => navigate('/games')} size="lg" className="gap-2">
                      <Gamepad2 className="w-5 h-5" />
                      Browse Games
                    </Button>
                    <Button onClick={() => navigateToUrl('google.com')} variant="outline" size="lg" className="gap-2">
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
