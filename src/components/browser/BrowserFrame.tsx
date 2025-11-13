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
        <div className="bg-[#0a0d12] border-b border-blue-500/20 backdrop-blur-xl shadow-lg shadow-blue-500/10">
          {/* Tab Bar */}
          <div className="flex items-center px-4 py-3 bg-gradient-to-b from-[#0d1117] to-[#0a0d12]">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="relative flex items-center gap-3 px-6 py-3.5 bg-[#0d1117] border-t border-x border-blue-500/30 rounded-t-xl min-w-[220px] shadow-xl shadow-blue-500/20 group hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 rounded-t-xl shadow-[inset_0_0_20px_rgba(59,130,246,0.3)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative text-sm font-medium truncate text-blue-100/90 group-hover:text-blue-50 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">{tab.title}</span>
                <button className="relative opacity-0 group-hover:opacity-100 transition-all duration-200 hover:rotate-90">
                  <X className="h-3.5 w-3.5 text-blue-300/60 hover:text-blue-100 drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
                </button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 ml-3 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-90 border border-transparent hover:border-blue-500/30 shadow-lg hover:shadow-blue-500/30">
              <Plus className="h-4 w-4 transition-transform duration-300 drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
            </Button>
          </div>

          {/* Navigation Bar */}
          <div className="px-5 py-4 flex items-center gap-4 bg-[#0a0d12]">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 border border-transparent hover:border-blue-500/30 hover:-translate-x-0.5 shadow-sm hover:shadow-blue-500/30">
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
              </Button>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 border border-transparent hover:border-blue-500/30 hover:translate-x-0.5 shadow-sm hover:shadow-blue-500/30">
                <ArrowRight className="h-4 w-4 transition-transform duration-300 drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
              </Button>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 active:rotate-180 border border-transparent hover:border-blue-500/30 shadow-sm hover:shadow-blue-500/30">
                <RotateCw className="h-4 w-4 transition-transform duration-300 hover:rotate-180 drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
              </Button>
            </div>

            {/* Address Bar */}
            <div className="flex-1 relative">
              <Input
                value={addressBar}
                onChange={(e) => setAddressBar(e.target.value)}
                className="w-full h-11 bg-[#0d1117] border-blue-500/30 rounded-xl px-5 pr-14 text-blue-100/90 placeholder:text-blue-300/30 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 focus:shadow-xl focus:shadow-blue-500/20 transition-all duration-300 font-mono text-sm shadow-inner shadow-blue-500/5"
                placeholder="Enter URL..."
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 shadow-sm hover:shadow-blue-500/30"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4 transition-transform duration-300 hover:scale-110 drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 hover:rotate-90 border border-transparent hover:border-blue-500/30 shadow-sm hover:shadow-blue-500/30">
              <MoreVertical className="h-4 w-4 transition-transform duration-300 drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
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
