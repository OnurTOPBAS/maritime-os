-- Add technical specifications and position fields to ships table

ALTER TABLE ships
ADD COLUMN IF NOT EXISTS grt DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS nrt DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS main_engine VARCHAR(255),
ADD COLUMN IF NOT EXISTS engine_power VARCHAR(100),
ADD COLUMN IF NOT EXISTS speed_laden DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS speed_ballast DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS loa DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS beam DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS draft DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS current_position TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS position_updated_at TIMESTAMP;

-- Update status column to support new status values
COMMENT ON COLUMN ships.status IS 'Status: active, inactive, maintenance, idle, anchored, in_port, at_sea';
