-- Create user_consents table for tracking legal consents
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_auth(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'cookie', 'age_verification', 'terms', 'privacy'
  ip_address TEXT,
  user_agent TEXT,
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX idx_user_consents_type ON public.user_consents(consent_type);
CREATE INDEX idx_user_consents_created_at ON public.user_consents(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Only admins can view all consents
CREATE POLICY "Admins can view all consents" 
ON public.user_consents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (
      SELECT user_id FROM public.user_sessions 
      WHERE session_token = current_setting('app.session_token', true)
      AND expires_at > now()
    )
    AND role = 'admin'
  )
);

-- Users can view their own consents
CREATE POLICY "Users can view own consents"
ON public.user_consents
FOR SELECT
USING (
  user_id = (
    SELECT user_id FROM public.user_sessions 
    WHERE session_token = current_setting('app.session_token', true)
    AND expires_at > now()
  )
);

-- Anyone can insert consents (for registration, cookie banner)
CREATE POLICY "Anyone can insert consents"
ON public.user_consents
FOR INSERT
WITH CHECK (true);

-- Create dmca_notices table
CREATE TABLE IF NOT EXISTS public.dmca_notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complainant_name TEXT NOT NULL,
  complainant_email TEXT NOT NULL,
  complainant_address TEXT,
  copyright_work_description TEXT NOT NULL,
  infringing_url TEXT NOT NULL,
  infringing_content_id UUID, -- Link to game, comment, etc.
  infringing_content_type TEXT, -- 'game', 'comment', 'profile', etc.
  good_faith_statement TEXT NOT NULL,
  accuracy_statement TEXT NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewing', 'approved', 'rejected', 'resolved'
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.user_auth(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_dmca_notices_status ON public.dmca_notices(status);
CREATE INDEX idx_dmca_notices_created_at ON public.dmca_notices(created_at DESC);
CREATE INDEX idx_dmca_notices_content ON public.dmca_notices(infringing_content_type, infringing_content_id);

-- Enable RLS
ALTER TABLE public.dmca_notices ENABLE ROW LEVEL SECURITY;

-- Only admins can view DMCA notices
CREATE POLICY "Admins can view DMCA notices" 
ON public.dmca_notices 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (
      SELECT user_id FROM public.user_sessions 
      WHERE session_token = current_setting('app.session_token', true)
      AND expires_at > now()
    )
    AND role = 'admin'
  )
);

-- Only admins can update DMCA notices
CREATE POLICY "Admins can update DMCA notices"
ON public.dmca_notices
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (
      SELECT user_id FROM public.user_sessions 
      WHERE session_token = current_setting('app.session_token', true)
      AND expires_at > now()
    )
    AND role = 'admin'
  )
);

-- Anyone can submit DMCA notices
CREATE POLICY "Anyone can submit DMCA notices"
ON public.dmca_notices
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_dmca_notices_updated_at
BEFORE UPDATE ON public.dmca_notices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();