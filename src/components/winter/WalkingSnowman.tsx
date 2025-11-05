import { useEffect, useState } from "react";

export const WalkingSnowman = () => {
  const [position, setPosition] = useState(-100);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => {
        const newPos = prev + (direction * 2);
        
        // Reverse direction at screen edges
        if (newPos > window.innerWidth + 100) {
          setDirection(-1);
          return window.innerWidth + 100;
        } else if (newPos < -100) {
          setDirection(1);
          return -100;
        }
        
        return newPos;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [direction]);

  return (
    <div
      className="fixed bottom-4 z-50 pointer-events-none transition-transform duration-100"
      style={{
        left: `${position}px`,
        transform: direction === -1 ? "scaleX(-1)" : "scaleX(1)",
      }}
    >
      {/* Snowman SVG */}
      <svg
        width="80"
        height="100"
        viewBox="0 0 80 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Bottom snowball */}
        <circle cx="40" cy="75" r="20" fill="#ffffff" stroke="#e0e0e0" strokeWidth="2" />
        
        {/* Middle snowball */}
        <circle cx="40" cy="45" r="15" fill="#ffffff" stroke="#e0e0e0" strokeWidth="2" />
        
        {/* Top snowball (head) */}
        <circle cx="40" cy="20" r="12" fill="#ffffff" stroke="#e0e0e0" strokeWidth="2" />
        
        {/* Hat */}
        <rect x="32" y="5" width="16" height="8" fill="#1a1a1a" rx="1" />
        <rect x="28" y="12" width="24" height="3" fill="#1a1a1a" rx="1" />
        
        {/* Eyes */}
        <circle cx="36" cy="18" r="2" fill="#1a1a1a" />
        <circle cx="44" cy="18" r="2" fill="#1a1a1a" />
        
        {/* Carrot nose */}
        <path d="M40 20 L48 22 L40 24 Z" fill="#ff6b35" />
        
        {/* Smile */}
        <path
          d="M 35 24 Q 40 26 45 24"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Buttons */}
        <circle cx="40" cy="40" r="1.5" fill="#1a1a1a" />
        <circle cx="40" cy="45" r="1.5" fill="#1a1a1a" />
        <circle cx="40" cy="50" r="1.5" fill="#1a1a1a" />
        
        {/* Arms (sticks) */}
        <line x1="25" y1="45" x2="15" y2="40" stroke="#8b4513" strokeWidth="2" strokeLinecap="round" />
        <line x1="55" y1="45" x2="65" y2="40" stroke="#8b4513" strokeWidth="2" strokeLinecap="round" />
        
        {/* Walking legs animation */}
        <g className="animate-pulse">
          <line x1="35" y1="95" x2="35" y2="92" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          <line x1="45" y1="95" x2="45" y2="90" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};
