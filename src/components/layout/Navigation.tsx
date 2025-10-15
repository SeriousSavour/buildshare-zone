import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Gamepad2, Users, MessageCircle, Settings, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    try {
      const { data: userData } = await supabase.rpc("get_user_by_session", {
        _session_token: sessionToken,
      });

      if (userData && userData.length > 0) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData[0].user_id)
          .single();

        setIsAdmin(roleData?.role === "admin");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("session_token");
    navigate("/login");
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/games", icon: Gamepad2, label: "Games" },
    { path: "/friends", icon: Users, label: "Friends" },
    { path: "/chat", icon: MessageCircle, label: "Chat" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  if (isAdmin) {
    navItems.push({ path: "/admin", icon: Shield, label: "Admin" });
  }

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-primary">
              Learning Hub
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
