-- Add blocked words for content moderation
INSERT INTO public.blocked_words (word, severity)
VALUES 
  ('wyllie', 'moderate'),
  ('wylie', 'moderate'),
  ('willy', 'moderate'),
  ('wiley', 'moderate'),
  ('greenburger', 'moderate')
ON CONFLICT (word) DO NOTHING;