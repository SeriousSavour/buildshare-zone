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

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: settings } = useSiteSettings();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    console.log("Registration attempt for username:", username);

    try {
      console.log("Checking if username exists...");
      const { data: exists, error: checkError } = await supabase.rpc("check_username_exists", {
        _username: username,
      });

      console.log("check_username_exists response:", { exists, checkError });

      if (exists) {
        toast.error("Username already taken");
        setIsLoading(false);
        return;
      }

      console.log("Hashing password...");
      const { data: passwordHash, error: hashError } = await supabase.rpc("hash_password", {
        _password: password,
      });

      console.log("hash_password response:", { passwordHash, hashError });

      if (hashError || !passwordHash) {
        console.error("Password hashing failed:", hashError);
        toast.error("Failed to process password");
        setIsLoading(false);
        return;
      }

      console.log("Creating user account...");
      const { data: userId, error: createError } = await supabase
        .from("user_auth")
        .insert({ username, password_hash: passwordHash })
        .select("id")
        .single();

      console.log("User creation response:", { userId, createError });

      if (createError || !userId) {
        console.error("User creation failed:", createError);
        toast.error("Failed to create account");
        setIsLoading(false);
        return;
      }

      console.log("Creating user profile...");
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId.id,
        username,
        display_name: username,
      });

      console.log("Profile creation response:", { profileError });

      toast.success("Account created successfully!");
      console.log("Registration successful! Redirecting to login...");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BrowserFrame 
      currentUrl="shadow://register" 
      showTabs={true}
      customBackground={settings?.login_background}
    >
      <div className="w-full max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Register Card */}
          <Card className="w-full bg-card/95 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-center">Create Account</CardTitle>
              <CardDescription className="text-center">
                Join our community and start your journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
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
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
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
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Register"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Already have an account?</span>{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Login here
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

export default Register;
