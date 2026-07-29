-- Voyage Calculator Module
-- This is for pre-voyage cost/revenue estimation, not actual voyage tracking

CREATE TABLE IF NOT EXISTS voyage_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Ship Information
  ship_id INTEGER REFERENCES ships(id) ON DELETE SET NULL,
  ship_name VARCHAR(255), -- For non-fleet ships
  
  -- Charterer Information
  charterer_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  charterer_name VARCHAR(255), -- For potential charterers not in system
  
  -- Voyage Parameters
  service_speed DECIMAL(5,2), -- knots
  daily_running_cost DECIMAL(12,2), -- USD per day
  
  -- Calculated Totals (updated automatically)
  total_distance_nm DECIMAL(10,2) DEFAULT 0,
  total_sea_days DECIMAL(10,2) DEFAULT 0,
  total_port_days DECIMAL(10,2) DEFAULT 0,
  total_days DECIMAL(10,2) DEFAULT 0,
  
  total_fo_consumption DECIMAL(10,2) DEFAULT 0, -- MT
  total_mgo_consumption DECIMAL(10,2) DEFAULT 0, -- MT
  total_fuel_cost DECIMAL(12,2) DEFAULT 0, -- USD
  total_running_cost DECIMAL(12,2) DEFAULT 0, -- USD
  total_other_costs DECIMAL(12,2) DEFAULT 0, -- USD
  total_cost DECIMAL(12,2) DEFAULT 0, -- USD
  
  total_revenue DECIMAL(12,2) DEFAULT 0, -- USD
  net_profit DECIMAL(12,2) DEFAULT 0, -- USD
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, finalized, converted_to_fixture
  notes TEXT,
  
  -- Metadata
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- RLS
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE
);

-- Route Legs for Calculator
CREATE TABLE IF NOT EXISTS voyage_calc_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID REFERENCES voyage_calculations(id) ON DELETE CASCADE,
  leg_order INTEGER NOT NULL,
  
  from_port VARCHAR(255) NOT NULL,
  to_port VARCHAR(255) NOT NULL,
  distance_nm DECIMAL(10,2) NOT NULL,
  
  -- Condition affects fuel consumption
  leg_condition VARCHAR(20) NOT NULL, -- 'laden' or 'ballast'
  
  -- Calculated
  sea_days DECIMAL(10,2), -- distance / (speed * 24)
  fo_consumption DECIMAL(10,2), -- MT
  mgo_consumption DECIMAL(10,2), -- MT
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(calculation_id, leg_order)
);

-- Port Operations for Calculator
CREATE TABLE IF NOT EXISTS voyage_calc_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID REFERENCES voyage_calculations(id) ON DELETE CASCADE,
  
  port_name VARCHAR(255) NOT NULL,
  operation_type VARCHAR(50) NOT NULL, -- loading, discharge, waiting, etc.
  days DECIMAL(10,2) NOT NULL,
  
  -- Fuel consumption during port operations
  fo_consumption DECIMAL(10,2) DEFAULT 0, -- MT
  mgo_consumption DECIMAL(10,2) DEFAULT 0, -- MT
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fuel Prices for Calculator
CREATE TABLE IF NOT EXISTS voyage_calc_fuel_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID REFERENCES voyage_calculations(id) ON DELETE CASCADE,
  
  fo_price DECIMAL(10,2) NOT NULL, -- USD per MT
  mgo_price DECIMAL(10,2) NOT NULL, -- USD per MT
  
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost Items for Calculator
CREATE TABLE IF NOT EXISTS voyage_calc_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID REFERENCES voyage_calculations(id) ON DELETE CASCADE,
  
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(100), -- port_charges, canal_fees, agency_fees, etc.
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue Items for Calculator
CREATE TABLE IF NOT EXISTS voyage_calc_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID REFERENCES voyage_calculations(id) ON DELETE CASCADE,
  
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(100), -- freight, demurrage, etc.
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_voyage_calculations_company ON voyage_calculations(company_id);
CREATE INDEX idx_voyage_calculations_ship ON voyage_calculations(ship_id);
CREATE INDEX idx_voyage_calculations_status ON voyage_calculations(status);
CREATE INDEX idx_voyage_calc_legs_calculation ON voyage_calc_legs(calculation_id);
CREATE INDEX idx_voyage_calc_operations_calculation ON voyage_calc_operations(calculation_id);
CREATE INDEX idx_voyage_calc_fuel_prices_calculation ON voyage_calc_fuel_prices(calculation_id);
CREATE INDEX idx_voyage_calc_costs_calculation ON voyage_calc_costs(calculation_id);
CREATE INDEX idx_voyage_calc_revenues_calculation ON voyage_calc_revenues(calculation_id);

-- Enable RLS
ALTER TABLE voyage_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_calc_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_calc_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_calc_fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_calc_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_calc_revenues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY voyage_calculations_policy ON voyage_calculations
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = current_setting('app.current_user_id')::INTEGER));

CREATE POLICY voyage_calc_legs_policy ON voyage_calc_legs
  USING (calculation_id IN (SELECT id FROM voyage_calculations WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = current_setting('app.current_user_id')::INTEGER)));

CREATE POLICY voyage_calc_operations_policy ON voyage_calc_operations
  USING (calculation_id IN (SELECT id FROM voyage_calculations WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = current_setting('app.current_user_id')::INTEGER)));

CREATE POLICY voyage_calc_fuel_prices_policy ON voyage_calc_fuel_prices
  USING (calculation_id IN (SELECT id FROM voyage_calculations WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = current_setting('app.current_user_id')::INTEGER)));

CREATE POLICY voyage_calc_costs_policy ON voyage_calc_costs
  USING (calculation_id IN (SELECT id FROM voyage_calculations WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = current_setting('app.current_user_id')::INTEGER)));

CREATE POLICY voyage_calc_revenues_policy ON voyage_calc_revenues
  USING (calculation_id IN (SELECT id FROM voyage_calculations WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = current_setting('app.current_user_id')::INTEGER)));
