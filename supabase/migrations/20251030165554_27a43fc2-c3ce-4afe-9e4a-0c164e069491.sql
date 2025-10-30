-- Enable full row data capture for real-time updates
ALTER TABLE public.games REPLICA IDENTITY FULL;