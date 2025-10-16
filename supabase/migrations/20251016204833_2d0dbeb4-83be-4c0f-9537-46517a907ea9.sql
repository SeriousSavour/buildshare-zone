-- Ensure wild user exists and is admin
DO $$
DECLARE
  wild_user_id uuid;
BEGIN
  -- Get or create wild user
  SELECT id INTO wild_user_id
  FROM public.user_auth
  WHERE username = 'wild';
  
  -- If wild user doesn't exist, create it
  IF wild_user_id IS NULL THEN
    INSERT INTO public.user_auth (username, password_hash)
    VALUES ('wild', public.hash_password('WildGames123!'))
    RETURNING id INTO wild_user_id;
    
    -- Create profile for wild
    INSERT INTO public.profiles (user_id, username, display_name)
    VALUES (wild_user_id, 'wild', 'Wild Admin');
  END IF;
  
  -- Ensure wild has admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (wild_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Wild user admin status confirmed: %', wild_user_id;
END $$;