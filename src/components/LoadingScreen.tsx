import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const LoadingScreen = ({ onLoadComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onLoadComplete, 200);
          return 100;
        }
        return prev + 8;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [onLoadComplete]);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      {/* Shadow branded logo */}
      <div className="mb-8 animate-fade-in">
        <div className="relative">
          {/* Windows-style square grid */}
          <div className="w-32 h-32 grid grid-cols-2 gap-2 mb-4">
            <div className="bg-primary rounded-sm shadow-lg shadow-primary/50 animate-pulse"></div>
            <div className="bg-secondary rounded-sm shadow-lg shadow-secondary/50 animate-pulse" style={{ animationDelay: "0.1s" }}></div>
            <div className="bg-accent rounded-sm shadow-lg shadow-accent/50 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="bg-blue-500 rounded-sm shadow-lg shadow-blue-500/50 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
          </div>
          {/* Brand name */}
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: "0.2s" }}>
            shadow
          </h1>
        </div>
      </div>

      {/* Loading spinner */}
      <div className="relative w-8 h-8 mb-6">
        <div className="absolute inset-0 border-3 border-foreground/20 rounded-full"></div>
        <div className="absolute inset-0 border-3 border-t-foreground rounded-full animate-spin"></div>
      </div>

      {/* Loading text */}
      <p className="text-foreground/70 text-sm tracking-wide">
        Loading{dots}
      </p>
    </div>
  );
};

export default LoadingScreen;
