-- Create quests table
CREATE TABLE public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  quest_type TEXT NOT NULL, -- 'create_game', 'like_games', 'play_games', 'add_friends', 'upload_avatar'
  requirement_count INTEGER NOT NULL DEFAULT 1,
  icon TEXT NOT NULL DEFAULT '🎯',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user quest progress table
CREATE TABLE public.user_quest_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

-- Enable RLS
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quests
CREATE POLICY "Everyone can view active quests"
ON public.quests FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage quests"
ON public.quests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.user_sessions us ON ur.user_id = us.user_id
    WHERE ur.role = 'admin' AND us.expires_at > now()
  )
);

-- RLS Policies for user_quest_progress
CREATE POLICY "Users can view their own quest progress"
ON public.user_quest_progress FOR SELECT
USING (user_id = get_current_user_from_token(current_setting('app.session_token', true)));

CREATE POLICY "Users can create their own quest progress"
ON public.user_quest_progress FOR INSERT
WITH CHECK (user_id = get_current_user_from_token(current_setting('app.session_token', true)));

CREATE POLICY "Users can update their own quest progress"
ON public.user_quest_progress FOR UPDATE
USING (user_id = get_current_user_from_token(current_setting('app.session_token', true)));

-- Create function to get leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  quests_completed INTEGER,
  total_xp INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COUNT(CASE WHEN uqp.completed = true THEN 1 END)::INTEGER as quests_completed,
    COALESCE(SUM(CASE WHEN uqp.completed = true THEN q.xp_reward ELSE 0 END), 0)::INTEGER as total_xp
  FROM public.profiles p
  LEFT JOIN public.user_quest_progress uqp ON p.user_id = uqp.user_id
  LEFT JOIN public.quests q ON uqp.quest_id = q.id
  GROUP BY p.user_id, p.username, p.display_name, p.avatar_url
  ORDER BY quests_completed DESC, total_xp DESC
  LIMIT _limit;
END;
$$;

-- Create function to update quest progress
CREATE OR REPLACE FUNCTION public.update_quest_progress(
  _user_id UUID,
  _quest_type TEXT,
  _increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _quest_id UUID;
  _requirement_count INTEGER;
  _current_progress INTEGER;
BEGIN
  -- Get active quest of this type
  SELECT id, requirement_count INTO _quest_id, _requirement_count
  FROM public.quests
  WHERE quest_type = _quest_type AND is_active = true
  LIMIT 1;
  
  IF _quest_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Upsert progress
  INSERT INTO public.user_quest_progress (user_id, quest_id, progress)
  VALUES (_user_id, _quest_id, _increment)
  ON CONFLICT (user_id, quest_id) 
  DO UPDATE SET 
    progress = user_quest_progress.progress + _increment,
    updated_at = now();
  
  -- Check if quest is completed
  SELECT progress INTO _current_progress
  FROM public.user_quest_progress
  WHERE user_id = _user_id AND quest_id = _quest_id;
  
  IF _current_progress >= _requirement_count THEN
    UPDATE public.user_quest_progress
    SET completed = true, completed_at = now()
    WHERE user_id = _user_id AND quest_id = _quest_id AND completed = false;
  END IF;
  
  RETURN true;
END;
$$;

-- Insert default quests
INSERT INTO public.quests (name, description, quest_type, requirement_count, xp_reward, icon) VALUES
  ('First Steps', 'Create your first game', 'create_game', 1, 50, '🎮'),
  ('Game Creator', 'Create 5 games', 'create_game', 5, 150, '🏆'),
  ('Social Butterfly', 'Like 10 games', 'like_games', 10, 75, '❤️'),
  ('Gaming Enthusiast', 'Play 20 games', 'play_games', 20, 100, '🎯'),
  ('Friend Maker', 'Add 3 friends', 'add_friends', 3, 60, '👥'),
  ('Profile Complete', 'Upload an avatar', 'upload_avatar', 1, 40, '📸');