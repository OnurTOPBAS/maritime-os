-- Widget preferences table for storing user-specific widget settings
CREATE TABLE IF NOT EXISTS widget_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_id VARCHAR(50) NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, widget_id)
);

CREATE INDEX IF NOT EXISTS idx_widget_preferences_user ON widget_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_preferences_widget ON widget_preferences(widget_id);
