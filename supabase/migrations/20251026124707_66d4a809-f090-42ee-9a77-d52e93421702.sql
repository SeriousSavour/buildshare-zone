-- Fix Idle Ants image URL to point to correct storage location
UPDATE games 
SET image_url = 'https://ptmeykacgbrsmvcvwrpp.supabase.co/storage/v1/object/public/game-images/1761267247720-gqm71hj2c2o.jfif'
WHERE id = '4a049036-9fd9-4102-b1ec-9b4282d76f18';