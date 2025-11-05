import { useState, useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import { ChristmasThemeToggle } from "@/components/theme/ChristmasThemeToggle";

interface Particle {
  id: number;
  emoji: string;
  left: number;
  animationDuration: number;
  size: number;
}

const Settings = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const emojis = ['❄️', '🎄', '🎁', '⛄', '🔔', '✨', '🌟', '🎅'];
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
      <AnnouncementBanner />
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 gradient-text">Settings</h1>
        
        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="glass-card p-6 rounded-lg border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Username</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-background/50 border border-white/10 rounded-lg text-foreground" 
                  placeholder="Your username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 bg-background/50 border border-white/10 rounded-lg text-foreground" 
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="glass-card p-6 rounded-lg border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Appearance</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Theme</label>
                <select className="w-full px-4 py-2 bg-background/50 border border-white/10 rounded-lg text-foreground">
                  <option>Dark Mode</option>
                  <option>Light Mode</option>
                  <option>System</option>
                </select>
              </div>
              
              <ChristmasThemeToggle />
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="glass-card p-6 rounded-lg border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Privacy</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">Show online status</span>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">Allow friend requests</span>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </label>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-card p-6 rounded-lg border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Notifications</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">Email notifications</span>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">Push notifications</span>
                <input type="checkbox" className="w-5 h-5" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
