-- Create site_settings table for customizable site configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.user_sessions us ON ur.user_id = us.user_id
    WHERE ur.role = 'admin'
    AND us.session_token = current_setting('app.session_token', true)
    AND us.expires_at > now()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.user_sessions us ON ur.user_id = us.user_id
    WHERE ur.role = 'admin'
    AND us.session_token = current_setting('app.session_token', true)
    AND us.expires_at > now()
  )
);

-- Insert default settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description)
VALUES 
  ('login_background', 'radial-gradient(ellipse at center, hsl(220 70% 10%) 0%, hsl(220 70% 5%) 50%, hsl(220 70% 2%) 100%)', 'css', 'Background style for login/register pages'),
  ('site_name', 'shadow', 'string', 'Site name displayed on login/register'),
  ('discord_invite', 'discord.gg/goshadow', 'string', 'Discord invite link')
ON CONFLICT (setting_key) DO NOTHING;