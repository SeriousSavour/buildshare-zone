-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can view game images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload game images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update game images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete game images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view game files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload game files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update game files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete game files" ON storage.objects;

-- Create simplified storage policies for public game assets
-- Anyone can perform any operation on game-images bucket
CREATE POLICY "Public access to game images"
ON storage.objects FOR ALL
USING (bucket_id = 'game-images')
WITH CHECK (bucket_id = 'game-images');

-- Anyone can perform any operation on game-files bucket
CREATE POLICY "Public access to game files"
ON storage.objects FOR ALL
USING (bucket_id = 'game-files')
WITH CHECK (bucket_id = 'game-files');