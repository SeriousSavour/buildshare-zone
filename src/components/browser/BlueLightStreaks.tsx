import { useEffect, useRef } from 'react';

const BlueLightStreaks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Streak class
    class Streak {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      opacity: number;
      width: number;
      color: string;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.length = Math.random() * 200 + 100;
        this.speed = Math.random() * 2 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.opacity = Math.random() * 0.3 + 0.1;
        this.width = Math.random() * 2 + 1;
        
        // Blue color variations
        const blueShades = [
          'rgba(59, 130, 246, ',  // blue-500
          'rgba(96, 165, 250, ',  // blue-400
          'rgba(147, 197, 253, ', // blue-300
          'rgba(34, 211, 238, ',  // cyan-400
        ];
        this.color = blueShades[Math.floor(Math.random() * blueShades.length)];
      }

      update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Reset if out of bounds
        if (this.x < -200 || this.x > canvas.width + 200 || 
            this.y < -200 || this.y > canvas.height + 200) {
          this.reset();
        }
      }

      draw() {
        if (!ctx) return;

        const endX = this.x - Math.cos(this.angle) * this.length;
        const endY = this.y - Math.sin(this.angle) * this.length;

        // Create gradient for the streak
        const gradient = ctx.createLinearGradient(this.x, this.y, endX, endY);
        gradient.addColorStop(0, this.color + this.opacity + ')');
        gradient.addColorStop(0.5, this.color + (this.opacity * 0.5) + ')');
        gradient.addColorStop(1, this.color + '0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Add glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color + this.opacity + ')';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Create streaks
    const streaks: Streak[] = [];
    for (let i = 0; i < 30; i++) {
      streaks.push(new Streak());
    }

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 13, 18, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      streaks.forEach(streak => {
        streak.update();
        streak.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default BlueLightStreaks;
