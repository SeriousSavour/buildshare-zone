-- Create a function to get the current user's profile with proper session context
CREATE OR REPLACE FUNCTION public.get_profile_by_session(_session_token text)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  -- Get user from session token
  SELECT us.user_id INTO _user_id
  FROM public.user_sessions us
  WHERE us.session_token = _session_token 
    AND us.expires_at > now();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Return the profile
  RETURN QUERY
  SELECT p.id, p.user_id, p.username, p.display_name, p.avatar_url, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.user_id = _user_id;
END;
$$;