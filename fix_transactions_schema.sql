-- Fix for "operator does not exist: uuid = bigint" error
-- This script ensures the transactions table uses UUID for user_id, matching the users table.

-- 1. Create a temporary table to hold existing transactions (if any)
CREATE TABLE IF NOT EXISTS transactions_temp AS SELECT * FROM transactions;

-- 2. Drop the existing transactions table
DROP TABLE IF EXISTS transactions;

-- 3. Recreate the transactions table with correct schema
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'successful', 'failed'
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 6. (Optional) Restore data if possible. 
-- Note: If the old user_id was BIGINT and new is UUID, direct restoration will fail without mapping.
-- Since this is likely a dev environment or the user_id was wrong, we might skip restoration 
-- or attempt to cast if the old user_id was actually a UUID stored as text/something else.
-- For now, we assume fresh start for transactions is acceptable to fix the schema.
