import React from "react";

interface StyledTextProps {
  text: string;
  className?: string;
  weirdLetterIndex?: number;
}

export const StyledText: React.FC<StyledTextProps> = ({ 
  text, 
  className = "",
  weirdLetterIndex
}) => {
  // If no index specified, use the first letter
  const indexToStyle = weirdLetterIndex !== undefined ? weirdLetterIndex : 0;
  
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className={index === indexToStyle ? "font-lobster inline-block transform scale-125 text-accent" : ""}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

// Predefined styled keywords
export const StyledKeyword: React.FC<{ keyword: string; className?: string }> = ({ 
  keyword, 
  className = "" 
}) => {
  const keywordStyles: Record<string, number> = {
    'Games': 0,      // G
    'Action': 2,     // t
    'Likes': 1,      // i
    'Tools': 0,      // T
    'Gaming': 0,     // G
    'Popular': 3,    // u
    'Featured': 0,   // F
    'Create': 2,     // e
    'Friends': 2,    // i
    'Chat': 0,       // C
    'Profile': 3,    // f
    'Settings': 4,   // i
    'shadow': 0,     // s
    'Browser': 1,    // r
    'Home': 0,       // H
    'Help': 1,       // e
  };

  const indexToStyle = keywordStyles[keyword] !== undefined ? keywordStyles[keyword] : 0;

  return <StyledText text={keyword} className={className} weirdLetterIndex={indexToStyle} />;
};
