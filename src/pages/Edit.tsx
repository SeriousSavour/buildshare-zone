import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/layout/Navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabaseWithProxy as supabase } from "@/lib/proxyClient";

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "Action",
    max_players: "1-4 players",
    game_url: "",
    image_url: "",
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please login to edit games");
      navigate("/games");
      return;
    }

    try {
      const { data: userData } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (!userData || userData.length === 0) {
        toast.error("Session expired. Please login again.");
        navigate("/games");
        return;
      }

      const userId = userData[0].user_id;

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const hasAdminRole = rolesData?.some(r => r.role === 'admin') || false;
      
      if (!hasAdminRole) {
        toast.error("You don't have permission to edit games");
        navigate("/games");
        return;
      }

      setIsAdmin(true);
      loadGameData();
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error("Failed to verify permissions");
      navigate("/games");
    }
  };

  const loadGameData = async () => {
      if (!id) {
        navigate("/games");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            title: data.title || "",
            description: data.description || "",
            genre: data.genre || "Action",
            max_players: data.max_players || "1-4 players",
            game_url: data.game_url || "",
            image_url: data.image_url || "",
          });
        }
      } catch (error) {
        console.error("Error loading game:", error);
        toast.error("Failed to load game data");
        navigate("/games");
      } finally {
        setIsLoading(false);
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error("Please enter a game title");
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionToken = localStorage.getItem('session_token');
      
      const { data, error } = await supabase.rpc('update_game_with_context', {
        _session_token: sessionToken,
        _game_id: id,
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        max_players: formData.max_players,
        game_url: formData.game_url,
        image_url: formData.image_url
      });

      if (error) throw error;

      toast.success("Game updated successfully!");
      navigate("/games");
    } catch (error: any) {
      console.error("Error updating game:", error);
      toast.error(error.message || "Failed to update game");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Game</CardTitle>
            <CardDescription>Update your game's information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Game Title *</label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter game title"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter game description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="genre" className="text-sm font-medium">Genre</label>
                <Input
                  id="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  placeholder="e.g., Action, Adventure, Puzzle"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="max_players" className="text-sm font-medium">Max Players</label>
                <Input
                  id="max_players"
                  value={formData.max_players}
                  onChange={(e) => setFormData({ ...formData, max_players: e.target.value })}
                  placeholder="e.g., 1-4 players"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="game_url" className="text-sm font-medium">Game URL</label>
                <Input
                  id="game_url"
                  type="url"
                  value={formData.game_url}
                  onChange={(e) => setFormData({ ...formData, game_url: e.target.value })}
                  placeholder="https://example.com/game"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="image_url" className="text-sm font-medium">Image URL</label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Game"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/games")}
                  disabled={isSubmitting}
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

export default Edit;
