-- Add user roles and permissions system

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'viewer';

-- Create user_permissions table for company-specific permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, company_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_company ON user_permissions(company_id);

-- Update existing users to have admin role for their companies
INSERT INTO user_permissions (user_id, company_id, role)
SELECT DISTINCT c.owner_id, c.id, 'admin'
FROM companies c
ON CONFLICT (user_id, company_id) DO NOTHING;

COMMENT ON TABLE user_permissions IS 'Company-specific user permissions';
COMMENT ON COLUMN user_permissions.role IS 'Roles: admin (full access), manager (read/write, no delete), viewer (read only)';
COMMENT ON COLUMN user_permissions.is_active IS 'Whether the user permission is active (can be used to deactivate users without deleting)';
