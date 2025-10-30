-- Drop and recreate the function with proper column qualification
DROP FUNCTION IF EXISTS increment_game_plays(UUID);

-- Create function to increment game play count with qualified column names
CREATE OR REPLACE FUNCTION increment_game_plays(_game_id UUID)
RETURNS TABLE (plays INTEGER) AS $$
BEGIN
  -- Increment the play count
  UPDATE games
  SET plays = games.plays + 1
  WHERE id = _game_id;
  
  -- Return the updated play count with qualified column name
  RETURN QUERY
  SELECT games.plays
  FROM games
  WHERE games.id = _game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_game_plays TO authenticated, anon;