-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can view game images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload game images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update game images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete game images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view game files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload game files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update game files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete game files" ON storage.objects;

-- Create storage policies that work with custom session authentication
-- Allow anyone to read from game-images (public bucket)
CREATE POLICY "Anyone can view game images"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-images');

-- Allow users with valid session tokens to upload to game-images
CREATE POLICY "Authenticated users can upload game images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'game-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_sessions
    WHERE session_token = current_setting('app.session_token', true)
    AND expires_at > now()
  )
);

-- Allow users with valid session tokens to update their uploads in game-images
CREATE POLICY "Authenticated users can update game images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'game-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_sessions
    WHERE session_token = current_setting('app.session_token', true)
    AND expires_at > now()
  )
);

-- Allow users with valid session tokens to delete their uploads in game-images
CREATE POLICY "Authenticated users can delete game images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'game-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_sessions
    WHERE session_token = current_setting('app.session_token', true)
    AND expires_at > now()
  )
);

-- Allow anyone to read from game-files (public bucket)
CREATE POLICY "Anyone can view game files"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-files');

-- Allow users with valid session tokens to upload to game-files
CREATE POLICY "Authenticated users can upload game files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'game-files' 
  AND EXISTS (
    SELECT 1 FROM public.user_sessions
    WHERE session_token = current_setting('app.session_token', true)
    AND expires_at > now()
  )
);

-- Allow users with valid session tokens to update their uploads in game-files
CREATE POLICY "Authenticated users can update game files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'game-files' 
  AND EXISTS (
    SELECT 1 FROM public.user_sessions
    WHERE session_token = current_setting('app.session_token', true)
    AND expires_at > now()
  )
);

-- Allow users with valid session tokens to delete their uploads in game-files
CREATE POLICY "Authenticated users can delete game files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'game-files' 
  AND EXISTS (
    SELECT 1 FROM public.user_sessions
    WHERE session_token = current_setting('app.session_token', true)
    AND expires_at > now()
  )
);