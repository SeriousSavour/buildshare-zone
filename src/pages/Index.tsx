import { Users, MessageCircle, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Navigation from "@/components/layout/Navigation";

const Index = () => {
  const [showAnnouncement, setShowAnnouncement] = useState(true);

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
        {/* Floating Halloween Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] text-4xl animate-bounce" style={{ animationDelay: '0s' }}>🎃</div>
          <div className="absolute top-40 right-[15%] text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>👻</div>
          <div className="absolute bottom-32 left-[20%] text-3xl animate-bounce" style={{ animationDelay: '1s' }}>🍁</div>
          <div className="absolute bottom-20 right-[25%] text-2xl animate-bounce" style={{ animationDelay: '1.5s' }}>🦇</div>
          <div className="absolute top-60 left-[30%] text-3xl animate-bounce" style={{ animationDelay: '2s' }}>🍂</div>
          <div className="absolute top-80 right-[30%] text-2xl animate-bounce" style={{ animationDelay: '2.5s' }}>🦇</div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Hero Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-8">
            <Users className="w-12 h-12 text-primary" />
          </div>

          {/* Hero Title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
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
            <Button size="lg" className="text-lg px-8 gap-2 bg-primary hover:bg-primary/90">
              <UserPlus className="w-5 h-5" />
              Join the Fun! 🚀
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 gap-2">
              <MessageCircle className="w-5 h-5" />
              Sign In
            </Button>
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
            <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-2xl font-semibold mb-3">Find Your Tribe</h3>
              <p className="text-muted-foreground">
                Discover amazing people who share your gǟming passions. Search by username and build meaningful friendships.
              </p>
            </div>
            
            <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-2xl font-semibold mb-3">Chat Safely</h3>
              <p className="text-muted-foreground">
                Private conversations with friends, protected by smart content moderation. Express yourself freely and safely.
              </p>
            </div>
            
            <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300">
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
