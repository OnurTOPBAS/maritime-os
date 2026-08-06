-- Add Voyages table for voyage tracking
-- Version: 002 - Voyage Tracking

CREATE TABLE IF NOT EXISTS voyages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  voyage_number VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'planned',
  
  -- Loading details
  load_port VARCHAR(255),
  load_country VARCHAR(100),
  eta_load DATE,
  etb_load DATE,
  etc_load DATE,
  etd_load DATE,
  
  -- Discharging details
  discharge_port VARCHAR(255),
  discharge_country VARCHAR(100),
  eta_discharge DATE,
  etb_discharge DATE,
  etc_discharge DATE,
  etd_discharge DATE,
  
  -- Cargo details
  cargo_quantity DECIMAL(12, 2),
  cargo_unit VARCHAR(50) DEFAULT 'MT',
  
  -- Laytime details
  laytime_allowed_load DECIMAL(8, 2),
  laytime_used_load DECIMAL(8, 2),
  laytime_allowed_discharge DECIMAL(8, 2),
  laytime_used_discharge DECIMAL(8, 2),
  demurrage_amount DECIMAL(12, 2),
  despatch_amount DECIMAL(12, 2),
  
  -- Additional info
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_voyages_fixture ON voyages(fixture_id);
CREATE INDEX IF NOT EXISTS idx_voyages_status ON voyages(status);
