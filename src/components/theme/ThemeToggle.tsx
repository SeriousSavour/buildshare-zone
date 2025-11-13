import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative overflow-hidden hover:bg-accent/20 group"
    >
      <Sun className="h-5 w-5 text-foreground absolute transition-all duration-500 ease-in-out transform rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="h-5 w-5 text-foreground absolute transition-all duration-500 ease-in-out transform rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
