import { Users, MessageCircle, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";

interface Particle {
  id: number;
  emoji: string;
  left: number;
  animationDuration: number;
  size: number;
}

const Index = () => {
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const sessionToken = localStorage.getItem("session_token");
    setIsAuthenticated(!!sessionToken);
  }, []);

  useEffect(() => {
    const emojis = ['🎃', '👻', '🍁', '🦇', '🍂', '💀', '🕷️', '🌙'];
    let particleId = 0;

    const generateParticle = () => {
      const particle: Particle = {
        id: particleId++,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        left: Math.random() * 100,
        animationDuration: 3 + Math.random() * 4,
        size: 1.5 + Math.random() * 2,
      };
      
      setParticles(prev => [...prev, particle]);

      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== particle.id));
      }, particle.animationDuration * 1000);
    };

    const interval = setInterval(() => {
      generateParticle();
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Announcement Banner */}
      {showAnnouncement && (
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-2xl">🎃</span>
                <span className="font-medium">Site being shut down for a while</span>
                <span className="text-muted-foreground">See you sometime in 2030</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAnnouncement(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Halloween Icons */}
      <section className="relative overflow-hidden py-20 px-4">
        {/* Falling Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute animate-fall"
              style={{
                left: `${particle.left}%`,
                top: '-50px',
                fontSize: `${particle.size}rem`,
                animation: `fall ${particle.animationDuration}s linear forwards`,
              }}
            >
              {particle.emoji}
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Hero Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-8 animate-pulse">
            <Users className="w-12 h-12 text-primary" />
          </div>

          {/* Hero Title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent animate-fade-in">
            Welcome Home!
          </h1>
          
          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-muted-foreground mb-4 flex items-center justify-center gap-2">
            <span>🎮</span>
            <span>Your friendly gǟming community awaits</span>
          </p>
          
          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with amazing people, discover incredible gǟmes, and create memories that last forever. Join thousands of gǟmers in a safe, welcoming space designed just for you.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            {isAuthenticated ? (
              <>
                <Button 
                  size="lg" 
                  className="text-lg px-8 gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/games")}
                >
                  <UserPlus className="w-5 h-5" />
                  Browse Games! 🚀
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 gap-2"
                  onClick={() => navigate("/friends")}
                >
                  <MessageCircle className="w-5 h-5" />
                  View Friends
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="text-lg px-8 gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/register")}
                >
                  <UserPlus className="w-5 h-5" />
                  Join the Fun! 🚀
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 gap-2"
                  onClick={() => navigate("/login")}
                >
                  <MessageCircle className="w-5 h-5" />
                  Sign In
                </Button>
              </>
            )}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>✨</span>
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-1">
              <span>•</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🛡️</span>
              <span>Safe & moderated</span>
            </div>
            <div className="flex items-center gap-1">
              <span>•</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🎯</span>
              <span>No ads or spam</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Why You'll Love It Here
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            Everything you need for an amazing gǟming social experience
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 animate-fade-in">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-2xl font-semibold mb-3">Find Your Tribe</h3>
              <p className="text-muted-foreground">
                Discover amazing people who share your gǟming passions. Search by username and build meaningful friendships.
              </p>
            </div>
            
            <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 animate-fade-in-delay-1">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-2xl font-semibold mb-3">Chat Safely</h3>
              <p className="text-muted-foreground">
                Private conversations with friends, protected by smart content moderation. Express yourself freely and safely.
              </p>
            </div>
            
            <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 animate-fade-in-delay-2">
              <div className="text-4xl mb-4">💝</div>
              <h3 className="text-2xl font-semibold mb-3">Feel Welcome</h3>
              <p className="text-muted-foreground">
                A warm, inclusive community where everyone belongs. Automatic content filtering keeps conversations positive.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
