import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Upload } from "lucide-react";

const Create = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game_url: "",
    image_url: "",
    genre: "Action",
    max_players: "1-4 players",
    category: "game"
  });

  const genres = [
    "Action", "Adventure", "Puzzle", "Strategy", 
    "Simulation", "Survival", "Horror", "RPG"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please login to create a game");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_game_with_context', {
        _session_token: sessionToken,
        _title: formData.title,
        _description: formData.description,
        _genre: formData.genre,
        _max_players: formData.max_players,
        _game_url: formData.game_url,
        _image_url: formData.image_url,
        _category: formData.category
      });

      if (error) throw error;

      toast.success("Game created successfully!");
      navigate('/games');
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error("Failed to create game");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Halloween decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[5%] text-6xl animate-float opacity-20">🎃</div>
        <div className="absolute top-32 right-[8%] text-5xl animate-float-delayed opacity-25">👻</div>
        <div className="absolute bottom-[20%] left-[10%] text-4xl animate-float opacity-15">🦇</div>
      </div>

      <Navigation />
      
      <div className="container mx-auto px-4 py-12 relative z-10 max-w-3xl">
        <div className="mb-8 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <Plus className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold tracking-tight">
              Create <span className="text-primary">Game</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Share your favorite game with the community
          </p>
        </div>

        <Card className="animate-fade-in-delay-1">
          <CardHeader>
            <CardTitle>Game Details</CardTitle>
            <CardDescription>
              Fill in the information about your game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Game Title *
                </label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter game title"
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your game..."
                  rows={4}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="game_url" className="text-sm font-medium">
                  Game URL *
                </label>
                <Input
                  id="game_url"
                  type="url"
                  required
                  value={formData.game_url}
                  onChange={(e) => setFormData({...formData, game_url: e.target.value})}
                  placeholder="https://example.com/game"
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="image_url" className="text-sm font-medium">
                  Image URL
                </label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  className="bg-muted/50"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="genre" className="text-sm font-medium">
                    Genre *
                  </label>
                  <select
                    id="genre"
                    required
                    value={formData.genre}
                    onChange={(e) => setFormData({...formData, genre: e.target.value})}
                    className="w-full h-10 px-3 bg-muted/50 border border-border rounded-md text-foreground"
                  >
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="max_players" className="text-sm font-medium">
                    Max Players
                  </label>
                  <Input
                    id="max_players"
                    value={formData.max_players}
                    onChange={(e) => setFormData({...formData, max_players: e.target.value})}
                    placeholder="e.g., 1-4 players"
                    className="bg-muted/50"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <Upload className="w-4 h-4" />
                  {isSubmitting ? "Creating..." : "Create Game"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/games')}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Create;
