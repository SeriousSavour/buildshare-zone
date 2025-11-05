import { useChristmasTheme } from "@/hooks/useChristmasTheme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Snowflake, Sparkles, Star } from "lucide-react";

export const ChristmasThemeToggle = () => {
  const { theme, setTheme } = useChristmasTheme();

  const themeOptions = [
    {
      id: 'traditional' as const,
      name: 'Traditional',
      icon: Star,
      description: 'Classic Red & Green',
      colors: 'bg-gradient-to-r from-red-500 to-green-600',
    },
    {
      id: 'winter' as const,
      name: 'Winter',
      icon: Snowflake,
      description: 'Cool Blue & Silver',
      colors: 'bg-gradient-to-r from-blue-400 to-cyan-300',
    },
    {
      id: 'modern' as const,
      name: 'Modern',
      icon: Sparkles,
      description: 'Gold & White',
      colors: 'bg-gradient-to-r from-yellow-400 to-white',
    },
  ];

  return (
    <Card className="p-6 bg-card/80 backdrop-blur-sm border-2 border-border/50">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        Christmas Theme
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.id;
          
          return (
            <Button
              key={option.id}
              onClick={() => setTheme(option.id)}
              variant={isActive ? "default" : "outline"}
              className={`h-auto flex-col gap-2 p-4 transition-all duration-300 ${
                isActive 
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-lg' 
                  : 'hover:scale-105'
              }`}
            >
              <div className={`w-12 h-12 rounded-full ${option.colors} flex items-center justify-center shadow-md`}>
                <Icon className="w-6 h-6 text-white drop-shadow-md" />
              </div>
              <div className="text-center">
                <div className="font-bold">{option.name}</div>
                <div className="text-xs opacity-75">{option.description}</div>
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};
