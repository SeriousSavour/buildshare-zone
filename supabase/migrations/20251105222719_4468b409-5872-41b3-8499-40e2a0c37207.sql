-- Reset the wild user's password with proper bcrypt hash
UPDATE public.user_auth
SET password_hash = public.hash_password('WildGames123!'),
    updated_at = now()
WHERE username = 'wild';