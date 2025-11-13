-- Create function to update site settings with proper session context
CREATE OR REPLACE FUNCTION update_site_setting(
  _session_token TEXT,
  _setting_key TEXT,
  _setting_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Set the session token in the context
  PERFORM set_config('app.session_token', _session_token, true);
  
  -- Verify user is admin
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN user_sessions us ON ur.user_id = us.user_id
    WHERE us.session_token = _session_token
      AND us.expires_at > NOW()
      AND ur.role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Update the setting
  UPDATE site_settings
  SET 
    setting_value = _setting_value,
    updated_at = NOW()
  WHERE setting_key = _setting_key;
  
  RETURN TRUE;
END;
$$;