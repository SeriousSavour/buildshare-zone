-- Allow anyone to view basic profile information (avatars, usernames)
-- This is needed so game cards can show creator avatars even for non-logged-in users
CREATE POLICY "Anyone can view public profile info"
ON public.profiles
FOR SELECT
USING (true);