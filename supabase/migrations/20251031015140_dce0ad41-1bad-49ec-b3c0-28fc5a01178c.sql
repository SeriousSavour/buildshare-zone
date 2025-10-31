-- Drop existing policies that use auth.uid()
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Admins can update bug reports" ON public.bug_reports;

-- Create new policies using session-based authentication
CREATE POLICY "Admins can view all contact messages"
ON public.contact_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.user_sessions us ON ur.user_id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.expires_at > now()
    AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.user_sessions us ON ur.user_id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.expires_at > now()
    AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can view all bug reports"
ON public.bug_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.user_sessions us ON ur.user_id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.expires_at > now()
    AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can update bug reports"
ON public.bug_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.user_sessions us ON ur.user_id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.expires_at > now()
    AND ur.role = 'admin'::app_role
  )
);