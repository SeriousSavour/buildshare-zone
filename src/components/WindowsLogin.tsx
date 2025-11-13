import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, User } from "lucide-react";
import scenery1 from "@/assets/scenery-1.jpg";
import scenery2 from "@/assets/scenery-2.jpg";
import scenery3 from "@/assets/scenery-3.jpg";

const sceneryImages = [scenery1, scenery2, scenery3];

interface WindowsLoginProps {
  onLoginComplete: () => void;
}

const WindowsLogin = ({ onLoginComplete }: WindowsLoginProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % sceneryImages.length);
    }, 5000);

    return () => clearInterval(imageInterval);
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        onLoginComplete();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created! Please check your email.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onLoginComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Rotating scenery backgrounds */}
      {sceneryImages.map((image, index) => (
        <div
          key={index}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${image})`,
            opacity: currentImageIndex === index ? 1 : 0,
          }}
        />
      ))}
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>

      {/* Login card */}
      <div className="relative w-full max-w-md p-8 space-y-6 animate-fade-in">
        {/* User icon */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 rounded-full bg-card border-4 border-primary/20 flex items-center justify-center shadow-xl">
            <User className="w-16 h-16 text-muted-foreground" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Sign in to continue" : "Sign up to get started"}
          </p>
        </div>

        {/* Email input */}
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-card border-border"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
        </div>

        {/* Password input */}
        <div className="space-y-2 relative">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-card border-border pr-12"
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <Button
          onClick={handleAuth}
          disabled={loading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
        </Button>

        {/* Toggle mode */}
        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={loading}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Skip button */}
        <div className="text-center pt-4 border-t border-border">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={loading}
          >
            Continue as guest →
          </button>
        </div>
      </div>
    </div>
  );
};

export default WindowsLogin;
