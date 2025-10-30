-- Drop existing function if it exists
DROP FUNCTION IF EXISTS increment_game_plays(UUID);

-- Create function to increment game play count
CREATE OR REPLACE FUNCTION increment_game_plays(_game_id UUID)
RETURNS TABLE (plays INTEGER) AS $$
BEGIN
  -- Increment the play count
  UPDATE games
  SET plays = plays + 1
  WHERE id = _game_id;
  
  -- Return the updated play count
  RETURN QUERY
  SELECT g.plays
  FROM games g
  WHERE g.id = _game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_game_plays TO authenticated, anon;