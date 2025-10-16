-- Create a function to automatically create profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically create a profile for new users
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (NEW.id, NEW.username, NEW.username)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON public.user_auth;

-- Create trigger to automatically create profiles on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON public.user_auth
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Update RLS policies for profiles to be simpler and more secure
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

-- Profiles are created automatically via trigger, so no manual INSERT needed
CREATE POLICY "Profiles are auto-created only"
ON public.profiles
FOR INSERT
WITH CHECK (false);

-- Users can view all profiles (for seeing other users' info)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_sessions
    WHERE session_token = current_setting('app.session_token', true)
    AND expires_at > now()
  )
);

-- Users can only update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (
  user_id = get_current_user_from_token(current_setting('app.session_token', true))
)
WITH CHECK (
  user_id = get_current_user_from_token(current_setting('app.session_token', true))
);