-- Add custom permissions table for granular access control
CREATE TABLE IF NOT EXISTS custom_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL, -- ships, fixtures, voyages, invoices, reports, users
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  data_scope VARCHAR(20) DEFAULT 'all', -- all, own, department
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, company_id, module)
);

CREATE INDEX idx_custom_permissions_user ON custom_permissions(user_id, company_id);
CREATE INDEX idx_custom_permissions_module ON custom_permissions(module);
