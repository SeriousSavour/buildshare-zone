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
        <div className="bg-card border-b border-border">
          {/* Tab Bar */}
          <div className="flex items-center px-2 py-1 bg-muted/30">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="flex items-center gap-2 px-4 py-2 bg-background border-t border-x border-border rounded-t-lg min-w-[180px]"
              >
                <span className="text-sm truncate">{tab.title}</span>
                <button className="opacity-0 hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Bar */}
          <div className="px-3 py-2 flex items-center gap-2 bg-background">
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
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
