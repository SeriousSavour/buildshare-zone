-- Drop the old accept_guidelines function that still accepts tracking parameters
DROP FUNCTION IF EXISTS public.accept_guidelines(uuid, uuid, integer, text, text);

-- Fix search_path for all functions that need it (security linter warning)
-- This ensures functions can't be tricked by malicious search_path manipulation

CREATE OR REPLACE FUNCTION public.validate_user_input(_input text, _max_length integer DEFAULT 255)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for null or empty
  IF _input IS NULL OR trim(_input) = '' THEN
    RETURN false;
  END IF;
  
  -- Check length
  IF length(_input) > _max_length THEN
    RETURN false;
  END IF;
  
  -- Check for script tags
  IF _input ~* '<script|javascript:|onerror=|onclick=' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Update get_current_user_id to have proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _session_token text;
BEGIN
  _session_token := current_setting('app.session_token', true);
  
  IF _session_token IS NOT NULL AND _session_token != '' THEN
    SELECT user_id INTO _user_id
    FROM public.user_sessions
    WHERE session_token = _session_token 
      AND expires_at > now();
      
    IF _user_id IS NOT NULL THEN
      RETURN _user_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Update auto_moderate_comment trigger function to have search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;