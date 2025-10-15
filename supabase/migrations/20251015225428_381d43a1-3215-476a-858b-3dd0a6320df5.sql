-- Fix critical security issues with RLS policies

-- 1. FIX: Restrict profiles table to authenticated users only
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

-- 2. FIX: Remove public read access from user_auth (should only be system)
DROP POLICY IF EXISTS "System functions can read user_auth" ON public.user_auth;
CREATE POLICY "System functions can read user_auth" 
ON public.user_auth 
FOR SELECT 
USING (false);  -- No one can read directly, only through security definer functions

-- 3. FIX: Restrict messages to room members only
DROP POLICY IF EXISTS "Enable message operations" ON public.messages;

CREATE POLICY "Room members can view messages" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_room_members crm
    JOIN public.user_sessions us ON crm.user_id = us.user_id
    WHERE crm.room_id = messages.room_id 
    AND us.session_token = current_setting('app.session_token', true)
    AND us.expires_at > now()
  )
);

CREATE POLICY "Room members can insert messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_room_members crm
    JOIN public.user_sessions us ON crm.user_id = us.user_id
    WHERE crm.room_id = messages.room_id 
    AND us.session_token = current_setting('app.session_token', true)
    AND us.expires_at > now()
  )
);

CREATE POLICY "Sender can update own messages" 
ON public.messages 
FOR UPDATE 
USING (
  sender_id = get_current_user_from_token(current_setting('app.session_token', true))
);

CREATE POLICY "Sender can delete own messages" 
ON public.messages 
FOR DELETE 
USING (
  sender_id = get_current_user_from_token(current_setting('app.session_token', true))
);

-- 4. FIX: Update function search paths for security
-- Update all functions to have proper search_path set
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.is_room_member(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.check_user_game_like(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.validate_password_strength(text) SET search_path = public;
ALTER FUNCTION public.get_active_guidelines() SET search_path = public;