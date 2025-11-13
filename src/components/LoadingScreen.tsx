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
          setTimeout(onLoadComplete, 800);
          return 100;
        }
        return prev + 3;
      });
    }, 40);

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
      {/* Windows-style logo */}
      <div className="mb-12 animate-fade-in">
        <div className="w-24 h-24 grid grid-cols-2 gap-2">
          <div className="bg-primary rounded-sm shadow-lg shadow-primary/50"></div>
          <div className="bg-secondary rounded-sm shadow-lg shadow-secondary/50"></div>
          <div className="bg-accent rounded-sm shadow-lg shadow-accent/50"></div>
          <div className="bg-blue-500 rounded-sm shadow-lg shadow-blue-500/50"></div>
        </div>
      </div>

      {/* Loading spinner */}
      <div className="relative w-10 h-10 mb-8">
        <div className="absolute inset-0 border-4 border-foreground/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-foreground rounded-full animate-spin"></div>
      </div>

      {/* Loading text */}
      <p className="text-foreground/70 text-sm tracking-wide">
        Loading{dots}
      </p>
    </div>
  );
};

export default LoadingScreen;
