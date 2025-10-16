-- Drop the overly restrictive profile creation policy
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

-- Create a proper policy that allows users to create their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  user_id = get_current_user_from_token(current_setting('app.session_token', true))
);