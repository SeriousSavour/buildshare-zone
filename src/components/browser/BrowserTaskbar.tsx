import { X, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Tab {
  id: string;
  title: string;
  url: string;
  type: "home" | "games" | "friends" | "chat" | "tools" | "help" | "game";
  gameId?: string;
}

interface BrowserTaskbarProps {
  tabs: Tab[];
  activeTab: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
  isAdmin: boolean;
}

const BrowserTaskbar = ({ 
  tabs, 
  activeTab, 
  onTabSelect, 
  onTabClose, 
  onNewTab,
  isAdmin 
}: BrowserTaskbarProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-[#0f1419] border-t border-white/5 flex items-center px-2 gap-1 z-50">
      {/* Start button - Windows style */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 px-3 hover:bg-white/5 text-gray-300 hover:text-white flex items-center gap-2"
        >
          <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
            <div className="bg-primary rounded-[1px]"></div>
            <div className="bg-secondary rounded-[1px]"></div>
            <div className="bg-accent rounded-[1px]"></div>
            <div className="bg-blue-500 rounded-[1px]"></div>
          </div>
        </Button>

        {/* Separator */}
        <div className="w-px h-8 bg-white/10"></div>
      </div>

      {/* Tab buttons */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`group flex items-center gap-2 px-3 h-9 rounded transition-colors min-w-[140px] max-w-[200px] ${
              activeTab === tab.id
                ? 'bg-[#1a1f29] text-white border border-white/10'
                : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <span className="text-sm truncate flex-1">{tab.title}</span>
            {tabs.length > 1 && (
              <X
                className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 hover:bg-white/5 text-gray-400 hover:text-gray-200"
          onClick={onNewTab}
          title="New tab (Ctrl+T)"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {isAdmin && (
          <>
            <div className="w-px h-8 bg-white/10 mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 hover:bg-white/5 text-gray-400 hover:text-gray-200 flex items-center gap-2"
              onClick={() => navigate("/admin")}
              title="Admin Panel"
            >
              <Shield className="h-4 w-4" />
              <span className="text-xs">Admin</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BrowserTaskbar;
