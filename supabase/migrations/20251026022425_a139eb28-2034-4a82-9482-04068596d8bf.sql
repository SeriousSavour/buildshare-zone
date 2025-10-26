-- Fix the image URL to point to where the file actually exists
UPDATE public.games
SET image_url = 'https://ptmeykacgbrsmvcvwrpp.supabase.co/storage/v1/object/public/game-images/1761444392660-nt8jtc2exc.webp'
WHERE title = '2048' AND id = '4d95a92f-7f23-4ffb-980c-549de5bf22e3';