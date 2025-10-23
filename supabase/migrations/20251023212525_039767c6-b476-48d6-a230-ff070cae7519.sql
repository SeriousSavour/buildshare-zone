-- Create storage buckets for game assets (if they don't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('game-images', 'game-images', true),
  ('game-files', 'game-files', true)
ON CONFLICT (id) DO NOTHING;