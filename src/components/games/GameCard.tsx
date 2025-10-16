import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Play, MessageSquare, Share2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GameCardProps {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  genre: string;
  maxPlayers: string;
  creatorName: string;
  likes: number;
  plays: number;
  gameUrl: string | null;
  isLiked?: boolean;
  onLikeToggle?: () => void;
}

const GameCard = ({
  id,
  title,
  description,
  imageUrl,
  genre,
  creatorName,
  likes,
  plays,
  gameUrl,
  isLiked = false,
  onLikeToggle,
}: GameCardProps) => {
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(likes);

  const handleLike = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please login to like games");
      return;
    }

    setIsLiking(true);
    try {
      const { data: userData } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (!userData || userData.length === 0) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const userId = userData[0].user_id;

      const { data, error } = await supabase.rpc('toggle_game_like', {
        _game_id: id,
        _user_id: userId
      });

      if (error) throw error;

      setLocalLiked(data.is_liked);
      setLocalLikes(data.like_count);
      onLikeToggle?.();

      toast.success(data.is_liked ? "Game liked!" : "Like removed");
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to toggle like");
    } finally {
      setIsLiking(false);
    }
  };

  const handlePlay = () => {
    if (gameUrl) {
      window.open(gameUrl, '_blank');
    } else {
      toast.error("Game URL not available");
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/games?id=${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-card border-border glow-purple">
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Play className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
            {genre}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-3">
        <div>
          <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description || "No description available"}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">by {creatorName}</span>
          <div className="flex gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {localLikes}
            </span>
            <span className="flex items-center gap-1">
              <Play className="w-4 h-4" />
              {plays}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button
          onClick={handlePlay}
          className="flex-1 glow-orange"
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          Play Now
        </Button>
        
        <Button
          onClick={handleLike}
          disabled={isLiking}
          variant={localLiked ? "default" : "outline"}
          size="lg"
          className={localLiked ? "glow-orange" : ""}
        >
          <Heart className={`w-4 h-4 ${localLiked ? "fill-current" : ""}`} />
        </Button>
        
        <Button
          onClick={handleShare}
          variant="outline"
          size="lg"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GameCard;
