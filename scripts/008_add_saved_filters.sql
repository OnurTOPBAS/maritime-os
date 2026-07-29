-- Add saved filters table
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'ships', 'fixtures', 'voyages', 'invoices'
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_filters_user ON saved_filters(user_id);
CREATE INDEX idx_saved_filters_entity ON saved_filters(entity_type);
