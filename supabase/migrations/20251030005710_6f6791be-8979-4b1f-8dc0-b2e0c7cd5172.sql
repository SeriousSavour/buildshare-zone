-- Update Slime Rancher with full URL to local hosted image
UPDATE games 
SET image_url = 'https://8a39c257-20fc-4d44-8e74-5ca088ab48e9.lovableproject.com/images/games/slime-rancher.webp',
    updated_at = now()
WHERE id = 'af9814cc-31b6-437e-9334-c18c6edbb04a';