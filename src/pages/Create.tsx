import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Upload } from "lucide-react";
import { useQuestTracking } from "@/hooks/useQuestTracking";

const Create = () => {
  const navigate = useNavigate();
  const { trackQuestProgress } = useQuestTracking();
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const genres = [
    "Action", "Adventure", "Puzzle", "Strategy", 
    "Simulation", "Survival", "Horror", "RPG"
  ];

  const maxPlayersOptions = [
    "Single Player",
    "1-2 players",
    "1-4 players",
    "1-8 players",
    "2-4 players",
    "2-8 players",
    "Multiplayer"
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }
      setImageFile(file);
    }
  };

  const handleGameFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Game file size must be less than 100MB");
        return;
      }
      setGameFile(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const sessionToken = localStorage.getItem('session_token');
    
    // Set session context for storage policies
    if (sessionToken) {
      await supabase.rpc('set_session_context', { _session_token: sessionToken });
    }
    
    // Detect content type based on file extension for better compatibility
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    let contentType = file.type || 'application/octet-stream';
    
    // Ensure HTML files are served with correct MIME type
    if (fileExt === 'html' || fileExt === 'htm') {
      contentType = 'text/html';
    } else if (fileExt === 'zip') {
      contentType = 'application/zip';
    }
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { 
        upsert: true,
        contentType: contentType
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please login to create a game");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let imageUrl = formData.image_url;
      let gameUrl = formData.game_url;

      // Upload image if selected
      if (imageFile) {
        setUploadProgress(25);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        imageUrl = await uploadFile(imageFile, 'game-assets', `game-images/${fileName}`);
        setUploadProgress(50);
      }

      // Upload game file if selected
      if (gameFile) {
        setUploadProgress(60);
        const fileExt = gameFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        gameUrl = await uploadFile(gameFile, 'game-assets', `game-files/${fileName}`);
        setUploadProgress(80);
      }

      setUploadProgress(90);

      // Create new game
      const { data, error } = await supabase.rpc('create_game_with_context', {
        _session_token: sessionToken,
        _title: formData.title,
        _description: formData.description,
        _genre: formData.genre,
        _max_players: formData.max_players,
        _game_url: gameUrl,
        _image_url: imageUrl,
        _category: formData.category
      });

      if (error) throw error;
      
      setUploadProgress(100);
      
      // Clear games cache so the new game appears immediately
      localStorage.removeItem('games_cache_v2');
      localStorage.removeItem('games_cache_v2_timestamp');
      
      // Track quest progress
      await trackQuestProgress('create_game');
      
      toast.success("Game created successfully!");
      
      navigate('/games');
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error("Failed to create game");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
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
      <AnnouncementBanner />
      
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
            <CardTitle>Create Game Details</CardTitle>
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
                  onChange={(e) => {
                    const value = e.target.value.replace(/<script[^>]*>.*?<\/script>/gi, '');
                    if (value.length <= 1000) {
                      setFormData({...formData, description: value});
                    }
                  }}
                  placeholder="Describe your game..."
                  rows={4}
                  className="bg-muted/50"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="game_url" className="text-sm font-medium">
                  Game URL {!gameFile && "*"}
                </label>
                <Input
                  id="game_url"
                  type="url"
                  required={!gameFile}
                  value={formData.game_url}
                  onChange={(e) => setFormData({...formData, game_url: e.target.value})}
                  placeholder="https://example.com/game"
                  className="bg-muted/50"
                  disabled={!!gameFile}
                />
                {gameFile && (
                  <p className="text-xs text-muted-foreground">
                    Game URL is not needed when uploading a file
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="image_url" className="text-sm font-medium">
                  Game Image
                </label>
                <div className="space-y-3">
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="bg-muted/50"
                  />
                  <div className="relative">
                    <input
                      id="image-file"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-file"
                      className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">
                        {imageFile ? imageFile.name : "Or upload an image"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="game_file" className="text-sm font-medium">
                  Game File (Optional)
                </label>
                <div className="relative">
                  <input
                    id="game_file"
                    type="file"
                    onChange={handleGameFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="game_file"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">
                      {gameFile ? gameFile.name : "Upload game file (HTML, ZIP, etc.)"}
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 100MB. Supports HTML, ZIP, and other game files.
                  </p>
                </div>
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
                    Max Players *
                  </label>
                  <select
                    id="max_players"
                    required
                    value={formData.max_players}
                    onChange={(e) => setFormData({...formData, max_players: e.target.value})}
                    className="w-full h-10 px-3 bg-muted/50 border border-border rounded-md text-foreground"
                  >
                    {maxPlayersOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

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
