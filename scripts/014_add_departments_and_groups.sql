-- Add departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, name)
);

-- Add user_departments junction table
CREATE TABLE IF NOT EXISTS user_departments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, department_id)
);

-- Add user_groups table
CREATE TABLE IF NOT EXISTS user_groups (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, name)
);

-- Add user_group_members junction table
CREATE TABLE IF NOT EXISTS user_group_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, group_id)
);

-- Add group_permissions table for group-based permissions
CREATE TABLE IF NOT EXISTS group_permissions (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, module)
);

CREATE INDEX idx_departments_company ON departments(company_id);
CREATE INDEX idx_user_departments_user ON user_departments(user_id);
CREATE INDEX idx_user_departments_dept ON user_departments(department_id);
CREATE INDEX idx_user_groups_company ON user_groups(company_id);
CREATE INDEX idx_user_group_members_user ON user_group_members(user_id);
CREATE INDEX idx_user_group_members_group ON user_group_members(group_id);
CREATE INDEX idx_group_permissions_group ON group_permissions(group_id);

-- Add department_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
