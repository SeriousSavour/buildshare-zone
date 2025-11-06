import { useNavigate } from "react-router-dom";
import { Home, Gamepad2, Users, MessageCircle, Wrench, HelpCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { StyledText } from "@/components/ui/styled-text";

const QuickLinks = () => {
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const siteName = settings?.site_name || "shadow";
  const discordInvite = settings?.discord_invite || "discord.gg/goshadow";

  const links = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Gamepad2, label: "Games", path: "/games" },
    { icon: Users, label: "Friends", path: "/friends" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: Wrench, label: "Tools", path: "/tools" },
    { icon: HelpCircle, label: "Help", path: "/help" },
  ];

  return (
    <div className="space-y-8 w-full">
      <div className="text-center space-y-3">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent drop-shadow-2xl">
          <StyledText text={siteName} weirdLetterIndex={0} />
        </h1>
        <p className="text-gray-400 text-sm">{discordInvite}</p>
      </div>
      
      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
        {links.map((link, index) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
              <link.icon className="w-7 h-7 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
            </div>
            <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
              <StyledText text={link.label} weirdLetterIndex={0} />
            </span>
            
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/5 transition-all duration-300 pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickLinks;
