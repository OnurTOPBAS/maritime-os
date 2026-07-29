-- Add is_active column to user_permissions table
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active
UPDATE user_permissions 
SET is_active = true 
WHERE is_active IS NULL;
