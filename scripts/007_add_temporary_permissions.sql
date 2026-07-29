-- Temporary Permissions and Permission Approval System

-- Temporary permissions table
CREATE TABLE IF NOT EXISTS temporary_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permission requests table
CREATE TABLE IF NOT EXISTS permission_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT
);

-- Permission change history
CREATE TABLE IF NOT EXISTS permission_change_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id),
  change_type VARCHAR(50) NOT NULL, -- grant, revoke, modify
  permission_id UUID REFERENCES permissions(id),
  role_id UUID REFERENCES roles(id),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IP whitelist for access restriction
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ip_address VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_temporary_permissions_user ON temporary_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_temporary_permissions_expires ON temporary_permissions(expires_at);
CREATE INDEX IF NOT EXISTS idx_permission_requests_user ON permission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_permission_change_history_user ON permission_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_user ON ip_whitelist(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_company ON ip_whitelist(company_id);
