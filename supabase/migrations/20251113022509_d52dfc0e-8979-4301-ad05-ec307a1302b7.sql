-- Fix get_users_with_roles to return only one row per user
-- Priority: admin > developer > moderator > user
CREATE OR REPLACE FUNCTION public.get_users_with_roles(_admin_session_token text)
RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, created_at timestamp with time zone, role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _admin_user_id uuid;
BEGIN
  -- Verify the admin making the request
  SELECT us.user_id INTO _admin_user_id
  FROM public.user_sessions us
  WHERE us.session_token = _admin_session_token AND us.expires_at > now();
  
  IF _admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  -- Check if requester is admin
  IF NOT public.has_role(_admin_user_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can view user roles';
  END IF;
  
  -- Return all users with their highest priority role (using DISTINCT ON)
  RETURN QUERY
  SELECT DISTINCT ON (p.user_id)
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.created_at,
    COALESCE(ur.role, 'user'::app_role) as role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  ORDER BY p.user_id, 
    CASE ur.role
      WHEN 'admin' THEN 1
      WHEN 'developer' THEN 2
      WHEN 'moderator' THEN 3
      ELSE 4
    END,
    p.created_at DESC;
END;
$function$;