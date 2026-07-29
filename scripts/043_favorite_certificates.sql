-- Favorite Certificates
CREATE TABLE IF NOT EXISTS favorite_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certificate_id UUID NOT NULL REFERENCES ship_certificates(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, certificate_id)
);

-- User Certificate View Preferences
CREATE TABLE IF NOT EXISTS user_certificate_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  view_mode VARCHAR(20) DEFAULT 'table', -- 'table' or 'card'
  sort_by VARCHAR(50) DEFAULT 'certificate_name',
  sort_order VARCHAR(10) DEFAULT 'asc',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_certificates_user ON favorite_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_certificates_certificate ON favorite_certificates(certificate_id);
