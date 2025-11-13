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
        <div className="bg-[#0a0d12] border-b border-blue-500/20 backdrop-blur-xl shadow-lg shadow-blue-500/5">
          {/* Tab Bar */}
          <div className="flex items-center px-3 py-1.5 bg-gradient-to-b from-[#0d1117] to-[#0a0d12]">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="relative flex items-center gap-3 px-5 py-2.5 bg-[#0d1117] border-t border-x border-blue-500/20 rounded-t-lg min-w-[200px] shadow-lg group hover:border-blue-500/40 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative text-sm font-medium truncate text-blue-100/90 group-hover:text-blue-50">{tab.title}</span>
                <button className="relative opacity-0 group-hover:opacity-100 transition-all duration-200 hover:rotate-90">
                  <X className="h-3 w-3 text-blue-300/60 hover:text-blue-100" />
                </button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-md transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-90 border border-transparent hover:border-blue-500/20">
              <Plus className="h-4 w-4 transition-transform duration-300" />
            </Button>
          </div>

          {/* Navigation Bar */}
          <div className="px-4 py-2.5 flex items-center gap-3 bg-[#0a0d12]">
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-md transition-all duration-300 hover:scale-110 active:scale-90 border border-transparent hover:border-blue-500/20 hover:-translate-x-0.5">
                <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-md transition-all duration-300 hover:scale-110 active:scale-90 border border-transparent hover:border-blue-500/20 hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-md transition-all duration-300 hover:scale-110 active:scale-90 active:rotate-180 border border-transparent hover:border-blue-500/20">
                <RotateCw className="h-3.5 w-3.5 transition-transform duration-300 hover:rotate-180" />
              </Button>
            </div>

            {/* Address Bar */}
            <div className="flex-1 relative">
              <Input
                value={addressBar}
                onChange={(e) => setAddressBar(e.target.value)}
                className="w-full h-9 bg-[#0d1117] border-blue-500/20 rounded-lg px-4 pr-12 text-blue-100/90 placeholder:text-blue-300/30 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 font-mono text-sm"
                placeholder="Enter URL..."
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-md transition-all duration-300 hover:scale-110 active:scale-90"
                onClick={() => navigate("/")}
              >
                <Home className="h-3.5 w-3.5 transition-transform duration-300 hover:scale-110" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-500/10 text-blue-300/60 hover:text-blue-100 rounded-md transition-all duration-300 hover:scale-110 active:scale-90 hover:rotate-90 border border-transparent hover:border-blue-500/20">
              <MoreVertical className="h-3.5 w-3.5 transition-transform duration-300" />
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
