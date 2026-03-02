-- SQL to fix Login and Signup issues
-- Run this in your Supabase SQL Editor

-- 1. Add missing 'gender' column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;

-- 2. Handle empty strings in reg_no (convert to NULL to avoid unique constraint violations)
UPDATE public.users SET reg_no = NULL WHERE reg_no = '';

-- 3. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive policies for the custom auth server
-- Since the server uses the anon key, we need to allow it to perform operations
-- Note: In a production environment with Supabase Auth, you would use more restrictive policies.
-- But for this custom auth setup, the server needs full access.

DROP POLICY IF EXISTS "Allow all access" ON public.users;
DROP POLICY IF EXISTS "Allow public access" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.users;

CREATE POLICY "Allow all access" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 5. Ensure other tables are accessible
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access projects" ON public.projects;
CREATE POLICY "Allow all access projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access transactions" ON public.transactions;
CREATE POLICY "Allow all access transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access notifications" ON public.notifications;
CREATE POLICY "Allow all access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access support_tickets" ON public.support_tickets;
CREATE POLICY "Allow all access support_tickets" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access settings" ON public.settings;
CREATE POLICY "Allow all access settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access messages" ON public.messages;
CREATE POLICY "Allow all access messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access pricing_plans" ON public.pricing_plans;
CREATE POLICY "Allow all access pricing_plans" ON public.pricing_plans FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.top_up_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access top_up_requests" ON public.top_up_requests;
CREATE POLICY "Allow all access top_up_requests" ON public.top_up_requests FOR ALL USING (true) WITH CHECK (true);
