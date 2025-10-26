-- Copy the file reference from game-images bucket to game-assets bucket with proper path
-- This is a data fix for images that were uploaded to the wrong bucket

-- First, let's update any games that reference the old game-images bucket path
-- to use the correct game-assets/game-images path
UPDATE public.games
SET image_url = replace(
  image_url,
  'https://ptmeykacgbrsmvcvwrpp.supabase.co/storage/v1/object/public/game-images/',
  'https://ptmeykacgbrsmvcvwrpp.supabase.co/storage/v1/object/public/game-assets/game-images/'
)
WHERE image_url LIKE '%/game-images/%'
  AND image_url NOT LIKE '%/game-assets/game-images/%';