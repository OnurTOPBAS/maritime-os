-- Add fuel consumption data to ships table
-- This includes operational consumption and speed-based consumption

ALTER TABLE ships
ADD COLUMN IF NOT EXISTS consumption_operations JSONB DEFAULT '{
  "loading": {"fo": 0, "mgo": 0},
  "discharge": {"fo": 0, "mgo": 0},
  "laden": {"fo": 0, "mgo": 0},
  "ballast": {"fo": 0, "mgo": 0},
  "anchor": {"fo": 0, "mgo": 0},
  "idle": {"fo": 0, "mgo": 0},
  "inerting": {"fo": 0, "mgo": 0},
  "washing": {"fo": 0, "mgo": 0},
  "heating": {"fo": 0, "mgo": 0},
  "incinerator": {"fo": 0, "mgo": 0}
}'::jsonb,
ADD COLUMN IF NOT EXISTS consumption_laden_speed JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS consumption_ballast_speed JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN ships.consumption_operations IS 'Fuel consumption (FO and MGO in MT/day) for different operations';
COMMENT ON COLUMN ships.consumption_laden_speed IS 'Speed-based fuel consumption for laden voyage: [{speed: number, fo: number, mgo: number}]';
COMMENT ON COLUMN ships.consumption_ballast_speed IS 'Speed-based fuel consumption for ballast voyage: [{speed: number, fo: number, mgo: number}]';
