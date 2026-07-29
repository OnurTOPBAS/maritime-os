-- Add dashboard preferences table
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_order JSONB DEFAULT '["stats", "activity", "financial", "companies"]'::jsonb,
  visible_widgets JSONB DEFAULT '["stats", "activity", "financial", "companies"]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_dashboard_preferences_user ON dashboard_preferences(user_id);
