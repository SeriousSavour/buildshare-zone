-- Fix delete_game_with_context to use correct admin_audit_log columns
DROP FUNCTION IF EXISTS delete_game_with_context(text, uuid);

CREATE OR REPLACE FUNCTION delete_game_with_context(
  _session_token text,
  _game_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_username text;
  v_creator_id uuid;
  v_game_title text;
  v_creator_name text;
BEGIN
  SELECT user_id INTO v_user_id
  FROM user_sessions
  WHERE session_token = _session_token AND expires_at > now();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  SELECT username INTO v_username FROM profiles WHERE user_id = v_user_id;
  SELECT creator_id, title, creator_name INTO v_creator_id, v_game_title, v_creator_name
  FROM games WHERE id = _game_id;
  
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;
  
  IF v_creator_id != v_user_id AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'You do not have permission to delete this game';
  END IF;
  
  -- Log admin action (only use columns that exist in admin_audit_log table)
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'admin') THEN
    INSERT INTO admin_audit_log (
      admin_user_id, action, target_user_id, target_resource_id, details
    ) VALUES (
      v_user_id, 'delete_game', v_creator_id, _game_id,
      jsonb_build_object(
        'game_title', v_game_title, 
        'creator_name', v_creator_name,
        'admin_username', v_username
      )
    );
  END IF;
  
  DELETE FROM games WHERE id = _game_id;
  
  RETURN true;
END;
$$;