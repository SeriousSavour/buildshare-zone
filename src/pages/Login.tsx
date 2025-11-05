import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import BrowserFrame from "@/components/browser/BrowserFrame";
import QuickLinks from "@/components/browser/QuickLinks";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: settings } = useSiteSettings();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Login attempt for username:", username);

    try {
      console.log("Calling validate_user_login RPC...");
      const { data: userId, error } = await supabase.rpc("validate_user_login", {
        _username: username,
        _password: password,
      });

      console.log("validate_user_login response:", { userId, error });

      if (error || !userId) {
        console.error("Login validation failed:", error);
        toast.error("Invalid username or password");
        setIsLoading(false);
        return;
      }

      console.log("Creating session for user:", userId);
      const { data: sessionToken, error: sessionError } = await supabase.rpc(
        "create_secure_user_session",
        { _user_id: userId }
      );

      console.log("create_secure_user_session response:", { sessionToken, sessionError });

      if (sessionError || !sessionToken) {
        console.error("Session creation failed:", sessionError);
        toast.error("Failed to create session");
        setIsLoading(false);
        return;
      }

      // Store session token
      console.log("Storing session token...");
      localStorage.setItem("session_token", sessionToken);
      sessionStorage.setItem("session_token", sessionToken);
      localStorage.setItem("auth_initialized", "true");
      
      console.log("Login successful! Navigating to games...");
      toast.success("Welcome back!");
      
      // Navigate without reload to avoid race conditions
      navigate("/games", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BrowserFrame 
      currentUrl="shadow://login" 
      showTabs={true}
      customBackground={settings?.login_background}
    >
      <div className="w-full max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Login Card */}
          <Card className="w-full bg-card/95 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account?</span>{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links Section */}
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                {settings?.site_name || "shadow"}
              </h2>
              <p className="text-muted-foreground">{settings?.discord_invite || "discord.gg/goshadow"}</p>
            </div>
            <QuickLinks />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};

export default Login;
