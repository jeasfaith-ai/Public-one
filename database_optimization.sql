-- OPTIMIZATION SCRIPT FOR STRESS NO MORE
-- Run this to ensure maximum database performance

-- 1. Ensure Indexes exist (if not already created)
CREATE INDEX IF NOT EXISTS idx_projects_details_regno ON public.projects ((details->>'regNo'));
CREATE INDEX IF NOT EXISTS idx_projects_details_surname ON public.projects ((details->>'surname'));
CREATE INDEX IF NOT EXISTS idx_users_reg_no ON public.users (reg_no);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 2. Vacuum Analyze to update statistics for the query planner
VACUUM ANALYZE public.users;
VACUUM ANALYZE public.projects;
VACUUM ANALYZE public.transactions;

-- 3. Optimize Settings Table access
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
