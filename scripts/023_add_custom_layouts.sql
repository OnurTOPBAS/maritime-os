-- Add custom_layouts column to dashboard_preferences
ALTER TABLE dashboard_preferences 
ADD COLUMN IF NOT EXISTS custom_layouts JSONB DEFAULT '[]'::jsonb;

-- Custom layouts will be stored as JSON array with structure:
-- [
--   {
--     "id": "custom-1",
--     "name": "My Custom Layout",
--     "areas": [
--       { "id": "area-1", "width": "1/3", "order": 0 },
--       { "id": "area-2", "width": "2/3", "order": 1 }
--     ]
--   }
-- ]
