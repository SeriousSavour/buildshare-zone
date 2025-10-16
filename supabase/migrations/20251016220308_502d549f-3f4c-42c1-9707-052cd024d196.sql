-- Fix blocked_words RLS policy to use custom session tokens instead of auth.uid()

-- Drop existing policy
DROP POLICY IF EXISTS "Only admins can manage blocked words" ON public.blocked_words;

-- Create new policy using custom session token system
CREATE POLICY "Only admins can manage blocked words"
ON public.blocked_words
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.user_sessions us ON ur.user_id = us.user_id
    WHERE ur.role = 'admin'::app_role
      AND us.expires_at > now()
      AND us.session_token = current_setting('app.session_token', true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.user_sessions us ON ur.user_id = us.user_id
    WHERE ur.role = 'admin'::app_role
      AND us.expires_at > now()
      AND us.session_token = current_setting('app.session_token', true)
  )
);