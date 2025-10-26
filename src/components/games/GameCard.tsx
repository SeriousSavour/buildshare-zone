import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Play, MessageSquare, Share2, User } from "lucide-react";
import { useState, useEffect } from "react";
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
  creatorId: string;
  likes: number;
  plays: number;
  gameUrl: string | null;
  isLiked?: boolean;
  isAdmin?: boolean;
  onLikeToggle?: () => void;
  onDelete?: () => void;
}

const GameCard = ({
  id,
  title,
  description,
  imageUrl,
  genre,
  creatorName,
  creatorAvatar,
  creatorId,
  likes,
  plays,
  gameUrl,
  isLiked = false,
  isAdmin = false,
  onLikeToggle,
  onDelete,
}: GameCardProps) => {
  const navigate = useNavigate();
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(likes);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);

  // Debug image loading
  useEffect(() => {
    console.log('GameCard mounted:', { title, imageUrl, currentImageUrl });
    
    // If image URL is from game-images bucket directly, try to fix it
    if (imageUrl?.includes('/game-images/') && !imageUrl?.includes('/game-assets/')) {
      const fileName = imageUrl.split('/game-images/')[1];
      const correctedUrl = `https://ptmeykacgbrsmvcvwrpp.supabase.co/storage/v1/object/public/game-assets/game-images/${fileName}`;
      console.log('Correcting image URL from:', imageUrl, 'to:', correctedUrl);
      setCurrentImageUrl(correctedUrl);
    }
  }, [title, imageUrl, currentImageUrl]);

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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this game?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        toast.error("Please login to delete games");
        return;
      }

      const { data, error } = await supabase.rpc('delete_game_with_context', {
        _session_token: sessionToken,
        _game_id: id
      });

      if (error) throw error;

      toast.success("Game deleted successfully");
      onDelete?.();
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error("Failed to delete game");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="group overflow-hidden hover-lift hover-glow transition-all duration-500 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 hover:border-primary/60 animate-slide-up rounded-2xl shadow-lg relative">
      <CardHeader className="p-0 relative">
        <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
          {currentImageUrl ? (
            <>
              <img
                src={currentImageUrl}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onLoad={(e) => {
                  console.log('✅ Image loaded:', title);
                  e.currentTarget.style.opacity = '1';
                  setImageLoading(false);
                  setImageError(false);
                }}
                onError={(e) => {
                  console.error('❌ Image error for:', title, currentImageUrl);
                  
                  // Try alternative URL format
                  if (currentImageUrl?.includes('/game-assets/game-images/')) {
                    const fileName = currentImageUrl.split('/game-assets/game-images/')[1];
                    const altUrl = `https://ptmeykacgbrsmvcvwrpp.supabase.co/storage/v1/object/public/game-images/${fileName}`;
                    console.log('Trying alternative URL:', altUrl);
                    setCurrentImageUrl(altUrl);
                  } else {
                    setImageError(true);
                  }
                  setImageLoading(false);
                }}
                style={{ opacity: imageLoading && !imageError ? 0 : 1, transition: 'opacity 0.3s' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
              <Play className="w-20 h-20 text-primary/60 animate-pulse" />
            </div>
          )}
          
          <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm shadow-xl hover-scale glow-orange pointer-events-none">
            <StyledText text={genre} weirdLetterIndex={genre === "Action" ? 2 : 0} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-7 space-y-4">
        <div>
          <h3 className="text-2xl font-bold mb-3 line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <p className="text-base text-muted-foreground/90 line-clamp-2 leading-relaxed">
            {description || "No description available"}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-sm pt-2">
          <div className="flex items-center gap-3">
            {creatorAvatar ? (
              <img
                src={creatorAvatar}
                alt={creatorName}
                className="w-8 h-8 rounded-full object-cover border-2 border-primary/30 ring-2 ring-card group-hover:ring-primary/20 transition-all"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 flex items-center justify-center border-2 border-primary/30">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
            <span className="text-muted-foreground font-medium">by {creatorName}</span>
          </div>
          <div className="flex gap-5 text-muted-foreground font-medium">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 border border-border/50">
              <Heart className="w-4 h-4 text-primary" />
              <StyledText text={localLikes.toString()} weirdLetterIndex={0} />
            </span>
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 border border-border/50">
              <Play className="w-4 h-4 text-accent" />
              {plays}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-7 pt-0 flex gap-3">
        <Button
          onClick={handlePlay}
          className="flex-1 glow-orange hover-scale transition-all duration-300 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-base font-semibold py-6 shadow-lg"
          size="lg"
        >
          <Play className="w-5 h-5 mr-2" />
          Play Now
        </Button>
        
        <Button
          onClick={handleLike}
          disabled={isLiking}
          variant={localLiked ? "default" : "outline"}
          size="lg"
          className={`transition-all duration-300 hover-scale py-6 ${localLiked ? "bg-gradient-to-r from-primary to-primary-glow glow-orange animate-pulse-glow" : "hover-glow border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/10"}`}
        >
          <Heart className={`w-5 h-5 transition-transform duration-300 ${localLiked ? "fill-current scale-110" : ""}`} />
        </Button>
        
        <Button
          onClick={handleShare}
          variant="outline"
          size="lg"
          className="hover-scale hover-glow transition-all duration-300 border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/10 py-6"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GameCard;
