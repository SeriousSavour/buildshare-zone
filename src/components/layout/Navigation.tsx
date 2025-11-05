import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Gamepad2, Users, MessageCircle, Search, Wrench, Plus, LogIn, User, Shield, MoreHorizontal, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const sessionToken = localStorage.getItem("session_token");
    setIsAuthenticated(!!sessionToken);

    if (sessionToken) {
      try {
        const { data: userData, error: userError } = await supabase.rpc('get_user_by_session', {
          _session_token: sessionToken
        });

        console.log('User data:', userData);
        console.log('User error:', userError);

        if (userData && userData.length > 0) {
          const userId = userData[0].user_id;
          const username = userData[0].username;
          console.log('Logged in as:', username, 'ID:', userId);

          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId);

          console.log('Role data:', roleData);
          console.log('Role error:', roleError);

          const isAdminUser = roleData?.some(r => r.role === 'admin') || false;
          console.log('Is admin:', isAdminUser);
          setIsAdmin(isAdminUser);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("session_token");
    sessionStorage.removeItem("session_token");
    localStorage.removeItem("auth_initialized");
    setIsAuthenticated(false);
    navigate("/");
  };
  return <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Gamepad2 className="w-8 h-8" />
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search the vault..." className="pl-10 bg-muted/50 border-border focus:border-primary/50" />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-foreground">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link to="/games" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-foreground">
              <Gamepad2 className="w-4 h-4" />
              <span>g𐌀mes</span>
            </Link>
            <Link to="/tools" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-foreground">
              <Wrench className="w-4 h-4" />
              <span>Tools</span>
            </Link>
            <Link to="/friends" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-foreground">
              <Users className="w-4 h-4" />
              <span>Friends</span>
            </Link>
            <Link to="/chat" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-foreground">
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-foreground">
                <MoreHorizontal className="w-4 h-4" />
                <span>Extra</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate("/browser")}>
                  <Globe className="w-4 h-4 mr-2" />
                  Browser View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/help")}>
                  Help & Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? <>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate("/admin")}
                    title="Admin Panel"
                    aria-label="Admin Panel"
                  >
                    <Shield className="w-5 h-5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} title="Profile">
                  <User className="w-5 h-5" />
                </Button>
                <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => navigate("/create")}>
                  <Plus className="w-4 h-4" />
                  Create
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Sign Out
                </Button>
              </> : <>
                <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => navigate("/register")}>
                  <Plus className="w-4 h-4" />
                  Create
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => navigate("/login")}>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </>}
          </div>
        </div>
      </div>
    </nav>;
};
export default Navigation;