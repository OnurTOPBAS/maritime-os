-- Add file URL columns to ships table for document storage

ALTER TABLE ships 
ADD COLUMN IF NOT EXISTS particulars_file_url TEXT,
ADD COLUMN IF NOT EXISTS fuel_consumption_file_url TEXT,
ADD COLUMN IF NOT EXISTS position_updated_at TIMESTAMP;

-- Add additional technical specification columns if they don't exist
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
ADD COLUMN IF NOT EXISTS consumption_operations JSONB,
ADD COLUMN IF NOT EXISTS consumption_laden_speed JSONB,
ADD COLUMN IF NOT EXISTS consumption_ballast_speed JSONB,
ADD COLUMN IF NOT EXISTS built_year INTEGER;
