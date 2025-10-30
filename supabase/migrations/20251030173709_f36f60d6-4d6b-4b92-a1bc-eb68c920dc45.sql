-- Drop existing functions first
DROP FUNCTION IF EXISTS create_game_with_context(text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS update_game_with_context(text, uuid, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS delete_game_with_context(text, uuid);

-- Create RPC function to create games with session context
CREATE OR REPLACE FUNCTION create_game_with_context(
  _session_token text,
  _title text,
  _description text,
  _game_url text,
  _genre text,
  _max_players text,
  _image_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_username text;
  v_game_id uuid;
BEGIN
  -- Validate session and get user info
  SELECT user_id, username INTO v_user_id, v_username
  FROM user_sessions
  WHERE session_token = _session_token
    AND expires_at > now();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  -- Get display name
  SELECT COALESCE(display_name, username) INTO v_username
  FROM profiles
  WHERE user_id = v_user_id;
  
  -- Create the game
  INSERT INTO games (
    title,
    description,
    game_url,
    genre,
    max_players,
    image_url,
    creator_id,
    creator_name
  ) VALUES (
    _title,
    _description,
    _game_url,
    _genre,
    _max_players,
    _image_url,
    v_user_id,
    v_username
  ) RETURNING id INTO v_game_id;
  
  RETURN v_game_id;
END;
$$;

-- Create RPC function to update games with session context
CREATE OR REPLACE FUNCTION update_game_with_context(
  _session_token text,
  _game_id uuid,
  _title text DEFAULT NULL,
  _description text DEFAULT NULL,
  _genre text DEFAULT NULL,
  _max_players text DEFAULT NULL,
  _game_url text DEFAULT NULL,
  _image_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_creator_id uuid;
BEGIN
  -- Validate session and get user ID
  SELECT user_id INTO v_user_id
  FROM user_sessions
  WHERE session_token = _session_token
    AND expires_at > now();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  -- Get the game's creator ID
  SELECT creator_id INTO v_creator_id
  FROM games
  WHERE id = _game_id;
  
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;
  
  -- Check if user is the creator or an admin
  IF v_creator_id != v_user_id AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'You do not have permission to update this game';
  END IF;
  
  -- Update the game (only update fields that are provided)
  UPDATE games
  SET
    title = COALESCE(_title, title),
    description = COALESCE(_description, description),
    genre = COALESCE(_genre, genre),
    max_players = COALESCE(_max_players, max_players),
    game_url = COALESCE(_game_url, game_url),
    image_url = COALESCE(_image_url, image_url),
    updated_at = now()
  WHERE id = _game_id;
  
  RETURN true;
END;
$$;

-- Create RPC function to delete games with session context
CREATE OR REPLACE FUNCTION delete_game_with_context(
  _session_token text,
  _game_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_username text;
  v_creator_id uuid;
  v_game_title text;
  v_creator_name text;
BEGIN
  -- Validate session and get user info
  SELECT user_id INTO v_user_id
  FROM user_sessions
  WHERE session_token = _session_token
    AND expires_at > now();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  -- Get username
  SELECT username INTO v_username
  FROM profiles
  WHERE user_id = v_user_id;
  
  -- Get the game details
  SELECT creator_id, title, creator_name INTO v_creator_id, v_game_title, v_creator_name
  FROM games
  WHERE id = _game_id;
  
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;
  
  -- Check if user is the creator or an admin
  IF v_creator_id != v_user_id AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'You do not have permission to delete this game';
  END IF;
  
  -- Log the deletion to audit_logs if it's an admin action
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'admin') THEN
    INSERT INTO admin_audit_log (
      admin_user_id,
      admin_username,
      action,
      target_user_id,
      target_username,
      target_resource_id,
      details
    ) VALUES (
      v_user_id,
      v_username,
      'delete_game',
      v_creator_id,
      v_creator_name,
      _game_id,
      jsonb_build_object(
        'game_title', v_game_title,
        'creator_name', v_creator_name
      )
    );
  END IF;
  
  -- Delete the game
  DELETE FROM games WHERE id = _game_id;
  
  RETURN true;
END;
$$;