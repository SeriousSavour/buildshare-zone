-- Update hash_password to properly use pgcrypto
CREATE OR REPLACE FUNCTION public.hash_password(_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.crypt(_password, extensions.gen_salt('bf', 10));
END;
$$;

-- Update validate_user_login to properly use pgcrypto
CREATE OR REPLACE FUNCTION public.validate_user_login(_username TEXT, _password TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  user_id_result UUID;
  stored_hash TEXT;
BEGIN
  -- Get user id and password hash
  SELECT id, password_hash INTO user_id_result, stored_hash
  FROM public.user_auth
  WHERE username = _username AND is_active = true;
  
  -- Check if user exists
  IF user_id_result IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verify password using crypt from pgcrypto
  IF stored_hash = extensions.crypt(_password, stored_hash) THEN
    RETURN user_id_result;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Grant execute permissions again
GRANT EXECUTE ON FUNCTION public.hash_password(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_user_login(TEXT, TEXT) TO anon, authenticated;