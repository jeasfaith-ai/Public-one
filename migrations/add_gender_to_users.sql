-- SQL to add gender column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Optional: Update existing users to have a default gender if needed
-- UPDATE users SET gender = 'Male' WHERE gender IS NULL;
