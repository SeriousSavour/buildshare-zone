-- Remove tracking data from user_guideline_acceptances
-- This eliminates IP address and user agent collection
ALTER TABLE public.user_guideline_acceptances 
  DROP COLUMN IF EXISTS ip_address,
  DROP COLUMN IF EXISTS user_agent;

-- Drop embedding_tracker table entirely
-- This was tracking URLs, referrers, and user agents
DROP TABLE IF EXISTS public.embedding_tracker CASCADE;

-- Update the RPC function to not accept tracking parameters
CREATE OR REPLACE FUNCTION public.accept_guideline(
  _guideline_id UUID,
  _guideline_version INTEGER,
  _user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert acceptance without any tracking data
  INSERT INTO public.user_guideline_acceptances (
    user_id,
    guideline_id,
    guideline_version,
    accepted_at
  ) VALUES (
    _user_id,
    _guideline_id,
    _guideline_version,
    now()
  );
END;
$$;

-- Clear any existing tracking data from audit logs (optional but recommended)
-- This removes details that might contain identifying information
UPDATE public.admin_audit_log 
SET details = '{}'::jsonb 
WHERE details IS NOT NULL 
  AND (
    details::text ILIKE '%ip%' 
    OR details::text ILIKE '%user_agent%'
    OR details::text ILIKE '%fingerprint%'
  );