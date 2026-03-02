-- Ensure project_credits column exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS project_credits integer DEFAULT 0;

-- Sync credits with balance (1 Credit = 1000 Naira)
-- We cast to integer to be safe
UPDATE public.users SET project_credits = FLOOR(COALESCE(balance, 0) / 1000)::integer;
