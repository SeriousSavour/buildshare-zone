import { useNavigate } from "react-router-dom";
import { Home, Gamepad2, Users, MessageCircle, Wrench, HelpCircle, Monitor } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { StyledText } from "@/components/ui/styled-text";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const siteName = settings?.site_name || "shadow";
  const discordInvite = settings?.discord_invite || "discord.gg/goshadow";

  const quickLinks = [
    { icon: Gamepad2, label: "Games", path: "/games" },
    { icon: Users, label: "Friends", path: "/friends" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: Wrench, label: "Tools", path: "/tools" },
    { icon: HelpCircle, label: "Help", path: "/help" },
  ];

  const background = settings?.login_background || 'radial-gradient(ellipse at center, hsl(220 70% 10%) 0%, hsl(220 70% 5%) 50%, hsl(220 70% 2%) 100%)';

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background }}
    >
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent drop-shadow-2xl">
            <StyledText text={siteName} weirdLetterIndex={0} />
          </h1>
          <p className="text-gray-400 text-sm">{discordInvite}</p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Browser Mode */}
          <button
            onClick={() => navigate("/browser")}
            className="group relative flex flex-col items-center gap-6 p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
          >
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
              <Monitor className="w-10 h-10 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-200 group-hover:text-white transition-colors">
                Browser Mode
              </h2>
              <p className="text-sm text-gray-400">
                Immersive browser experience with tabs and fullscreen
              </p>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/5 transition-all duration-300 pointer-events-none" />
          </button>

          {/* Classic Mode */}
          <div className="relative flex flex-col items-center gap-6 p-8 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center">
              <Home className="w-10 h-10 text-gray-400" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-200">
                Classic Mode
              </h2>
              <p className="text-sm text-gray-400">
                Traditional navigation and interface
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {quickLinks.map((link, index) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="group relative flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                <link.icon className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
              </div>
              <span className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors">
                <StyledText text={link.label} weirdLetterIndex={0} />
              </span>
            </button>
          ))}
        </div>

        {/* Get Started Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => navigate("/games")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
