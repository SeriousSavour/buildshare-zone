import { useState } from "react";
import { Search, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Tab {
  id: string;
  title: string;
  url: string;
}

const Shadow = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "New Tab", url: "" }
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      let url = searchValue;
      let title = searchValue;
      
      if (searchValue.includes('.') || searchValue.startsWith('http')) {
        url = searchValue.startsWith('http') ? searchValue : `https://${searchValue}`;
        title = new URL(url).hostname;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(searchValue)}`;
        title = `Search: ${searchValue}`;
      }

      setTabs(tabs.map(tab => 
        tab.id === activeTab ? { ...tab, title, url } : tab
      ));
      setSearchValue("");
    }
  };

  const addNewTab = () => {
    const newId = String(Date.now());
    setTabs([...tabs, { id: newId, title: "New Tab", url: "" }]);
    setActiveTab(newId);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTab === tabId) {
      setActiveTab(newTabs[0].id);
    }
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
      {/* Tab Bar */}
      <div className="bg-[#0d1221] border-b border-[#1a2332] px-2 pt-2">
        <div className="flex items-center gap-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="bg-transparent h-auto p-0 gap-1 justify-start">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative bg-[#1a2332] data-[state=active]:bg-[#0a0e1a] text-gray-400 data-[state=active]:text-white rounded-t-lg rounded-b-none border-t border-x border-[#2a3342] data-[state=active]:border-[#6b9aff] px-4 py-2 min-w-[150px] max-w-[200px] group"
                >
                  <span className="truncate text-sm">{tab.title}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => closeTab(tab.id, e)}
                      className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-[#2a3342] rounded p-0.5 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={addNewTab}
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1a2332]"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {!currentTab?.url ? (
          <div className="w-full max-w-2xl mx-auto text-center space-y-8">
            {/* Shadow Title */}
            <h1 className="text-7xl md:text-8xl font-bold text-[#6b9aff] drop-shadow-[0_0_30px_rgba(107,154,255,0.5)] mb-12">
              Shadow
            </h1>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search or enter a URL"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full h-14 bg-[#0d1221] border-[#1a2332] text-white placeholder:text-gray-500 rounded-lg pl-4 pr-12 focus:border-[#6b9aff] focus:ring-[#6b9aff]"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b9aff] hover:text-[#8ab0ff] transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* App Icon Button */}
            <div className="flex justify-center pt-4">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-xl bg-[#4a7fff] hover:bg-[#6b9aff] transition-all duration-300"
              >
                <div className="w-6 h-6 grid grid-cols-2 gap-1">
                  <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                  <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                  <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                  <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            src={currentTab.url}
            className="w-full h-full border-0"
            title={currentTab.title}
          />
        )}
      </div>
    </div>
  );
};

export default Shadow;
