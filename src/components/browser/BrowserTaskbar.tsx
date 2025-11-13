import { X, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Tab {
  id: string;
  title: string;
  url: string;
  type: "home" | "games" | "friends" | "chat" | "tools" | "help" | "philosophy" | "game" | "profile" | "settings" | "create";
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
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#0a0f1a] to-[#0d1219] border-t border-white/10 flex items-center px-4 gap-3 z-50 backdrop-blur-xl">
      {/* Start button - Windows style */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-11 px-4 hover:bg-white/10 text-foreground hover:text-primary flex items-center gap-3 rounded-xl transition-all"
        >
          <div className="w-6 h-6 grid grid-cols-2 gap-0.5">
            <div className="bg-primary rounded-sm"></div>
            <div className="bg-secondary rounded-sm"></div>
            <div className="bg-accent rounded-sm"></div>
            <div className="bg-primary/60 rounded-sm"></div>
          </div>
        </Button>

        {/* Separator */}
        <div className="w-px h-9 bg-white/10"></div>
      </div>

      {/* Tab buttons */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`group flex items-center gap-3 px-4 h-10 rounded-xl transition-all min-w-[160px] max-w-[220px] ${
              activeTab === tab.id
                ? 'bg-gradient-to-b from-[#1a2332] to-[#141d2b] text-foreground border border-white/10 shadow-lg'
                : 'bg-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            <span className="text-sm font-medium truncate flex-1">{tab.title}</span>
            {tabs.length > 1 && (
              <X
                className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-xl transition-all"
          onClick={onNewTab}
          title="New tab (Ctrl+T)"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {isAdmin && (
          <>
            <div className="w-px h-9 bg-white/10 mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-4 hover:bg-white/10 text-muted-foreground hover:text-primary flex items-center gap-2 rounded-xl transition-all"
              onClick={() => navigate("/admin")}
              title="Admin Panel"
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Admin</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BrowserTaskbar;
