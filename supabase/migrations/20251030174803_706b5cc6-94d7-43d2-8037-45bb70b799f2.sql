-- Update create_game_with_context to include category parameter
DROP FUNCTION IF EXISTS create_game_with_context(text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION create_game_with_context(
  _session_token text,
  _title text,
  _description text,
  _game_url text,
  _genre text,
  _max_players text,
  _image_url text DEFAULT NULL,
  _category text DEFAULT 'game'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_username text;
  v_game_id uuid;
BEGIN
  SELECT user_id, username INTO v_user_id, v_username
  FROM user_sessions
  WHERE session_token = _session_token
    AND expires_at > now();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  SELECT COALESCE(display_name, username) INTO v_username
  FROM profiles
  WHERE user_id = v_user_id;
  
  INSERT INTO games (
    title, description, game_url, genre, max_players, image_url, creator_id, creator_name, category
  ) VALUES (
    _title, _description, _game_url, _genre, _max_players, _image_url, v_user_id, v_username, _category
  ) RETURNING id INTO v_game_id;
  
  RETURN v_game_id;
END;
$$;