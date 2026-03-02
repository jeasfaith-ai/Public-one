-- SQL to ensure the transactions table is correctly set up for recording debits
-- Run this in your Supabase SQL Editor

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    reference TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow the service role (backend) to insert transactions
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.transactions;
CREATE POLICY "Service role can insert transactions" ON public.transactions
    FOR INSERT
    WITH CHECK (true);

-- Ensure users table has balance and project_credits columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS project_credits INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_free_access BOOLEAN DEFAULT false;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

-- Example of how to manually record a debit (for testing)
-- INSERT INTO public.transactions (user_id, amount, status, reference)
-- VALUES ('user-uuid-here', -10000.00, 'successful', 'Project Generation Debit');
