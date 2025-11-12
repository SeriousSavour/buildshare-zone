-- Fix validate_game_update to allow raw HTML content
CREATE OR REPLACE FUNCTION validate_game_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate title
  IF NOT public.validate_user_input(NEW.title, 100) THEN
    RAISE EXCEPTION 'Invalid game title: must be 1-100 characters and contain no script tags';
  END IF;
  
  -- Validate description if provided
  IF NEW.description IS NOT NULL AND NOT public.validate_user_input(NEW.description, 1000) THEN
    RAISE EXCEPTION 'Invalid game description: must be under 1000 characters and contain no script tags';
  END IF;
  
  -- Convert empty strings to NULL for URLs
  IF NEW.game_url IS NOT NULL AND trim(NEW.game_url) = '' THEN
    NEW.game_url := NULL;
  END IF;
  
  IF NEW.image_url IS NOT NULL AND trim(NEW.image_url) = '' THEN
    NEW.image_url := NULL;
  END IF;
  
  -- Validate game URL if provided and not empty
  -- Allow either raw HTML content OR valid HTTP/HTTPS URLs
  IF NEW.game_url IS NOT NULL AND trim(NEW.game_url) != '' THEN
    -- Check if it's raw HTML (starts with < or contains DOCTYPE/html tags)
    DECLARE
      v_trimmed text := trim(NEW.game_url);
      v_is_html boolean := (
        v_trimmed LIKE '<%' OR 
        v_trimmed LIKE '%<!DOCTYPE%' OR 
        v_trimmed LIKE '%<html%' OR
        v_trimmed LIKE '%&lt;%' OR
        v_trimmed LIKE '%&lt;!DOCTYPE%' OR
        v_trimmed LIKE '%&lt;html%'
      );
    BEGIN
      -- If it's NOT HTML, validate as URL
      IF NOT v_is_html THEN
        IF length(NEW.game_url) > 500 OR 
           NOT (NEW.game_url LIKE 'http://%' OR NEW.game_url LIKE 'https://%') THEN
          RAISE EXCEPTION 'Invalid game URL: must be a valid HTTP/HTTPS URL under 500 characters or raw HTML content';
        END IF;
      END IF;
      -- If it IS HTML, allow any length (we're storing the full HTML game)
    END;
  END IF;
  
  -- Validate image URL if provided and not empty
  IF NEW.image_url IS NOT NULL AND trim(NEW.image_url) != '' THEN
    IF length(NEW.image_url) > 500 OR 
       NOT (NEW.image_url LIKE 'http://%' OR NEW.image_url LIKE 'https://%') THEN
      RAISE EXCEPTION 'Invalid image URL: must be a valid HTTP/HTTPS URL under 500 characters';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path TO 'public';
