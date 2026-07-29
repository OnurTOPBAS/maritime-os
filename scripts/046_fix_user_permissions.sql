-- Fix user permissions for certificate editing
-- This script updates users with 'viewer' role to 'editor' role if they should have edit access

-- Update the specific user who is having permission issues
UPDATE user_permissions 
SET role = 'editor',
    updated_at = NOW()
WHERE user_id = '8798759b-8383-4fe4-868f-ba055df7ebb0'
  AND company_id = '6cf0904d-ccc5-4074-95e0-90f4a0bf757d'
  AND role = 'viewer';

-- Optionally, you can also update all viewers to editors if needed
-- Uncomment the following lines if you want to give all viewers edit access:
-- UPDATE user_permissions 
-- SET role = 'editor',
--     updated_at = NOW()
-- WHERE role = 'viewer';

-- Verify the update
SELECT 
  up.user_id,
  u.name as user_name,
  u.email,
  up.company_id,
  c.name as company_name,
  up.role,
  up.updated_at
FROM user_permissions up
JOIN users u ON u.id = up.user_id
JOIN companies c ON c.id = up.company_id
WHERE up.user_id = '8798759b-8383-4fe4-868f-ba055df7ebb0'
  AND up.company_id = '6cf0904d-ccc5-4074-95e0-90f4a0bf757d';
