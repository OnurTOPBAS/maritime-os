-- Add columns for arrival and departure ROB tracking
ALTER TABLE fuel_records 
ADD COLUMN IF NOT EXISTS arrival_rob numeric,
ADD COLUMN IF NOT EXISTS departure_rob numeric,
ADD COLUMN IF NOT EXISTS port_consumption numeric,
ADD COLUMN IF NOT EXISTS sea_consumption numeric,
ADD COLUMN IF NOT EXISTS leg_type character varying(20);

-- Update existing records to use the new structure
-- Set leg_type based on record_type
UPDATE fuel_records 
SET leg_type = CASE 
  WHEN record_type = 'bunkering' THEN 'arrival'
  ELSE 'departure'
END
WHERE leg_type IS NULL;

COMMENT ON COLUMN fuel_records.arrival_rob IS 'Remaining On Board when arriving at port';
COMMENT ON COLUMN fuel_records.departure_rob IS 'Remaining On Board when departing from port';
COMMENT ON COLUMN fuel_records.port_consumption IS 'Fuel consumed at port (arrival_rob - departure_rob)';
COMMENT ON COLUMN fuel_records.sea_consumption IS 'Fuel consumed at sea (previous departure_rob - current arrival_rob)';
COMMENT ON COLUMN fuel_records.leg_type IS 'Type of leg: arrival or departure';
