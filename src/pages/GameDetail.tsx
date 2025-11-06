import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Heart, Share2, User, Play, ChevronLeft, ChevronRight, Maximize2, Send, X, Minimize2 } from "lucide-react";

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

const GameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [iframeSize, setIframeSize] = useState({ width: 900, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [useDirectUrl, setUseDirectUrl] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);


  useEffect(() => {
    if (id) {
      fetchGame();
      checkIfLiked();
      fetchComments();
    }
  }, [id]);

  // Helper function to decode HTML entities
  const decodeHtmlEntities = (html: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  };

  // Simple direct game loading - working version from 9:39 PM
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
      // Direct URL loading - no proxy
      setHtmlContent(game.game_url);
      setUseDirectUrl(true);
    }
    
    setIsLoadingGame(false);
    setIframeBlocked(false);
  }, [game?.game_url]);

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id);

      if (error) throw error;
      
      // Handle both array and single object responses
      const gameData = Array.isArray(data) ? data[0] : data;
      
      if (!gameData) {
        throw new Error('Game not found');
      }

      console.log('Game data fetched:', gameData);
      console.log('Game URL:', gameData.game_url);
      
      // Set game first to ensure we have the data
      setGame(gameData);
      
      // Fetch creator profile with avatar if creator_id exists
      if (gameData.creator_id) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('user_id', gameData.creator_id);
          
          const profile = Array.isArray(profileData) ? profileData[0] : profileData;
          
          // Update with avatar
          setGame(prev => prev ? {
            ...prev,
            creator_avatar: profile?.avatar_url
          } : null);
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          // Continue without avatar - game is already set
        }
      }
    } catch (error) {
      console.error('Error fetching game:', error);
      toast.error("Failed to load game");
      navigate('/games');
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    try {
      const { data: userData } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (!userData || userData.length === 0) return;

      const { data } = await supabase
        .from('game_likes')
        .select('id')
        .eq('game_id', id)
        .eq('user_id', userData[0].user_id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      // User hasn't liked the game
    }
  };

  useEffect(() => {
    // Increment play count when game loads
    if (game?.id) {
      incrementPlayCount();
    }
  }, [game?.id]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeDirection) return;
      
      setIframeSize(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;

        if (resizeDirection.includes('right')) {
          newWidth = Math.max(400, prev.width + e.movementX);
        }
        if (resizeDirection.includes('left')) {
          newWidth = Math.max(400, prev.width - e.movementX);
        }
        if (resizeDirection.includes('bottom')) {
          newHeight = Math.max(300, prev.height + e.movementY);
        }
        if (resizeDirection.includes('top')) {
          newHeight = Math.max(300, prev.height - e.movementY);
        }

        return { width: newWidth, height: newHeight };
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection]);

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    
    if (direction.includes('right') || direction.includes('left')) {
      document.body.style.cursor = 'ew-resize';
    } else if (direction.includes('top') || direction.includes('bottom')) {
      document.body.style.cursor = 'ns-resize';
    }
    
    if (direction === 'top-left' || direction === 'bottom-right') {
      document.body.style.cursor = 'nwse-resize';
    }
    if (direction === 'top-right' || direction === 'bottom-left') {
      document.body.style.cursor = 'nesw-resize';
    }
  };

  const incrementPlayCount = async () => {
    try {
      const { data, error } = await supabase.rpc('increment_game_plays', {
        _game_id: id
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newPlayCount = data[0].plays;
        setGame(prev => prev ? { ...prev, plays: newPlayCount } : null);
        console.log('Play count incremented to:', newPlayCount);
      }
    } catch (error) {
      console.error('Error updating play count:', error);
    }
  };

  const handleLike = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please login to like games");
      navigate('/login');
      return;
    }

    try {
      const { data: result } = await supabase.rpc('toggle_game_like', {
        _game_id: id,
        _user_id: (await supabase.rpc('get_user_by_session', {
          _session_token: sessionToken
        })).data[0].user_id
      });

      if (result) {
        setIsLiked(result.is_liked);
        setGame(prev => prev ? { ...prev, likes: result.like_count } : null);
        toast.success(result.is_liked ? "Game liked!" : "Like removed");
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like");
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };


  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleIframeLoad = () => {
    console.log('[IFRAME] Load event fired');
    console.log('[IFRAME] Current src:', iframeRef.current?.src);
    console.log('[IFRAME] Current srcDoc:', iframeRef.current?.srcdoc?.substring(0, 100));
    setIframeBlocked(false);
    setIsLoadingGame(false);
  };

  const handleIframeError = (e: any) => {
    console.error('[IFRAME] Error event fired:', e);
    console.error('[IFRAME] Current src:', iframeRef.current?.src);
    setIframeBlocked(true);
    setIsLoadingGame(false);
    setLoadError('Game failed to load - may be blocked by host');
  };

  const handleOpenInNewTab = () => {
    if (game?.game_url) {
      window.open(game.game_url, '_blank', 'noopener,noreferrer');
      toast.success('Game opened in new tab!');
    }
  };



  const fetchComments = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      setComments([]);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_game_comments_with_profiles', {
        _game_id: id,
        _session_token: sessionToken
      });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      console.log('Fetched comments with profiles:', data);
      
      // Transform the data to match the expected structure
      const commentsWithProfiles = (data || []).map(comment => ({
        id: comment.id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        is_deleted: comment.is_deleted,
        profiles: {
          username: comment.username,
          avatar_url: comment.avatar_url
        }
      }));
      
      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error in fetchComments:', error);
      toast.error("Failed to load comments");
    }
  };


  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      toast.error("Please login to comment");
      navigate('/login');
      return;
    }

    setSubmittingComment(true);
    try {
      const { error } = await supabase.rpc('insert_game_comment', {
        _session_token: sessionToken,
        _game_id: id,
        _content: newComment.trim()
      });

      if (error) throw error;

      setNewComment("");
      toast.success("Comment posted!");
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading game...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fullscreen Game View */}
      {isFullscreen && game?.game_url && (
        <>
          <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary/90 to-purple-600/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between shadow-lg">
            <h1 className="text-2xl font-bold text-white">
              🎮 {game.title}
            </h1>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleExitFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Minimize2 className="w-4 h-4 mr-2" />
                Exit Fullscreen
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleExitFullscreen}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <iframe
            ref={iframeRef}
            src={useDirectUrl ? htmlContent : undefined}
            srcDoc={!useDirectUrl ? htmlContent : undefined}
            title={game.title}
            className="fixed inset-0 w-screen h-screen z-[99] border-none"
            style={{ paddingTop: '64px' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="no-referrer"
            loading="eager"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </>
      )}

      {!isFullscreen && (
        <>
          <Navigation />
          
          <div className="container mx-auto px-4 py-12 relative z-10 max-w-[100vw] flex flex-col items-center">
        {/* Back Button */}
        <div className="w-full max-w-7xl mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/games')}
            className="gap-2 hover-scale hover-glow"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Button>
        </div>

        {/* Header with Sidebar Toggle */}
        <div className="w-full max-w-7xl mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <Button
            onClick={() => setShowSidebar(!showSidebar)}
            size="lg"
            className="gap-2 bg-primary hover:bg-primary/90 text-lg px-6 py-6 shadow-lg"
          >
            {showSidebar ? (
              <>
                <ChevronRight className="w-5 h-5" />
                Hide Info
              </>
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                Show Info
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-8 w-full max-w-7xl">
          {/* Game Player - Centered */}
          <div className="flex-1 flex flex-col items-center gap-6">
            {game.game_url ? (
              <>
                 <div className="relative inline-block">
                   {isLoadingGame && (
                     <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-primary/50">
                       <div className="text-center space-y-4 max-w-md px-6">
                         <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                         <h3 className="text-2xl font-bold gradient-text-animated">Loading Game...</h3>
                         <p className="text-muted-foreground">
                           Fetching game content through proxy server
                         </p>
                       </div>
                     </div>
                   )}
                   
                   {iframeBlocked && !isLoadingGame && (
                     <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-destructive">
                       <div className="text-center space-y-4 max-w-md px-6">
                         <div className="text-6xl">🚫</div>
                         <h3 className="text-2xl font-bold text-destructive">Game Cannot Load</h3>
                         <p className="text-muted-foreground">
                           {loadError || 'This game cannot be embedded due to security restrictions from the host website.'}
                         </p>
                         <Button
                           onClick={handleOpenInNewTab}
                           size="lg"
                           className="gap-2"
                         >
                           <Maximize2 className="w-5 h-5" />
                           Open in New Tab
                         </Button>
                       </div>
                     </div>
                   )}
                   
                   {!isFullscreen && (
                     <>
                       {/* Edge Resize Handles */}
                       <div
                         className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50 z-10"
                         onMouseDown={handleResizeStart('left')}
                       />
                      <div
                        className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50 z-10"
                        onMouseDown={handleResizeStart('right')}
                      />
                      <div
                        className="absolute left-0 right-0 -top-1 h-2 cursor-ns-resize hover:bg-primary/50 z-10"
                        onMouseDown={handleResizeStart('top')}
                      />
                      <div
                        className="absolute left-0 right-0 -bottom-1 h-2 cursor-ns-resize hover:bg-primary/50 z-10"
                        onMouseDown={handleResizeStart('bottom')}
                      />
                      
                      {/* Corner Handles */}
                      <div
                        className="absolute -left-1 -top-1 w-4 h-4 cursor-nwse-resize bg-primary hover:bg-primary/80 z-20 rounded-full border-2 border-background"
                        onMouseDown={handleResizeStart('top-left')}
                      />
                      <div
                        className="absolute -right-1 -top-1 w-4 h-4 cursor-nesw-resize bg-primary hover:bg-primary/80 z-20 rounded-full border-2 border-background"
                        onMouseDown={handleResizeStart('top-right')}
                      />
                      <div
                        className="absolute -left-1 -bottom-1 w-4 h-4 cursor-nesw-resize bg-primary hover:bg-primary/80 z-20 rounded-full border-2 border-background"
                        onMouseDown={handleResizeStart('bottom-left')}
                      />
                      <div
                        className="absolute -right-1 -bottom-1 w-4 h-4 cursor-nwse-resize bg-primary hover:bg-primary/80 z-20 rounded-full border-2 border-background"
                        onMouseDown={handleResizeStart('bottom-right')}
                      />
                    </>
                  )}

                    {!iframeBlocked && htmlContent && (
                      <iframe
                        ref={iframeRef}
                        src={useDirectUrl ? htmlContent : undefined}
                        srcDoc={!useDirectUrl ? htmlContent : undefined}
                        title={game.title}
                        className="border-2 border-primary/20 rounded-lg shadow-2xl"
                        style={{
                          width: `${iframeSize.width}px`,
                          height: `${iframeSize.height}px`,
                        }}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                        loading="eager"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                      />
                    )}
                   {(iframeBlocked || !htmlContent) && (
                     <div 
                       className="border-2 border-primary/20 rounded-lg shadow-2xl bg-background/50 flex items-center justify-center"
                       style={{
                         width: `${iframeSize.width}px`,
                         height: `${iframeSize.height}px`,
                       }}
                     >
                       <div className="text-muted-foreground text-lg">Loading game...</div>
                     </div>
                   )}
                </div>

                 {/* Control Buttons */}
                 <div className="flex gap-4 w-full max-w-md">
                   <Button onClick={handleFullscreen} size="lg" className="gap-2 flex-1">
                     <Maximize2 className="w-5 h-5" />
                     Fullscreen
                   </Button>
                   <Button onClick={handleOpenInNewTab} size="lg" variant="outline" className="gap-2 flex-1">
                     <Maximize2 className="w-5 h-5" />
                     New Tab
                   </Button>
                 </div>

                {/* Comments Section */}
                <Card className="w-full max-w-4xl">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 text-xl">Comments ({comments.length})</h3>
                    
                    {/* Comment Input */}
                    <div className="mb-6 space-y-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="resize-none"
                        rows={3}
                      />
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || submittingComment}
                        className="w-full gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {submittingComment ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No comments yet. Be the first to comment!
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-all duration-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              {comment.profiles?.avatar_url ? (
                                <img
                                  src={comment.profiles.avatar_url}
                                  alt={comment.profiles.username || 'User'}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                                  style={{ aspectRatio: '1/1' }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/20 flex-shrink-0">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    {comment.profiles?.username || 'Anonymous'}
                                    {comment.profiles?.username === 'wild' && (
                                      <span className="inline-flex items-center text-yellow-500" title="Admin">
                                        👑
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-foreground ml-[52px] leading-relaxed">{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
                <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No game URL available</p>
              </div>
            )}
          </div>

          {/* Sliding Sidebar */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              showSidebar ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'
            }`}
          >
            <Card className="h-full">
              <CardContent className="pt-6 space-y-6">
                {/* Action Buttons */}
                <div className="flex gap-2 pb-4 border-b border-border">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    className="flex-1"
                    onClick={handleLike}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>


                {/* Genre Badge */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                    {game.genre}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {game.description || "No description available"}
                  </p>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <User className="w-4 h-4" />
                      <span>Creator</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {game.creator_avatar ? (
                        <img
                          src={game.creator_avatar}
                          alt={game.creator_name}
                          className="w-6 h-6 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      <span className="text-sm font-medium">{game.creator_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Max Players</span>
                    <span className="text-sm font-medium">{game.max_players}</span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Likes</span>
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      {game.likes}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plays</span>
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      {game.plays}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default GameDetail;
