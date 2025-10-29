-- Allow anyone to submit bug reports and contact messages (public forms)
CREATE POLICY "Anyone can submit bug reports"
ON public.bug_reports FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);