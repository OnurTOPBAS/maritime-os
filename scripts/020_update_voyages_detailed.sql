-- Update voyages table to support detailed multi-port operations
-- Version: 020 - Detailed Voyage Port Information

-- Add new columns for detailed port operations
ALTER TABLE voyages ADD COLUMN IF NOT EXISTS loading_ports JSONB DEFAULT '[]'::jsonb;
ALTER TABLE voyages ADD COLUMN IF NOT EXISTS discharge_ports JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the JSON structure
COMMENT ON COLUMN voyages.loading_ports IS 'Array of loading port objects with detailed information: port_name, cargo_quantity, cargo_unit, ata, atb, atc, atd, arrival_rob_fo, arrival_rob_mgo, departure_rob_fo, departure_rob_mgo, bunker_supply, bunker_fo, bunker_mgo, draft_aft, draft_fore, bl_date';
COMMENT ON COLUMN voyages.discharge_ports IS 'Array of discharge port objects with detailed information: port_name, cargo_quantity, cargo_unit, ata, atb, atc, atd, arrival_rob_fo, arrival_rob_mgo, departure_rob_fo, departure_rob_mgo, bunker_supply, bunker_fo, bunker_mgo, draft_aft, draft_fore';
