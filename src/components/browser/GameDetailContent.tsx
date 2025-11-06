import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Share2, User, Play, Maximize2, Send, Minimize2 } from "lucide-react";
import { IframeSecurityMonitor } from "@/components/security/IframeSecurityMonitor";

interface Game {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  genre: string;
  max_players: string;
  creator_name: string;
  creator_id: string;
  creator_avatar?: string | null;
  likes: number;
  plays: number;
  game_url: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface GameDetailContentProps {
  gameId: string;
  isFullscreen?: boolean;
}

const GameDetailContent = ({ gameId, isFullscreen: isParentFullscreen = false }: GameDetailContentProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [iframeSize, setIframeSize] = useState({ width: 900, height: 600 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [useDirectUrl, setUseDirectUrl] = useState(false);
  const [isLoadingGame, setIsLoadingGame] = useState(false);

  useEffect(() => {
    if (gameId) {
      fetchGame();
      checkIfLiked();
      fetchComments();
    }
  }, [gameId]);

  const decodeHtmlEntities = (html: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  };

  useEffect(() => {
    if (!game?.game_url) return;
    
    const isRawHtml = game.game_url.trim().startsWith('<') || 
                      game.game_url.includes('<!DOCTYPE') ||
                      game.game_url.includes('<html') ||
                      game.game_url.includes('&lt;');
    
    if (isRawHtml) {
      setHtmlContent(decodeHtmlEntities(game.game_url));
      setUseDirectUrl(false);
    } else {
      setHtmlContent(game.game_url);
      setUseDirectUrl(true);
    }
    
    setIsLoadingGame(false);
  }, [game?.game_url]);

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;
      setGame(data);
    } catch (error) {
      console.error('Error fetching game:', error);
      toast.error('Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) return;

      const { data: session } = await supabase.rpc('verify_session_token', {
        token: sessionToken
      });

      if (!session) return;

      const { data, error } = await supabase
        .from('user_likes')
        .select('*')
        .eq('user_id', session.user_id)
        .eq('game_id', gameId)
        .single();

      if (!error && data) {
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('game_comments')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        toast.error('Please log in to like games');
        return;
      }

      const { data: session } = await supabase.rpc('verify_session_token', {
        token: sessionToken
      });

      if (!session) {
        toast.error('Session expired. Please log in again');
        return;
      }

      if (isLiked) {
        await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', session.user_id)
          .eq('game_id', gameId);

        await supabase.rpc('decrement_game_likes', { game_id: gameId });
        setIsLiked(false);
        toast.success('Removed from favorites');
      } else {
        await supabase
          .from('user_likes')
          .insert({ user_id: session.user_id, game_id: gameId });

        await supabase.rpc('increment_game_likes', { game_id: gameId });
        setIsLiked(true);
        toast.success('Added to favorites!');
      }

      fetchGame();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/games/${gameId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Game link copied to clipboard!');
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        toast.error('Please log in to comment');
        return;
      }

      const { data: session } = await supabase.rpc('verify_session_token', {
        token: sessionToken
      });

      if (!session) {
        toast.error('Session expired');
        return;
      }

      const { error } = await supabase
        .from('game_comments')
        .insert({
          game_id: gameId,
          user_id: session.user_id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-white">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-white">Game not found</div>
      </div>
    );
  }

  // Fullscreen mode - just show the game
  if (isParentFullscreen) {
    return (
      <div className="w-full h-full bg-black">
        <IframeSecurityMonitor iframeRef={iframeRef} />
        
        {isLoadingGame && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-white">Loading game...</div>
          </div>
        )}
        
        {useDirectUrl ? (
          <iframe
            ref={iframeRef}
            id="game-iframe-fullscreen"
            src={htmlContent || ''}
            className="w-full h-full"
            style={{ 
              width: '100%',
              height: '100vh',
              border: 'none'
            }}
            title={game.title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <iframe
            ref={iframeRef}
            id="game-iframe-fullscreen"
            srcDoc={htmlContent || ''}
            className="w-full h-full"
            style={{ 
              width: '100%',
              height: '100vh',
              border: 'none'
            }}
            title={game.title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  // Normal mode with sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className={`grid ${showSidebar ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {/* Main Game Area */}
          <div className={showSidebar ? 'lg:col-span-2' : 'col-span-1'}>
            <IframeSecurityMonitor iframeRef={iframeRef} />
            
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-black" style={{ minHeight: '600px' }}>
                  {isLoadingGame && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                      <div className="text-white">Loading game...</div>
                    </div>
                  )}
                  
                  {useDirectUrl ? (
                    <iframe
                      ref={iframeRef}
                      id="game-iframe-normal"
                      src={htmlContent || ''}
                      className="w-full h-full"
                      style={{ 
                        width: isFullscreen ? '100vw' : `${iframeSize.width}px`,
                        height: isFullscreen ? '100vh' : `${iframeSize.height}px`,
                        border: 'none'
                      }}
                      title={game.title}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
                    <iframe
                      ref={iframeRef}
                      id="game-iframe-normal"
                      srcDoc={htmlContent || ''}
                      className="w-full h-full"
                      style={{ 
                        width: isFullscreen ? '100vw' : `${iframeSize.width}px`,
                        height: isFullscreen ? '100vh' : `${iframeSize.height}px`,
                        border: 'none'
                      }}
                      title={game.title}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h1 className="text-2xl font-bold mb-2">{game.title}</h1>
                  <p className="text-muted-foreground mb-4">{game.description}</p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant={isLiked ? "default" : "outline"}
                      size="sm"
                      onClick={handleLike}
                      className="flex items-center gap-2"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      {game.likes}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm">by {game.creator_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    <span className="text-sm">{game.plays} plays</span>
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Comments</h2>
                  
                  <div className="mb-4">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-2"
                    />
                    <Button
                      onClick={handleSubmitComment}
                      disabled={submittingComment || !newComment.trim()}
                      size="sm"
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Post Comment
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-b pb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.profiles?.username || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetailContent;
