-- Update credit value setting to 10000
INSERT INTO settings (key, value) VALUES ('credit_value_naira', '10000')
ON CONFLICT (key) DO UPDATE SET value = '10000';

-- Recalculate project_credits for all users based on their current balance
-- This ensures consistency with the new rate (1 credit per 10,000 Naira)
UPDATE users
SET project_credits = FLOOR(balance / 10000);
