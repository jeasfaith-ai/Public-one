-- Add project_credits and balance columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS project_credits INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;
