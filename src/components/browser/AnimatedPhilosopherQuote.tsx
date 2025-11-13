import { useState, useEffect } from "react";
import { getRandomPhilosopherQuote, type PhilosopherQuote } from "@/lib/greekQuotes";

const AnimatedPhilosopherQuote = () => {
  const [currentQuote, setCurrentQuote] = useState<PhilosopherQuote>(getRandomPhilosopherQuote());
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false);
      
      // After fade out, change quote and fade in
      setTimeout(() => {
        setCurrentQuote(getRandomPhilosopherQuote());
        setIsVisible(true);
      }, 500); // Wait for fade out animation
    }, 6000); // Change quote every 6 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-4 p-4 rounded-lg bg-white/5 border border-white/10 min-h-[80px] flex items-center justify-center">
      <div
        className={`transition-opacity duration-500 text-center ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-sm italic text-gray-300 mb-1">"{currentQuote.quote}"</p>
        <p className="text-xs text-gray-400">— {currentQuote.author}</p>
        {currentQuote.greek && (
          <p className="text-xs text-gray-500 mt-1 font-light">{currentQuote.greek}</p>
        )}
      </div>
    </div>
  );
};

export default AnimatedPhilosopherQuote;
