import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, X, Plus, Home, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

interface Tab {
  id: string;
  title: string;
  url: string;
}

const BrowserView = () => {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Home", url: "shadow://home" },
    { id: "2", title: "New Tab", url: "shadow://newtab" }
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [addressBar, setAddressBar] = useState("shadow://home");

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "New Tab",
      url: "shadow://newtab"
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
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Address Bar */}
        <div className="flex-1 relative">
          <Input
            value={addressBar}
            onChange={(e) => setAddressBar(e.target.value)}
            className="w-full bg-muted/50 border-border pr-10"
            placeholder="Enter URL..."
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8">
        <Tabs value={activeTab} className="h-full">
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="h-full m-0">
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Home className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    shadow
                  </h1>
                  <p className="text-muted-foreground text-lg">discord.gg/goshadow</p>
                </div>
                <div className="mt-12 space-y-4 max-w-md">
                  <p className="text-sm text-muted-foreground">
                    This is a browser-style interface. You can add more functionality here.
                  </p>
                  <Button onClick={() => navigate("/")} variant="outline">
                    Return to Main App
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default BrowserView;
