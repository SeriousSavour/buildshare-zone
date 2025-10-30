-- Fix Slime Rancher image URL (missing slash and URL encode spaces)
UPDATE games 
SET image_url = 'https://ptmeykacgbrsmvcvwrpp.supabase.co/storage/v1/object/public/game-assets/game-images/images%20(6).webp',
    updated_at = now()
WHERE id = 'af9814cc-31b6-437e-9334-c18c6edbb04a';