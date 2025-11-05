-- Update create_secure_user_session to properly use pgcrypto functions
CREATE OR REPLACE FUNCTION public.create_secure_user_session(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_session_token TEXT;
  session_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate secure random session token using pgcrypto from extensions schema
  new_session_token := encode(extensions.gen_random_bytes(32), 'base64');
  
  -- Set expiry to 30 days from now
  session_expiry := now() + INTERVAL '30 days';
  
  -- Clean up expired sessions for this user
  DELETE FROM public.user_sessions
  WHERE user_id = _user_id AND expires_at < now();
  
  -- Insert new session
  INSERT INTO public.user_sessions (user_id, session_token, expires_at)
  VALUES (_user_id, new_session_token, session_expiry);
  
  RETURN new_session_token;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_secure_user_session(UUID) TO anon, authenticated;