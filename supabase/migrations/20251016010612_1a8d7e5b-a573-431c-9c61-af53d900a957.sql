-- Create tools table
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🔧',
  category TEXT NOT NULL DEFAULT 'General',
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Everyone can view tools
CREATE POLICY "Everyone can view tools"
ON public.tools
FOR SELECT
USING (true);

-- Authenticated users can create tools
CREATE POLICY "Authenticated users can create tools"
ON public.tools
FOR INSERT
WITH CHECK (
  get_current_user_from_token(current_setting('app.session_token', true)) IS NOT NULL
);

-- Authenticated users can update tools
CREATE POLICY "Authenticated users can update tools"
ON public.tools
FOR UPDATE
USING (
  get_current_user_from_token(current_setting('app.session_token', true)) IS NOT NULL
);

-- Authenticated users can delete tools
CREATE POLICY "Authenticated users can delete tools"
ON public.tools
FOR DELETE
USING (
  get_current_user_from_token(current_setting('app.session_token', true)) IS NOT NULL
);

-- Create trigger for updated_at
CREATE TRIGGER update_tools_updated_at
BEFORE UPDATE ON public.tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();