-- Add favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'ship', 'fixture', 'voyage', 'invoice', 'company'
  entity_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, entity_type, entity_id)
);

-- Add recent items table
CREATE TABLE IF NOT EXISTS recent_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_name VARCHAR(255),
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, entity_type, entity_id)
);

-- Add user preferences table (extended)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
  language VARCHAR(10) DEFAULT 'tr', -- 'tr', 'en'
  timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h', -- '12h', '24h'
  currency VARCHAR(10) DEFAULT 'USD',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_entity ON favorites(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_recent_items_user_id ON recent_items(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_items_viewed_at ON recent_items(viewed_at DESC);
