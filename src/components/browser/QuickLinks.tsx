import { useNavigate } from "react-router-dom";
import { Home, Gamepad2, Users, MessageCircle, Wrench, HelpCircle } from "lucide-react";

const QuickLinks = () => {
  const navigate = useNavigate();

  const links = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Gamepad2, label: "Games", path: "/games" },
    { icon: Users, label: "Friends", path: "/friends" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: Wrench, label: "Tools", path: "/tools" },
    { icon: HelpCircle, label: "Help", path: "/help" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
      {links.map((link) => (
        <button
          key={link.path}
          onClick={() => navigate(link.path)}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border/50 hover:bg-card hover:border-primary/50 transition-all group"
        >
          <link.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-sm font-medium">{link.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickLinks;
