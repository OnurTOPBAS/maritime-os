-- Company Team Members System
-- Allows adding existing users to companies as team members

-- Company team members table
CREATE TABLE IF NOT EXISTS company_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_company ON company_team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON company_team_members(user_id);

-- Add role column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'viewer';
  END IF;
END $$;
