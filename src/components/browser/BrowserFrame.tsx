import { ArrowLeft, ArrowRight, RotateCw, Home, MoreVertical, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface BrowserFrameProps {
  children: React.ReactNode;
  currentUrl?: string;
  showTabs?: boolean;
  customBackground?: string;
}

const BrowserFrame = ({ 
  children, 
  currentUrl = "philosopher://home",
  showTabs = true,
  customBackground
}: BrowserFrameProps) => {
  const navigate = useNavigate();
  const [addressBar, setAddressBar] = useState(currentUrl);
  const [tabs] = useState([
    { id: "1", title: "Home", url: "philosopher://home" }
  ]);
  
  const { data: settings } = useSiteSettings();
  const background = customBackground || settings?.login_background || 'radial-gradient(ellipse at center, hsl(220 70% 10%) 0%, hsl(220 70% 5%) 50%, hsl(220 70% 2%) 100%)';

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ background }}
    >
      {/* Browser Chrome */}
      {showTabs && (
        <div className="bg-[#0a0f1a] border-b border-white/10 backdrop-blur-xl">
          {/* Tab Bar */}
          <div className="flex items-center px-4 py-2.5 bg-gradient-to-b from-[#0d1219] to-[#0a0f1a]">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="flex items-center gap-3 px-5 py-3 bg-gradient-to-b from-[#1a2332] to-[#141d2b] border border-white/10 rounded-t-xl min-w-[200px] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-in slide-in-from-bottom-3 fade-in-0"
              >
                <span className="text-sm font-medium truncate text-foreground transition-colors duration-200">{tab.title}</span>
                <button className="opacity-0 hover:opacity-100 transition-all duration-200 hover:rotate-90">
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors duration-200" />
                </button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 ml-2 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-90">
              <Plus className="h-4 w-4 transition-transform duration-300" />
            </Button>
          </div>

          {/* Navigation Bar */}
          <div className="px-5 py-3.5 flex items-center gap-3 bg-[#0a0f1a]">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 hover:-translate-x-0.5">
                <ArrowLeft className="h-4 w-4 transition-transform duration-300" />
              </Button>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4 transition-transform duration-300" />
              </Button>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 active:rotate-180">
                <RotateCw className="h-4 w-4 transition-transform duration-300 hover:rotate-180" />
              </Button>
            </div>

            {/* Address Bar */}
            <div className="flex-1 relative">
              <Input
                value={addressBar}
                onChange={(e) => setAddressBar(e.target.value)}
                className="w-full h-10 bg-[#141d2b] border-white/10 rounded-xl px-4 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:shadow-lg focus:shadow-primary/10 transition-all duration-300"
                placeholder="Enter URL..."
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-300 hover:scale-110 active:scale-90"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 hover:rotate-90">
              <MoreVertical className="h-4 w-4 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-10 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </div>
  );
};

export default BrowserFrame;
