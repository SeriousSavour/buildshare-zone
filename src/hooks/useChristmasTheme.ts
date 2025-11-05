import { useState, useEffect } from 'react';

export type ChristmasTheme = 'traditional' | 'winter' | 'modern';

interface ThemeColors {
  primary: string;
  primaryGlow: string;
  secondary: string;
  accent: string;
  glowPrimary: string;
  glowSecondary: string;
  glowAccent: string;
}

const themes: Record<ChristmasTheme, ThemeColors> = {
  traditional: {
    primary: '355 75% 55%',
    primaryGlow: '355 80% 65%',
    secondary: '145 60% 40%',
    accent: '45 90% 55%',
    glowPrimary: '355 80% 65%',
    glowSecondary: '145 65% 50%',
    glowAccent: '45 90% 60%',
  },
  winter: {
    primary: '200 85% 55%',
    primaryGlow: '200 90% 65%',
    secondary: '190 75% 50%',
    accent: '210 80% 70%',
    glowPrimary: '200 90% 65%',
    glowSecondary: '190 85% 60%',
    glowAccent: '210 85% 75%',
  },
  modern: {
    primary: '45 90% 55%',
    primaryGlow: '45 95% 65%',
    secondary: '0 0% 95%',
    accent: '40 85% 60%',
    glowPrimary: '45 95% 65%',
    glowSecondary: '0 0% 100%',
    glowAccent: '40 90% 70%',
  },
};

export const useChristmasTheme = () => {
  const [theme, setTheme] = useState<ChristmasTheme>(() => {
    const saved = localStorage.getItem('christmas-theme');
    const initialTheme = (saved as ChristmasTheme) || 'traditional';
    
    // Apply theme immediately on load to prevent flash
    if (typeof window !== 'undefined') {
      applyTheme(initialTheme);
    }
    
    return initialTheme;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('christmas-theme', theme);
  }, [theme]);

  return { theme, setTheme, themes };
};

// Helper function to apply theme
function applyTheme(theme: ChristmasTheme) {
  const colors = themes[theme];
  const root = document.documentElement;

  // Update CSS variables
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-glow', colors.primaryGlow);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--glow-red', colors.glowPrimary);
  root.style.setProperty('--glow-green', colors.glowSecondary);
  root.style.setProperty('--glow-gold', colors.glowAccent);
  root.style.setProperty('--glow-blue', colors.glowAccent);
  root.style.setProperty('--ring', colors.primary);
  root.style.setProperty('--sidebar-primary', colors.primary);
  root.style.setProperty('--sidebar-ring', colors.primary);
  
  // Update gradients
  root.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, hsl(${colors.primary}), hsl(${colors.primaryGlow}))`
  );
  root.style.setProperty(
    '--gradient-secondary',
    `linear-gradient(135deg, hsl(${colors.secondary}), hsl(${colors.glowSecondary}))`
  );
  root.style.setProperty(
    '--gradient-festive',
    `linear-gradient(135deg, hsl(${colors.primary}), hsl(${colors.accent}))`
  );
}
