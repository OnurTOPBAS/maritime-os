-- Add templates, tags, notes, and version history support

-- Templates table
CREATE TABLE IF NOT EXISTS voyage_calc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Template data (same structure as calculation)
  ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
  ship_name VARCHAR(255),
  service_speed DECIMAL(5,2),
  running_cost_per_day DECIMAL(12,2),
  fuel_consumption JSONB DEFAULT '{}'::jsonb,
  fo_price DECIMAL(10,2),
  mgo_price DECIMAL(10,2),
  
  -- Template legs
  legs JSONB DEFAULT '[]'::jsonb,
  
  -- Template operations
  operations JSONB DEFAULT '{}'::jsonb,
  
  -- Template cost items
  cost_items JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add tags and notes to calculations
ALTER TABLE voyage_calculations ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE voyage_calculations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE voyage_calculations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft'; -- draft, approved, rejected

-- Version history table
CREATE TABLE IF NOT EXISTS voyage_calc_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID NOT NULL REFERENCES voyage_calculations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Snapshot of calculation data
  data JSONB NOT NULL,
  
  -- Change description
  change_description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voyage_calc_templates_user ON voyage_calc_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_voyage_calc_history_calculation ON voyage_calc_history(calculation_id);
CREATE INDEX IF NOT EXISTS idx_voyage_calculations_tags ON voyage_calculations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_voyage_calculations_status ON voyage_calculations(status);

-- RLS Policies
ALTER TABLE voyage_calc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_calc_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS voyage_calc_templates_user_policy ON voyage_calc_templates;
CREATE POLICY voyage_calc_templates_user_policy ON voyage_calc_templates
  FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

DROP POLICY IF EXISTS voyage_calc_history_user_policy ON voyage_calc_history;
CREATE POLICY voyage_calc_history_user_policy ON voyage_calc_history
  FOR ALL USING (
    calculation_id IN (
      SELECT id FROM voyage_calculations 
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );
