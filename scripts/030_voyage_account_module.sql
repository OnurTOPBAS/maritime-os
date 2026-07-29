-- Voyage Account Module (Sefer Hesabı)
-- Comprehensive voyage profitability calculation system
-- Version: 030

-- 1. Update voyages table with voyage account fields
ALTER TABLE voyages
ADD COLUMN IF NOT EXISTS voyage_type VARCHAR(50) DEFAULT 'laden',
ADD COLUMN IF NOT EXISTS service_speed DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS total_days DECIMAL(8, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_fo_consumption DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_mgo_consumption DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_fuel_cost DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_running_cost DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_profit DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_running_cost DECIMAL(10, 2) DEFAULT 0;

-- 2. Voyage Legs (Route segments between ports)
CREATE TABLE IF NOT EXISTS voyage_legs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  leg_order INTEGER NOT NULL,
  leg_type VARCHAR(50) NOT NULL, -- 'laden' or 'ballast'
  from_port VARCHAR(255) NOT NULL,
  to_port VARCHAR(255) NOT NULL,
  distance_nm DECIMAL(10, 2) NOT NULL, -- nautical miles
  sea_days DECIMAL(8, 2), -- auto-calculated: distance / (service_speed * 24)
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(voyage_id, leg_order)
);

-- 3. Voyage Activities (Operation items with fuel consumption)
CREATE TABLE IF NOT EXISTS voyage_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'at_sea_laden', 'at_sea_ballast', 'loading', 'discharge', 'heating', 'washing', 'anchor', 'idle', 'inert_gas', 'incinerator', 'other'
  activity_name VARCHAR(255),
  days DECIMAL(8, 2) NOT NULL,
  fo_rate DECIMAL(8, 2) DEFAULT 0, -- FO consumption rate (MT/day)
  mgo_rate DECIMAL(8, 2) DEFAULT 0, -- MGO consumption rate (MT/day)
  fo_consumption DECIMAL(10, 2), -- auto-calculated: fo_rate * days
  mgo_consumption DECIMAL(10, 2), -- auto-calculated: mgo_rate * days
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Voyage Bunker Prices (Fuel prices)
CREATE TABLE IF NOT EXISTS voyage_bunker_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  price_date DATE NOT NULL,
  fo_price DECIMAL(10, 2) NOT NULL, -- USD per MT
  mgo_price DECIMAL(10, 2) NOT NULL, -- USD per MT
  port VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Voyage Cost Items (Cost breakdown)
CREATE TABLE IF NOT EXISTS voyage_cost_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  cost_type VARCHAR(50) NOT NULL, -- 'pda_loading', 'pda_discharge', 'pda_transit', 'awrp', 'security', 'running_cost', 'commission', 'other'
  description VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Voyage Revenue Items (Revenue breakdown)
CREATE TABLE IF NOT EXISTS voyage_revenue_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  revenue_type VARCHAR(50) NOT NULL, -- 'freight', 'demurrage', 'despatch', 'other'
  description VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_voyage_legs_voyage ON voyage_legs(voyage_id);
CREATE INDEX idx_voyage_activities_voyage ON voyage_activities(voyage_id);
CREATE INDEX idx_voyage_bunker_prices_voyage ON voyage_bunker_prices(voyage_id);
CREATE INDEX idx_voyage_cost_items_voyage ON voyage_cost_items(voyage_id);
CREATE INDEX idx_voyage_revenue_items_voyage ON voyage_revenue_items(voyage_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE voyage_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_bunker_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyage_revenue_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own voyage data
CREATE POLICY voyage_legs_policy ON voyage_legs
  USING (
    voyage_id IN (
      SELECT v.id FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      WHERE c.owner_id = current_setting('app.current_user_id')::uuid
    )
  );

CREATE POLICY voyage_activities_policy ON voyage_activities
  USING (
    voyage_id IN (
      SELECT v.id FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      WHERE c.owner_id = current_setting('app.current_user_id')::uuid
    )
  );

CREATE POLICY voyage_bunker_prices_policy ON voyage_bunker_prices
  USING (
    voyage_id IN (
      SELECT v.id FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      WHERE c.owner_id = current_setting('app.current_user_id')::uuid
    )
  );

CREATE POLICY voyage_cost_items_policy ON voyage_cost_items
  USING (
    voyage_id IN (
      SELECT v.id FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      WHERE c.owner_id = current_setting('app.current_user_id')::uuid
    )
  );

CREATE POLICY voyage_revenue_items_policy ON voyage_revenue_items
  USING (
    voyage_id IN (
      SELECT v.id FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      WHERE c.owner_id = current_setting('app.current_user_id')::uuid
    )
  );

-- Comments for documentation
COMMENT ON TABLE voyage_legs IS 'Route segments between ports with distance and calculated sea days';
COMMENT ON TABLE voyage_activities IS 'Operation items with fuel consumption rates and calculations';
COMMENT ON TABLE voyage_bunker_prices IS 'Fuel prices (FO and MGO) for voyage cost calculation';
COMMENT ON TABLE voyage_cost_items IS 'Cost breakdown items (PDA, AWRP, Security, Commission, etc.)';
COMMENT ON TABLE voyage_revenue_items IS 'Revenue items (Freight, Demurrage, Despatch, etc.)';
