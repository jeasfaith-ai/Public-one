-- SQL Script to update database schema and ensure consistency

-- 1. Ensure 'reg_no' column exists in 'users' table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reg_no TEXT;

-- 2. Ensure 'details' column exists in 'projects' table and is JSONB
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS details JSONB;

-- 3. Create an index on the 'regNo' field within the 'details' JSONB column
-- This improves performance when checking for duplicate Registration Numbers
CREATE INDEX IF NOT EXISTS idx_projects_details_regno ON public.projects ((details->>'regNo'));

-- 4. (Optional) You might want to ensure email is unique if not already
ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);

-- 5. (Optional) Ensure project_credits and balance default to 0
ALTER TABLE public.users ALTER COLUMN project_credits SET DEFAULT 0;
ALTER TABLE public.users ALTER COLUMN balance SET DEFAULT 0;
