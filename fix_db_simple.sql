-- Add used_free_defense column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS used_free_defense BOOLEAN DEFAULT FALSE;

-- Create index for faster RegNo lookups on users table
CREATE INDEX IF NOT EXISTS idx_users_regno ON users(reg_no);

-- Create index for faster Project RegNo lookups on projects table
-- Indexing the text value of regNo inside the details JSONB column
CREATE INDEX IF NOT EXISTS idx_projects_details_regno_text ON projects ((details->>'regNo'));
