-- Fix the update_quest_progress function to properly track and complete quests
CREATE OR REPLACE FUNCTION public.update_quest_progress(
  _user_id uuid,
  _quest_type text,
  _increment integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _quest_id uuid;
  _requirement_count integer;
  _current_progress integer;
  _new_progress integer;
BEGIN
  -- Get the quest details
  SELECT id, requirement_count INTO _quest_id, _requirement_count
  FROM public.quests
  WHERE quest_type = _quest_type AND is_active = true
  LIMIT 1;
  
  IF _quest_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Insert or update progress
  INSERT INTO public.user_quest_progress (user_id, quest_id, progress, completed)
  VALUES (_user_id, _quest_id, _increment, false)
  ON CONFLICT (user_id, quest_id)
  DO UPDATE SET 
    progress = user_quest_progress.progress + _increment,
    updated_at = now();
  
  -- Get current progress
  SELECT progress INTO _current_progress
  FROM public.user_quest_progress
  WHERE user_id = _user_id AND quest_id = _quest_id;
  
  -- Check if quest should be completed
  IF _current_progress >= _requirement_count THEN
    UPDATE public.user_quest_progress
    SET 
      completed = true,
      completed_at = COALESCE(completed_at, now()),
      updated_at = now()
    WHERE user_id = _user_id 
      AND quest_id = _quest_id 
      AND completed = false;
    
    -- Return true if we just completed it
    RETURN FOUND;
  END IF;
  
  RETURN false;
END;
$function$;