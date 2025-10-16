-- Create RPC function to fetch game comments with profiles
CREATE OR REPLACE FUNCTION get_game_comments_with_profiles(
  _game_id uuid,
  _session_token text
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  is_deleted boolean,
  username text,
  avatar_url text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set the session token for RLS policies
  PERFORM set_config('app.session_token', _session_token, true);
  
  -- Return comments with profile information
  RETURN QUERY
  SELECT 
    gc.id,
    gc.user_id,
    gc.content,
    gc.created_at,
    gc.is_deleted,
    COALESCE(p.username, 'Unknown User') as username,
    p.avatar_url
  FROM game_comments gc
  LEFT JOIN profiles p ON p.user_id = gc.user_id
  WHERE gc.game_id = _game_id
    AND gc.is_deleted = false
  ORDER BY gc.created_at DESC;
END;
$$;