-- Create password hashing function
CREATE OR REPLACE FUNCTION public.hash_password(_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(_password, gen_salt('bf', 10));
END;
$$;

-- Create function to check if username exists
CREATE OR REPLACE FUNCTION public.check_username_exists(_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_auth WHERE username = _username
  ) INTO user_exists;
  
  RETURN user_exists;
END;
$$;

-- Create function to validate user login
CREATE OR REPLACE FUNCTION public.validate_user_login(_username TEXT, _password TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_result UUID;
  stored_hash TEXT;
BEGIN
  -- Get user id and password hash
  SELECT id, password_hash INTO user_id_result, stored_hash
  FROM public.user_auth
  WHERE username = _username AND is_active = true;
  
  -- Check if user exists and password matches
  IF user_id_result IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verify password using crypt
  IF stored_hash = crypt(_password, stored_hash) THEN
    RETURN user_id_result;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Create function to create secure user session
CREATE OR REPLACE FUNCTION public.create_secure_user_session(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_session_token TEXT;
  session_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate secure random session token
  new_session_token := encode(gen_random_bytes(32), 'base64');
  
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

-- Grant execute permissions to anon role for public functions
GRANT EXECUTE ON FUNCTION public.hash_password(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_user_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_secure_user_session(UUID) TO anon;