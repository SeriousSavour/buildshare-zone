import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Particle {
  id: number;
  emoji: string;
  left: number;
  animationDuration: number;
  size: number;
}
import Navigation from "@/components/layout/Navigation";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wrench, Search, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StyledKeyword } from "@/components/ui/styled-text";

interface Tool {
  id: string;
  name: string;
  description: string | null;
  url: string;
  icon: string;
  category: string;
  clicks: number;
}

const Tools = ({ hideNavigation = false }: { hideNavigation?: boolean } = {}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    fetchTools();
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

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('clicks', { ascending: false });

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
      toast.error("Failed to load tools");
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = (toolId: string) => {
    navigate(`/tools/${toolId}`);
  };

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Falling Particles */}
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
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[12%] left-[8%] text-5xl animate-bounce-slow opacity-30">🎃</div>
        <div className="absolute top-[28%] right-[10%] text-4xl animate-bounce-delayed opacity-25">👻</div>
        <div className="absolute top-[18%] right-[85%] text-3xl animate-sway opacity-20">🦇</div>
        <div className="absolute top-[48%] left-[6%] text-4xl animate-sway-delayed opacity-25">💀</div>
        <div className="absolute top-[68%] right-[14%] text-5xl animate-bounce-slow opacity-30">🎃</div>
      </div>
      
      {/* Halloween decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[5%] text-6xl animate-float opacity-20">🎃</div>
        <div className="absolute top-32 right-[8%] text-5xl animate-float-delayed opacity-25">👻</div>
        <div className="absolute top-[20%] left-[15%] text-4xl animate-float opacity-15">🦇</div>
        <div className="absolute bottom-[30%] right-[5%] text-5xl animate-float-delayed opacity-20">🎃</div>
      </div>

      {!hideNavigation && <Navigation />}
      {!hideNavigation && <AnnouncementBanner />}
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="mb-12 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <Wrench className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold tracking-tight">
              <StyledKeyword keyword="Gaming" /> <StyledKeyword keyword="Tools" className="text-primary" />
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Discover helpful gaming websites and resources
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 animate-fade-in-delay-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card border-border"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading tools...</p>
          </div>
        )}

        {/* Tools Grid */}
        {!loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool, index) => (
              <Card 
                key={tool.id}
                className={`group overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] hover:border-primary/50 animate-slide-up stagger-${Math.min(index % 6 + 1, 6)}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-5xl mb-3">{tool.icon}</div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                      {tool.category}
                    </span>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {tool.name}
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full gap-2 hover:scale-105 transition-transform duration-300"
                    onClick={() => handleToolClick(tool.id)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Details
                  </Button>
                  <div className="text-xs text-muted-foreground text-center">
                    {tool.clicks} visits
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredTools.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-2xl font-semibold">No tools found</p>
            <p className="text-muted-foreground">
              Try adjusting your search
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tools;
