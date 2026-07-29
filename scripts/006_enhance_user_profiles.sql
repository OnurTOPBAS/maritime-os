-- Enhanced User Profile Management
-- Adds profile photo, personal info, preferences, and signature

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Europe/Istanbul';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'tr';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_sms BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;

-- Create index for faster profile queries
CREATE INDEX IF NOT EXISTS idx_users_profile_completion ON users(profile_completion);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
