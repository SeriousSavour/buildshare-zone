-- Create function to handle account deletion with proper cleanup
CREATE OR REPLACE FUNCTION delete_user_account(_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_username text;
BEGIN
  -- Get user ID from session
  SELECT user_id INTO v_user_id
  FROM user_sessions
  WHERE session_token = _session_token
    AND expires_at > now();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired session');
  END IF;

  -- Get username for logging
  SELECT username INTO v_username
  FROM user_auth
  WHERE id = v_user_id;

  -- Delete user data in correct order (respecting foreign keys)
  -- 1. Delete game progress
  DELETE FROM game_progress WHERE user_id = v_user_id;
  
  -- 2. Delete quest progress
  DELETE FROM user_quest_progress WHERE user_id = v_user_id;
  
  -- 3. Delete favorites
  DELETE FROM user_favorites WHERE user_id = v_user_id;
  
  -- 4. Delete game likes
  DELETE FROM game_likes WHERE user_id = v_user_id;
  
  -- 5. Delete game comments
  DELETE FROM game_comments WHERE user_id = v_user_id;
  
  -- 6. Delete messages
  DELETE FROM messages WHERE sender_id = v_user_id;
  
  -- 7. Delete chat room memberships
  DELETE FROM chat_room_members WHERE user_id = v_user_id;
  
  -- 8. Delete chat rooms created by user (if no other members)
  DELETE FROM chat_rooms 
  WHERE created_by = v_user_id 
    AND id NOT IN (SELECT room_id FROM chat_room_members);
  
  -- 9. Delete friendships
  DELETE FROM friends WHERE user_id = v_user_id OR friend_id = v_user_id;
  
  -- 10. Delete user preferences
  DELETE FROM user_preferences WHERE user_id = v_user_id;
  
  -- 11. Delete guideline acceptances
  DELETE FROM user_guideline_acceptances WHERE user_id = v_user_id;
  
  -- 12. Delete user consents
  DELETE FROM user_consents WHERE user_id = v_user_id;
  
  -- 13. Delete content flags
  DELETE FROM content_flags WHERE user_id = v_user_id;
  
  -- 14. Delete user warnings
  DELETE FROM user_warnings WHERE user_id = v_user_id;
  
  -- 15. Anonymize or delete games created by user (keep games but anonymize creator)
  UPDATE games 
  SET creator_id = '00000000-0000-0000-0000-000000000000'::uuid,
      creator_name = 'Deleted User'
  WHERE creator_id = v_user_id;
  
  -- 16. Delete user sessions
  DELETE FROM user_sessions WHERE user_id = v_user_id;
  
  -- 17. Delete user roles
  DELETE FROM user_roles WHERE user_id = v_user_id;
  
  -- 18. Delete profile
  DELETE FROM profiles WHERE user_id = v_user_id;
  
  -- 19. Finally delete user auth (this cascades properly now)
  DELETE FROM user_auth WHERE id = v_user_id;
  
  -- Log the deletion
  INSERT INTO admin_audit_log (admin_user_id, action, details)
  VALUES (
    v_user_id,
    'USER_ACCOUNT_DELETED',
    jsonb_build_object(
      'username', v_username,
      'deleted_at', now(),
      'self_deletion', true
    )
  );

  RETURN jsonb_build_object('success', true, 'message', 'Account successfully deleted');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;