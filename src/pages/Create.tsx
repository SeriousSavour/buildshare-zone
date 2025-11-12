import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import Navigation from "@/components/layout/Navigation";

const Create = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const MAX_HTML_SIZE = 500 * 1024 * 1024; // 500MB
  const MAX_IMAGE_SIZE = 500 * 1024 * 1024; // 500MB
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "Action",
    max_players: "1",
    category: "game"
  });
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingGame, setIsDraggingGame] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const handleGameFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!(file.type === "text/html" || file.name.endsWith(".html"))) {
        toast.error("Please upload an HTML file");
        return;
      }
      if (file.size > MAX_HTML_SIZE) {
        toast.error(`HTML file size must be less than ${MAX_HTML_SIZE / (1024 * 1024)}MB`);
        return;
      }
      setGameFile(file);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`Image file size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGameDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGame(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    if (!(file.type === "text/html" || file.name.endsWith(".html"))) {
      toast.error("Please upload an HTML file");
      return;
    }
    if (file.size > MAX_HTML_SIZE) {
      toast.error(`HTML file size must be less than ${MAX_HTML_SIZE / (1024 * 1024)}MB`);
      return;
    }
    setGameFile(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(`Image file size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Create New Game</h1>
          <p className="text-muted-foreground">Upload your HTML5 game and share it with the community</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">Game Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter your game title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your game, its features, and gameplay"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    required
                    className="resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-base font-semibold">Genre</Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) => setFormData({ ...formData, genre: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Action">Action</SelectItem>
                        <SelectItem value="Adventure">Adventure</SelectItem>
                        <SelectItem value="Puzzle">Puzzle</SelectItem>
                        <SelectItem value="RPG">RPG</SelectItem>
                        <SelectItem value="Strategy">Strategy</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Racing">Racing</SelectItem>
                        <SelectItem value="Fighting">Fighting</SelectItem>
                        <SelectItem value="Shooter">Shooter</SelectItem>
                        <SelectItem value="Platformer">Platformer</SelectItem>
                        <SelectItem value="Simulation">Simulation</SelectItem>
                        <SelectItem value="Horror">Horror</SelectItem>
                        <SelectItem value="Arcade">Arcade</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Board">Board</SelectItem>
                        <SelectItem value="Educational">Educational</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Casual">Casual</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_players" className="text-base font-semibold">Max Players</Label>
                    <Select
                      value={formData.max_players}
                      onValueChange={(value) => setFormData({ ...formData, max_players: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select max players" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Player (Single Player)</SelectItem>
                        <SelectItem value="2">2 Players</SelectItem>
                        <SelectItem value="3">3 Players</SelectItem>
                        <SelectItem value="4">4 Players</SelectItem>
                        <SelectItem value="5">5 Players</SelectItem>
                        <SelectItem value="6">6 Players</SelectItem>
                        <SelectItem value="7">7 Players</SelectItem>
                        <SelectItem value="8">8 Players</SelectItem>
                        <SelectItem value="10">10 Players</SelectItem>
                        <SelectItem value="16">16 Players</SelectItem>
                        <SelectItem value="32">32 Players</SelectItem>
                        <SelectItem value="64">64 Players</SelectItem>
                        <SelectItem value="100+">100+ Players (MMO)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gameFile" className="text-base font-semibold">
                    HTML Game File <span className="text-destructive">*</span>
                  </Label>
                  <div
                    onDrop={handleGameDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setIsDraggingGame(true)}
                    onDragLeave={() => setIsDraggingGame(false)}
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                      isDraggingGame
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Input
                      id="gameFile"
                      type="file"
                      accept=".html,text/html"
                      onChange={handleGameFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Drop your HTML file here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports .html files (max 500MB)
                        </p>
                      </div>
                    </div>
                  </div>
                  {gameFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-md">
                      <Upload className="w-4 h-4" />
                      <span>{gameFile.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageFile" className="text-base font-semibold">
                    Cover Image <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                  </Label>
                  <div
                    onDrop={handleImageDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setIsDraggingImage(true)}
                    onDragLeave={() => setIsDraggingImage(false)}
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                      isDraggingImage
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Drop your cover image here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports JPG, PNG, WebP (max 500MB)
                        </p>
                      </div>
                    </div>
                  </div>
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                        <img
                          src={imagePreview}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{imageFile?.name}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-12 text-base font-semibold"
                >
                  {loading ? "Creating Game..." : "Create Game"}
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
