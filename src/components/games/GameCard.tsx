import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Play, MessageSquare, Share2, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseWithProxy as supabase } from "@/lib/proxyClient";
import { toast } from "sonner";
import { StyledText } from "@/components/ui/styled-text";

interface GameCardProps {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  genre: string;
  maxPlayers: string;
  creatorName: string;
  creatorAvatar?: string | null;
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
  creatorAvatar,
  likes,
  plays,
  gameUrl,
  isLiked = false,
  onLikeToggle,
}: GameCardProps) => {
  const navigate = useNavigate();
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
    navigate(`/games/${id}`);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/games?id=${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Card className="group overflow-hidden hover-lift hover-glow transition-all duration-500 bg-card border-border hover:border-primary/50 animate-slide-up">
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Play className="w-16 h-16 text-muted-foreground animate-pulse" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm shadow-lg hover-scale">
            <StyledText text={genre} weirdLetterIndex={genre === "Action" ? 2 : 0} />
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
          <div className="flex items-center gap-2">
            {creatorAvatar ? (
              <img
                src={creatorAvatar}
                alt={creatorName}
                className="w-6 h-6 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-3 h-3 text-primary" />
              </div>
            )}
            <span className="text-muted-foreground">by {creatorName}</span>
          </div>
          <div className="flex gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <StyledText text={localLikes.toString()} weirdLetterIndex={0} />
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
          className="flex-1 glow-orange hover-scale transition-all duration-300"
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
          className={`transition-all duration-300 hover-scale ${localLiked ? "glow-orange animate-pulse-glow" : "hover-glow"}`}
        >
          <Heart className={`w-4 h-4 transition-transform duration-300 ${localLiked ? "fill-current scale-110" : ""}`} />
        </Button>
        
        <Button
          onClick={handleShare}
          variant="outline"
          size="lg"
          className="hover-scale hover-glow transition-all duration-300"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GameCard;
