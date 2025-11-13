import { useEffect, useState, useRef } from "react";

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const LoadingScreen = ({ onLoadComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const hasCompleted = useRef(false);

  useEffect(() => {
    console.log("LoadingScreen mounted");
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (!hasCompleted.current) {
            hasCompleted.current = true;
            console.log("Loading complete, calling callback");
            setTimeout(() => {
              console.log("Executing onLoadComplete");
              onLoadComplete();
            }, 100);
          }
          return 100;
        }
        return prev + 10;
      });
    }, 20);

    return () => {
      console.log("LoadingScreen unmounting");
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      {/* Shadow branded logo */}
      <div className="mb-8">
        <div className="relative">
          {/* Windows-style square grid */}
          <div className="w-32 h-32 grid grid-cols-2 gap-2 mb-4">
            <div className="bg-primary rounded-sm"></div>
            <div className="bg-secondary rounded-sm"></div>
            <div className="bg-accent rounded-sm"></div>
            <div className="bg-blue-500 rounded-sm"></div>
          </div>
          {/* Brand name */}
          <h1 className="text-3xl font-bold text-center text-foreground">
            shadow
          </h1>
        </div>
      </div>

      {/* Loading spinner */}
      <div className="relative w-8 h-8 mb-6">
        <div className="absolute inset-0 border-3 border-foreground/20 rounded-full"></div>
        <div className="absolute inset-0 border-3 border-t-foreground rounded-full animate-spin"></div>
      </div>

      {/* Progress indicator */}
      <p className="text-foreground/70 text-sm tracking-wide">
        {progress}%
      </p>
    </div>
  );
};

export default LoadingScreen;
