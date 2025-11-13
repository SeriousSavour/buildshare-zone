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
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0d12] via-[#0d1117] to-[#0a0d12] border-t border-blue-500/20 flex items-center px-3 gap-2 z-50 backdrop-blur-xl shadow-[0_-4px_20px_rgba(59,130,246,0.1)]">
      {/* Start button - Windows style */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 hover:bg-blue-500/10 text-blue-100/90 hover:text-blue-50 flex items-center gap-2 rounded-md transition-all duration-300 hover:scale-105 active:scale-95 border border-transparent hover:border-blue-500/20 shadow-sm hover:shadow-blue-500/20"
        >
          <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
            <div className="bg-primary rounded-[2px] shadow-sm shadow-primary/50"></div>
            <div className="bg-secondary rounded-[2px] shadow-sm shadow-secondary/50"></div>
            <div className="bg-accent rounded-[2px] shadow-sm shadow-accent/50"></div>
            <div className="bg-primary/60 rounded-[2px] shadow-sm shadow-primary/30"></div>
          </div>
        </Button>

        {/* Separator */}
        <div className="w-px h-7 bg-blue-500/20"></div>
      </div>

      {/* Tab buttons */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`group flex items-center gap-2 px-3 h-9 rounded-md transition-all duration-300 ease-out min-w-[140px] max-w-[200px] hover:scale-[1.02] active:scale-95 border ${
              activeTab === tab.id
                ? 'bg-[#0d1117] text-blue-50 border-blue-500/40 shadow-lg shadow-blue-500/10 animate-in fade-in-0 slide-in-from-bottom-2'
                : 'bg-transparent text-blue-300/70 hover:bg-blue-500/5 hover:text-blue-100 border-transparent hover:border-blue-500/20'
            }`}
          >
            <span className="text-xs font-medium truncate flex-1 transition-colors duration-200">{tab.title}</span>
            {tabs.length > 1 && (
              <X
                className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:rotate-90 hover:text-destructive"
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
          className="h-9 w-9 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-md transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-90 border border-transparent hover:border-blue-500/20"
          onClick={onNewTab}
          title="New tab (Ctrl+T)"
        >
          <Plus className="h-3.5 w-3.5 transition-transform duration-300" />
        </Button>

        {isAdmin && (
          <>
            <div className="w-px h-7 bg-blue-500/20 mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 hover:bg-blue-500/10 text-blue-300/60 hover:text-primary flex items-center gap-2 rounded-md transition-all duration-300 hover:scale-105 active:scale-95 border border-transparent hover:border-blue-500/20"
              onClick={() => navigate("/admin")}
              title="Admin Panel"
            >
              <Shield className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12" />
              <span className="text-xs font-medium transition-colors duration-200">Admin</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BrowserTaskbar;
