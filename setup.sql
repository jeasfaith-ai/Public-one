-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT,
  department TEXT,
  reg_no TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  balance NUMERIC DEFAULT 0,
  project_credits INTEGER DEFAULT 0,
  has_free_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='balance') THEN
        ALTER TABLE users ADD COLUMN balance NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='project_credits') THEN
        ALTER TABLE users ADD COLUMN project_credits INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='has_free_access') THEN
        ALTER TABLE users ADD COLUMN has_free_access BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='full_name') THEN
        ALTER TABLE users ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='department') THEN
        ALTER TABLE users ADD COLUMN department TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reg_no') THEN
        ALTER TABLE users ADD COLUMN reg_no TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='gender') THEN
        ALTER TABLE users ADD COLUMN gender TEXT;
    END IF;
END $$;

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('project_cost_credits', '1'),
('credit_value_naira', '1000'),
('paymentAmount', '5000'),
('pptPaymentAmount', '3000')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  projects_count INTEGER NOT NULL,
  price_naira NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing plans (only if table is empty to avoid duplicates)
INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 1, 1000 WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 1);
INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 3, 2500 WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 3);
INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 5, 4000 WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 5);
INSERT INTO pricing_plans (projects_count, price_naira)
SELECT 10, 7500 WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE projects_count = 10);

-- Create top_up_requests table
CREATE TABLE IF NOT EXISTS top_up_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT,
  email TEXT,
  transaction_id TEXT,
  amount NUMERIC NOT NULL,
  bank TEXT,
  account_name TEXT,
  project_credits INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  status TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table (for support)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  topic TEXT NOT NULL,
  content JSONB,
  details JSONB,
  is_premium_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
