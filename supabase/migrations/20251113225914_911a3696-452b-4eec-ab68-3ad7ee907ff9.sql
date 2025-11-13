-- Clear all copyrighted game content and related data
-- This removes all games to start fresh with only properly licensed content

-- Delete all related data first (to avoid foreign key issues)
DELETE FROM game_comments;
DELETE FROM game_likes;
DELETE FROM game_progress;
DELETE FROM user_favorites;
DELETE FROM game_group_members;
DELETE FROM featured_game;

-- Now delete all games
DELETE FROM games;

-- Add a comment to the games table about licensing requirements
COMMENT ON TABLE games IS 'Only games with proper licensing should be added: open-source (MIT, CC), user-created original content, or games with explicit written permission from copyright holders.';