import { useEffect, useState, useRef } from "react";
import scenery1 from "@/assets/scenery-1.jpg";
import scenery2 from "@/assets/scenery-2.jpg";
import scenery3 from "@/assets/scenery-3.jpg";

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const sceneryImages = [scenery1, scenery2, scenery3];

const LoadingScreen = ({ onLoadComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % sceneryImages.length);
    }, 4000);

    return () => clearInterval(imageInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      {/* Rotating scenery backgrounds */}
      {sceneryImages.map((image, index) => (
        <div
          key={index}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${image})`,
            opacity: currentImageIndex === index ? 1 : 0,
          }}
        />
      ))}
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Shadow branded logo */}
        <div className="mb-8">
          <div className="relative">
            {/* Windows-style square grid */}
            <div className="w-32 h-32 grid grid-cols-2 gap-2 mb-4">
              <div className="bg-primary rounded-sm shadow-2xl"></div>
              <div className="bg-secondary rounded-sm shadow-2xl"></div>
              <div className="bg-accent rounded-sm shadow-2xl"></div>
              <div className="bg-blue-500 rounded-sm shadow-2xl"></div>
            </div>
            {/* Brand name */}
            <h1 className="text-3xl font-bold text-center text-foreground drop-shadow-lg">
              shadow
            </h1>
          </div>
        </div>

        {/* Loading spinner */}
        <div className="relative w-8 h-8 mb-6">
          <div className="absolute inset-0 border-3 border-foreground/30 rounded-full"></div>
          <div className="absolute inset-0 border-3 border-t-foreground rounded-full animate-spin"></div>
        </div>

        {/* Progress indicator */}
        <p className="text-foreground/90 text-sm tracking-wide font-medium drop-shadow">
          {progress}%
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
