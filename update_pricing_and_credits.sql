-- 1. Update the credit value to 10,000 Naira
INSERT INTO settings (key, value)
VALUES ('credit_value_naira', '10000')
ON CONFLICT (key) DO UPDATE SET value = '10000';

-- 2. Update project cost to 1 credit
INSERT INTO settings (key, value)
VALUES ('project_cost_credits', '1')
ON CONFLICT (key) DO UPDATE SET value = '1';

-- 3. Recalculate project credits for ALL users based on the new rate (1 credit = 10,000 Naira)
-- This ensures no one has extra credits from the old 1,000 rate.
UPDATE users
SET project_credits = FLOOR(balance / 10000);

-- 3.5 Update has_free_access based on the newly calculated project_credits, excluding admins
UPDATE users
SET has_free_access = (project_credits > 0)
WHERE is_admin = false OR is_admin IS NULL;

-- 4. Seed default pricing plans if they don't exist
INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 1, 10000
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 1);

INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 5, 50000
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 5);

INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 10, 100000
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 10);

INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 15, 150000
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 15);

-- 5. Ensure user columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reg_no TEXT;
