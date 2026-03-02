-- SQL Script to ensure database schema is correct and columns have proper defaults
-- This fixes issues where missing columns or null values might cause eligibility check failures

-- 1. Ensure 'project_credits' and 'balance' exist in 'users' table with correct defaults
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS project_credits INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- 2. Ensure 'reg_no' exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reg_no TEXT;

-- 3. Ensure 'details' exists in 'projects' table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- 4. Update existing users to have 0 instead of NULL for credits and balance
UPDATE public.users SET project_credits = 0 WHERE project_credits IS NULL;
UPDATE public.users SET balance = 0 WHERE balance IS NULL;

-- 5. Ensure 'project_credits' column is not nullable
ALTER TABLE public.users ALTER COLUMN project_credits SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN balance SET NOT NULL;

-- 6. Add index for performance on regNo check
CREATE INDEX IF NOT EXISTS idx_projects_details_regno ON public.projects ((details->>'regNo'));
