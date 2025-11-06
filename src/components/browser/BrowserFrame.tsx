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
  currentUrl = "shadow://home",
  showTabs = true,
  customBackground
}: BrowserFrameProps) => {
  const navigate = useNavigate();
  const [addressBar, setAddressBar] = useState(currentUrl);
  const [tabs] = useState([
    { id: "1", title: "Home", url: "shadow://home" }
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
        <div className="bg-[#0f1419] border-b border-white/5">
          {/* Tab Bar */}
          <div className="flex items-center px-2 py-1 bg-[#0a0e13]">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1f29] border-t border-x border-white/10 rounded-t-lg min-w-[180px]"
              >
                <span className="text-sm truncate text-gray-300">{tab.title}</span>
                <button className="opacity-0 hover:opacity-100 transition-opacity">
                  <X className="h-3 w-3 text-gray-400 hover:text-gray-200" />
                </button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1 hover:bg-white/5 text-gray-400 hover:text-gray-200">
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
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5 text-gray-400 hover:text-gray-200">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
};

export default BrowserFrame;
