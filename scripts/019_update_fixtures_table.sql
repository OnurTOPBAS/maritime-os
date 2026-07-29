-- Add new columns to fixtures table for enhanced fixture management

-- Add fixture type (VCP or TC)
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS fixture_type VARCHAR(10);

-- Add payment type
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20);

-- Modify load_port and discharge_port to support multiple ports (stored as JSON array)
-- Note: Existing data will be preserved, we'll handle conversion in the application layer

-- Add comment to clarify the new structure
COMMENT ON COLUMN fixtures.load_port IS 'JSON array of loading ports or single port string';
COMMENT ON COLUMN fixtures.discharge_port IS 'JSON array of discharge ports or single port string';
