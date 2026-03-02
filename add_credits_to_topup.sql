-- Add project_credits column to top_up_requests table
ALTER TABLE top_up_requests ADD COLUMN IF NOT EXISTS project_credits INTEGER DEFAULT 0;
