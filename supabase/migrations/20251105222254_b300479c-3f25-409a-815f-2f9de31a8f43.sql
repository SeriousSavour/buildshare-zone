-- Grant execute permissions on authentication functions to anon role
GRANT EXECUTE ON FUNCTION public.hash_password(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_exists(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_user_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_secure_user_session(UUID) TO anon, authenticated;