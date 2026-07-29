-- Simple voyage calculator tables
-- Auto-created if not exists

CREATE TABLE IF NOT EXISTS voyage_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  
  -- Basic Info
  ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
  ship_name VARCHAR(255) NOT NULL,
  charterer VARCHAR(255),
  service_speed DECIMAL(5,2),
  running_cost_per_day DECIMAL(12,2),
  
  -- Fuel consumption (from ship or manual)
  fuel_consumption JSONB DEFAULT '{}'::jsonb,
  
  -- Calculated totals
  total_distance DECIMAL(10,2) DEFAULT 0,
  total_sea_days DECIMAL(10,2) DEFAULT 0,
  total_port_days DECIMAL(10,2) DEFAULT 0,
  total_days DECIMAL(10,2) DEFAULT 0,
  
  total_fo_consumption DECIMAL(10,2) DEFAULT 0,
  total_mgo_consumption DECIMAL(10,2) DEFAULT 0,
  
  fo_price DECIMAL(10,2) DEFAULT 0,
  mgo_price DECIMAL(10,2) DEFAULT 0,
  
  fuel_cost DECIMAL(12,2) DEFAULT 0,
  running_cost DECIMAL(12,2) DEFAULT 0,
  other_costs DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  
  total_revenue DECIMAL(12,2) DEFAULT 0,
  net_profit DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voyage_calc_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID NOT NULL REFERENCES voyage_calculations(id) ON DELETE CASCADE,
  leg_order INTEGER NOT NULL,
  
  from_port VARCHAR(255) NOT NULL,
  to_port VARCHAR(255) NOT NULL,
  distance_nm DECIMAL(10,2) NOT NULL,
  condition VARCHAR(50) NOT NULL, -- 'laden' or 'ballast'
  
  sea_days DECIMAL(10,2),
  fo_consumption DECIMAL(10,2),
  mgo_consumption DECIMAL(10,2),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voyage_calc_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID NOT NULL REFERENCES voyage_calculations(id) ON DELETE CASCADE,
  
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voyage_calc_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID NOT NULL REFERENCES voyage_calculations(id) ON DELETE CASCADE,
  
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voyage_calculations_user ON voyage_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_voyage_calc_legs_calculation ON voyage_calc_legs(calculation_id);
CREATE INDEX IF NOT EXISTS idx_voyage_calc_costs_calculation ON voyage_calc_costs(calculation_id);
CREATE INDEX IF NOT EXISTS idx_voyage_calc_revenues_calculation ON voyage_calc_revenues(calculation_id);

-- RLS Policies
ALTER TABLE voyage_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_calc_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_calc_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_calc_revenues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS voyage_calculations_user_policy ON voyage_calculations;
CREATE POLICY voyage_calculations_user_policy ON voyage_calculations
  FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

DROP POLICY IF EXISTS voyage_calc_legs_user_policy ON voyage_calc_legs;
CREATE POLICY voyage_calc_legs_user_policy ON voyage_calc_legs
  FOR ALL USING (
    calculation_id IN (
      SELECT id FROM voyage_calculations 
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );

DROP POLICY IF EXISTS voyage_calc_costs_user_policy ON voyage_calc_costs;
CREATE POLICY voyage_calc_costs_user_policy ON voyage_calc_costs
  FOR ALL USING (
    calculation_id IN (
      SELECT id FROM voyage_calculations 
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );

DROP POLICY IF EXISTS voyage_calc_revenues_user_policy ON voyage_calc_revenues;
CREATE POLICY voyage_calc_revenues_user_policy ON voyage_calc_revenues
  FOR ALL USING (
    calculation_id IN (
      SELECT id FROM voyage_calculations 
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );
