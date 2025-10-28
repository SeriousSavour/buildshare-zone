import { useState, useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Particle {
  id: number;
  emoji: string;
  left: number;
  animationDuration: number;
  size: number;
}

const BugReport = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Placeholder for now
    toast({
      title: "Bug report submitted",
      description: "Thank you for your report! We'll look into it.",
    });
    
    setTitle("");
    setDescription("");
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background relative">
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

      <Navigation />
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Bug className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold gradient-text">Bug Report</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Report a Bug</CardTitle>
            <CardDescription>
              Found a bug? Let us know so we can fix it!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Bug Title
                </label>
                <Input
                  id="title"
                  placeholder="Brief description of the bug"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the bug, steps to reproduce, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="min-h-[150px]"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email (optional)
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <Button type="submit" className="w-full">
                Submit Bug Report
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BugReport;
