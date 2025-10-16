import { useState } from "react";
import Navigation from "@/components/layout/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wrench, Search, ExternalLink } from "lucide-react";

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const tools = [
    {
      id: 1,
      name: "Unblocked Games 76",
      description: "A collection of unblocked games for school and work",
      url: "https://ubg76.github.io/",
      icon: "🎮",
      category: "Games"
    },
    {
      id: 2,
      name: "Cool Math Games",
      description: "Educational games and puzzles",
      url: "https://www.coolmathgames.com/",
      icon: "🧮",
      category: "Educational"
    },
    {
      id: 3,
      name: "Y8 Games",
      description: "Free online games platform",
      url: "https://www.y8.com/",
      icon: "🕹️",
      category: "Games"
    },
    {
      id: 4,
      name: "Armor Games",
      description: "Premium flash and browser games",
      url: "https://armorgames.com/",
      icon: "🛡️",
      category: "Games"
    },
    {
      id: 5,
      name: "Kongregate",
      description: "Browser and mobile games community",
      url: "https://www.kongregate.com/",
      icon: "👾",
      category: "Games"
    }
  ];

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Halloween decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[5%] text-6xl animate-float opacity-20">🎃</div>
        <div className="absolute top-32 right-[8%] text-5xl animate-float-delayed opacity-25">👻</div>
        <div className="absolute top-[20%] left-[15%] text-4xl animate-float opacity-15">🦇</div>
        <div className="absolute bottom-[30%] right-[5%] text-5xl animate-float-delayed opacity-20">🎃</div>
      </div>

      <Navigation />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="mb-12 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <Wrench className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold tracking-tight">
              Gaming <span className="text-primary">Tools</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Discover helpful gaming websites and resources
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 animate-fade-in-delay-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card border-border"
            />
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-delay-2">
          {filteredTools.map((tool) => (
            <Card 
              key={tool.id}
              className="group overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 hover:border-primary/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-5xl mb-3">{tool.icon}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                    {tool.category}
                  </span>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {tool.name}
                </CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full gap-2"
                  onClick={() => window.open(tool.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit Website
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-2xl font-semibold">No tools found</p>
            <p className="text-muted-foreground">
              Try adjusting your search
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tools;
