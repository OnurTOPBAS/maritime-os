-- Add operations field to voyage_calculations
ALTER TABLE voyage_calculations 
ADD COLUMN IF NOT EXISTS operations JSONB DEFAULT '{}'::jsonb;

-- Add category field to voyage_calc_costs
ALTER TABLE voyage_calc_costs 
ADD COLUMN IF NOT EXISTS category VARCHAR(255);

-- Add type field to voyage_calc_revenues
ALTER TABLE voyage_calc_revenues 
ADD COLUMN IF NOT EXISTS type VARCHAR(100);
