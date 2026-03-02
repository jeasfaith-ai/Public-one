-- Ensure pricing_plans table exists
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  projects_count INTEGER NOT NULL,
  price_naira NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans if table is empty
INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 1, 1000 WHERE NOT EXISTS (SELECT 1 FROM pricing_plans);
INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 3, 2500 WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 3);
INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 5, 4000 WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 5);
INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 10, 7500 WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 10);

-- Enable RLS (Optional, good practice)
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to everyone (authenticated)
CREATE POLICY "Allow read access to authenticated users" ON pricing_plans
  FOR SELECT TO authenticated USING (true);

-- Policy: Allow all access to admins (assuming is_admin column in users table)
-- Note: This requires a helper function or direct check. 
-- For simplicity in this context, we might rely on backend logic (admin middleware).
-- But if RLS is on, we need policies for insert/update/delete.

-- Simple policy for now: Allow all for authenticated users if we rely on backend checks
-- OR better:
CREATE POLICY "Allow all access to admins" ON pricing_plans
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));
