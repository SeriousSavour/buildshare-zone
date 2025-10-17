import { useState, useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import { ProxyTest } from "@/components/ProxyTest";

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
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 gradient-text">Settings</h1>
        
        <div className="space-y-6">
          <ProxyTest />
        </div>
      </div>
    </div>
  );
};

export default Settings;
