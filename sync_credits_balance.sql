-- FIX: Sync project_credits with wallet balance for all users
-- This ensures that credits and balance are consistent (1 Credit = 1000 Naira)
-- The logic is: project_credits = floor(balance / 1000)

UPDATE public.users 
SET project_credits = FLOOR(COALESCE(balance, 0) / 1000);

-- Ensure project_credits is never null
UPDATE public.users 
SET project_credits = 0 
WHERE project_credits IS NULL;

-- Ensure balance is never null
UPDATE public.users 
SET balance = 0 
WHERE balance IS NULL;
