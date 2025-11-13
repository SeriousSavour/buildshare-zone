import { Home, Gamepad2, Users, MessageCircle, Wrench, HelpCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { StyledText } from "@/components/ui/styled-text";
import { getRandomQuote } from "@/lib/quotes";

interface BrowserQuickLinksProps {
  onNavigate: (path: string, title: string) => void;
}

const BrowserQuickLinks = ({ onNavigate }: BrowserQuickLinksProps) => {
  const { data: settings } = useSiteSettings();

  const siteName = settings?.site_name || "philosopher";
  const tagline = settings?.site_tagline || "Your Gateway to Endless Possibilities";
  const quoteOfTheDay = getRandomQuote(settings?.quote_of_the_day);

  const links = [
    { icon: Home, label: "Home", path: "/", title: "Home" },
    { icon: Gamepad2, label: "Activity", path: "/games", title: "Activity" },
    { icon: Users, label: "Friends", path: "/friends", title: "Friends" },
    { icon: MessageCircle, label: "Chat", path: "/chat", title: "Chat" },
    { icon: Wrench, label: "Tools", path: "/tools", title: "Tools" },
    { icon: HelpCircle, label: "Help", path: "/help", title: "Help" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          <StyledText text={siteName} weirdLetterIndex={0} />
        </h2>
        <p className="text-lg font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {tagline}
        </p>
        <div className="max-w-xl mx-auto mt-3 p-3 rounded-lg bg-card/30 border border-border/30">
          <p className="text-xs italic text-muted-foreground">"{quoteOfTheDay}"</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {links.map((link) => (
          <button
            key={link.path}
            onClick={() => {
              if (link.path === "/games") {
                onNavigate("/games", link.title);
              } else {
                onNavigate(link.path, link.title);
              }
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border/50 hover:bg-card hover:border-primary/50 transition-all group"
          >
            <link.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium">
              <StyledText text={link.label} weirdLetterIndex={0} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BrowserQuickLinks;
