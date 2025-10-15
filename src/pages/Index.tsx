import { Sparkles, Gamepad2, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const sessionToken = localStorage.getItem("session_token");
    setIsLoggedIn(!!sessionToken);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Navigation Bar */}
      <nav className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold text-primary">
              Learning Hub
            </Link>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <Link to="/games">
                  <Button>Go to Games</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        {/* Floating Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Sparkles className="absolute top-20 left-[10%] w-8 h-8 text-primary/30 animate-float" />
          <Gamepad2 className="absolute top-40 right-[15%] w-12 h-12 text-primary/20 animate-float-delayed" />
          <Users className="absolute bottom-32 left-[20%] w-10 h-10 text-primary/25 animate-float" />
          <MessageCircle className="absolute bottom-20 right-[25%] w-8 h-8 text-primary/30 animate-float-delayed" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent animate-fade-in">
            Welcome Home!
          </h1>
          
          <p className="text-2xl md:text-3xl text-muted-foreground mb-4 animate-fade-in-delay-1">
            Your Ultimate Gaming Hub
          </p>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-delay-2">
            Connect with friends, discover amazing games, and join a vibrant community of gamers. 
            Your adventure starts here.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3">
            {isLoggedIn ? (
              <>
                <Link to="/games">
                  <Button size="lg" className="text-lg px-8 w-full sm:w-auto">
                    Browse Games
                  </Button>
                </Link>
                <Link to="/friends">
                  <Button size="lg" variant="outline" className="text-lg px-8 w-full sm:w-auto">
                    Find Friends
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="text-lg px-8 w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 w-full sm:w-auto">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground animate-fade-in-delay-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>10K+ Active Players</span>
            </div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-primary" />
              <span>500+ Games</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span>Real-time Chat</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why You'll Love It Here
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <Gamepad2 className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Epic Games</h3>
              <p className="text-muted-foreground">
                Discover and play hundreds of exciting games, from action-packed adventures to puzzle challenges.
              </p>
            </div>
            
            <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Connect Friends</h3>
              <p className="text-muted-foreground">
                Build your gaming network, team up with friends, and compete together in epic battles.
              </p>
            </div>
            
            <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <MessageCircle className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Live Chat</h3>
              <p className="text-muted-foreground">
                Stay connected with real-time messaging, share strategies, and celebrate victories together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-20">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Learning Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
