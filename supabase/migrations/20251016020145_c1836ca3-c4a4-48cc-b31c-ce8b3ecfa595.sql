-- Update the invalid username to be within the 30 character limit
UPDATE public.user_auth
SET username = substring(username, 1, 30)
WHERE length(username) > 30;

-- Now create profiles for all users without one
INSERT INTO public.profiles (user_id, username, display_name)
SELECT 
  ua.id,
  ua.username,
  ua.username
FROM public.user_auth ua
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = ua.id
)
ON CONFLICT (user_id) DO NOTHING;