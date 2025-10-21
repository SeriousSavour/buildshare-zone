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
        animationDuration: 8 + Math.random() * 8,
        size: 0.8 + Math.random() * 3,
      };
      
      setParticles(prev => [...prev, particle]);

      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== particle.id));
      }, particle.animationDuration * 1000);
    };

    const interval = setInterval(() => {
      generateParticle();
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Falling Particles - Full Page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.left}%`,
              top: '-100px',
              fontSize: `${particle.size}rem`,
              animation: `fall ${particle.animationDuration}s linear forwards`,
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>
      
      {/* Bouncing decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-40">
        <div className="absolute top-[15%] left-[10%] text-5xl animate-bounce-slow opacity-30">🎃</div>
        <div className="absolute top-[30%] right-[8%] text-4xl animate-bounce-delayed opacity-25">👻</div>
        <div className="absolute top-[20%] right-[85%] text-3xl animate-sway opacity-20">🦇</div>
        <div className="absolute top-[50%] left-[5%] text-4xl animate-sway-delayed opacity-25">💀</div>
        <div className="absolute top-[65%] right-[12%] text-5xl animate-bounce-slow opacity-30">🎃</div>
        <div className="absolute top-[40%] left-[88%] text-3xl animate-bounce-delayed opacity-20">🕷️</div>
        <div className="absolute top-[80%] left-[20%] text-4xl animate-sway opacity-25">🍂</div>
      </div>
      
      <Navigation />
      
      {/* Enhanced Announcement Banner */}
      {showAnnouncement && (
        <div className="bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border-b-2 border-primary/30 backdrop-blur-sm relative overflow-hidden">
          {/* Animated background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-float-delayed pointer-events-none" />
          
          <div className="container mx-auto px-4 py-4 relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center animate-bounce-slow glow-orange">
                  <span className="text-3xl">🎃</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/90 bg-clip-text">
                    🎃 Halloween Special Event! 🎃
                  </span>
                  <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-primary/50" />
                  <span className="text-base text-muted-foreground/90">
                    Join the spooky fun with exclusive Halloween games and rewards! 👻
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAnnouncement(false)}
                className="hover:bg-primary/10 hover:text-primary transition-all duration-300 hover-scale rounded-full h-10 w-10 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Halloween Icons */}
      <section className="relative overflow-hidden py-24 px-4">
        {/* Gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none animate-gradient-bg" />
        
        {/* Additional animated background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-secondary/5 rounded-full blur-3xl animate-spin-slow" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Hero Icon with glow */}
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-primary/25 to-accent/25 mb-10 animate-pulse-ring glow-orange">
            <Users className="w-14 h-14 text-primary drop-shadow-lg" />
          </div>

          {/* Hero Title with enhanced gradient */}
          <h1 className="text-7xl md:text-8xl font-bold mb-8 gradient-text-animated text-glow animate-fade-in leading-tight">
            Welcome Home!
          </h1>
          
          {/* Subtitle with better spacing */}
          <p className="text-3xl md:text-4xl font-semibold mb-6 flex items-center justify-center gap-3 animate-fade-in-delay-1">
            <span className="text-4xl animate-bounce-slow">🎮</span>
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Your friendly gǟming community awaits
            </span>
          </p>
          
          {/* Description with improved readability */}
          <p className="text-xl md:text-2xl text-muted-foreground/90 max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in-delay-2">
            Connect with amazing people, discover incredible gǟmes, and create memories that last forever. Join thousands of gǟmers in a safe, welcoming space designed just for you.
          </p>
          
          {/* CTA Buttons with enhanced styling */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-10 animate-fade-in-delay-3">
          {isAuthenticated ? (
              <>
                <Button 
                  size="lg" 
                  className="text-xl px-10 py-7 gap-3 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 hover-lift glow-orange shadow-xl font-semibold"
                  onClick={() => navigate("/games")}
                >
                  <UserPlus className="w-6 h-6" />
                  Browse Games! 🚀
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-xl px-10 py-7 gap-3 hover-lift border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/10 font-semibold"
                  onClick={() => navigate("/friends")}
                >
                  <MessageCircle className="w-6 h-6" />
                  View Friends
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="text-xl px-10 py-7 gap-3 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 hover-lift glow-orange shadow-xl font-semibold"
                  onClick={() => navigate("/register")}
                >
                  <UserPlus className="w-6 h-6" />
                  Join the Fun! 🚀
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-xl px-10 py-7 gap-3 hover-lift border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/10 font-semibold"
                  onClick={() => navigate("/login")}
                >
                  <MessageCircle className="w-6 h-6" />
                  Sign In
                </Button>
              </>
            )}
          </div>

          {/* Trust Badges with enhanced design */}
          <div className="flex flex-wrap justify-center gap-6 text-base animate-fade-in-delay-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 hover:border-primary/50 transition-colors">
              <span className="text-2xl">✨</span>
              <span className="font-medium">Free forever</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 hover:border-primary/50 transition-colors">
              <span className="text-2xl">🛡️</span>
              <span className="font-medium">Safe & moderated</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 hover:border-primary/50 transition-colors">
              <span className="text-2xl">🎯</span>
              <span className="font-medium">No ads or spam</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with enhanced design */}
      <section className="py-24 px-4 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold gradient-text-animated text-glow-purple">
              Why You'll Love It Here
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-3xl mx-auto animate-fade-in-delay-1">
              Everything you need for an amazing gǟming social experience ✨
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="group p-10 rounded-2xl bg-gradient-to-br from-card to-card/80 border-2 border-border/50 hover:border-primary/60 transition-all duration-500 hover:scale-105 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary/40 animate-bounce-in cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="text-6xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">👥</div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Find Your Tribe</h3>
                <p className="text-lg text-muted-foreground/90 leading-relaxed">
                  Discover amazing people who share your gǟming passions. Search by username and build meaningful friendships.
                </p>
              </div>
            </div>
            
            <div className="group p-10 rounded-2xl bg-gradient-to-br from-card to-card/80 border-2 border-border/50 hover:border-accent/60 transition-all duration-500 hover:scale-105 hover:-translate-y-4 hover:shadow-2xl hover:shadow-accent/40 animate-bounce-in stagger-2 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="text-6xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">💬</div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Chat Safely</h3>
                <p className="text-lg text-muted-foreground/90 leading-relaxed">
                  Private conversations with friends, protected by smart content moderation. Express yourself freely and safely.
                </p>
              </div>
            </div>
            
            <div className="group p-10 rounded-2xl bg-gradient-to-br from-card to-card/80 border-2 border-border/50 hover:border-primary/60 transition-all duration-500 hover:scale-105 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary/40 animate-bounce-in stagger-4 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="text-6xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">💝</div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Feel Welcome</h3>
                <p className="text-lg text-muted-foreground/90 leading-relaxed">
                  A warm, inclusive community where everyone belongs. Automatic content filtering keeps conversations positive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
