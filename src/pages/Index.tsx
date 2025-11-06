import BrowserFrame from "@/components/browser/BrowserFrame";
import { useState } from "react";
import { Home, Gamepad2, Users, MessageCircle, Wrench, HelpCircle, ArrowLeft, ArrowRight, RotateCw, X, Plus, MoreVertical } from "lucide-react";
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

const Index = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Home", url: "shadow://home", type: "home" }
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [addressBar, setAddressBar] = useState("shadow://home");

  const siteName = settings?.site_name || "shadow";
  const discordInvite = settings?.discord_invite || "discord.gg/goshadow";

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
    if (tabs.length === 1) return;
    
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTab === tabId) {
      const newActiveTab = newTabs[newTabs.length - 1];
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
        return <div className="w-full h-full"><Games onGameClick={openGameInTab} hideNavigation={true} /></div>;
      case "game":
        return activeTabData.gameId ? <GameDetailContent gameId={activeTabData.gameId} /> : null;
      case "friends":
        return <div className="w-full h-full"><Friends hideNavigation={true} /></div>;
      case "chat":
        return <div className="w-full h-full"><Chat hideNavigation={true} /></div>;
      case "tools":
        return <div className="w-full h-full"><Tools hideNavigation={true} /></div>;
      case "help":
        return <div className="w-full h-full"><Help hideNavigation={true} /></div>;
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

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ background }}
    >
      {/* Browser Chrome */}
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
                  className="opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-70"
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

          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5 text-gray-400 hover:text-gray-200">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
