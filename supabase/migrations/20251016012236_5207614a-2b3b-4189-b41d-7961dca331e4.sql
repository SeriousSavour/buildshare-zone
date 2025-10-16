-- Enable realtime for game_comments table
ALTER TABLE public.game_comments REPLICA IDENTITY FULL;

-- Add game_comments to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_comments;