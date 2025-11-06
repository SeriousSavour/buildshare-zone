import { useEffect, useState } from "react";
import { StyledText } from "@/components/ui/styled-text";

interface LoadingScreenProps {
  onLoadComplete: () => void;
  siteName?: string;
}

const LoadingScreen = ({ onLoadComplete, siteName = "shadow" }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onLoadComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onLoadComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0e13] via-[#0f1419] to-[#1a1f29]">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Logo/Icon */}
      <div className="relative mb-8 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
          <div className="text-3xl font-bold text-white">
            {siteName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Site Name */}
      <h1 className="relative text-5xl font-bold mb-12 animate-fade-in bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent" style={{ animationDelay: "0.2s" }}>
        <StyledText text={siteName} weirdLetterIndex={0} />
      </h1>

      {/* Progress Bar */}
      <div className="relative w-64 h-1 bg-white/5 rounded-full overflow-hidden animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>

      {/* Loading Text */}
      <p className="relative mt-4 text-sm text-gray-400 animate-fade-in" style={{ animationDelay: "0.6s" }}>
        {progress < 100 ? "Loading..." : "Ready!"}
      </p>
    </div>
  );
};

export default LoadingScreen;
