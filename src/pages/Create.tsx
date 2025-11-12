import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import Navigation from "@/components/layout/Navigation";

const Create = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "Action",
    max_players: "1",
    category: "game"
  });
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleGameFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "text/html" || file.name.endsWith(".html")) {
        setGameFile(file);
      } else {
        toast.error("Please upload an HTML file");
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setImageFile(file);
      } else {
        toast.error("Please upload an image file");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameFile) {
      toast.error("Please upload an HTML file");
      return;
    }

    try {
      setLoading(true);
      const sessionToken = localStorage.getItem("session_token");
      
      if (!sessionToken) {
        toast.error("Please log in to create a game");
        navigate("/login");
        return;
      }

      // Read the HTML file as text - DO NOT encode or escape it
      const htmlText = await gameFile.text();
      
      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: imageData, error: imageError } = await supabase.storage
          .from("game-images")
          .upload(fileName, imageFile);

        if (imageError) throw imageError;
        imageUrl = supabase.storage.from("game-images").getPublicUrl(imageData.path).data.publicUrl;
      }

      // Create game with raw HTML content
      const { data, error } = await supabase.rpc("create_game_with_context", {
        _session_token: sessionToken,
        _title: formData.title,
        _description: formData.description,
        _game_url: htmlText, // Pass raw HTML directly
        _genre: formData.genre,
        _max_players: formData.max_players,
        _category: formData.category,
        _image_url: imageUrl
      });

      if (error) throw error;

      toast.success("Game created successfully!");
      navigate("/games");
    } catch (error: any) {
      console.error("Error creating game:", error);
      toast.error(error.message || "Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Game</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Game Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="max_players">Max Players</Label>
                <Input
                  id="max_players"
                  value={formData.max_players}
                  onChange={(e) => setFormData({ ...formData, max_players: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="gameFile">HTML File *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="gameFile"
                    type="file"
                    accept=".html,text/html"
                    onChange={handleGameFileChange}
                    className="cursor-pointer"
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                {gameFile && (
                  <p className="text-sm text-muted-foreground mt-1">{gameFile.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="imageFile">Game Image (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="cursor-pointer"
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                {imageFile && (
                  <p className="text-sm text-muted-foreground mt-1">{imageFile.name}</p>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Game"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Create;
