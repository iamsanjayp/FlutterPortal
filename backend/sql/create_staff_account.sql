-- =====================================================
-- Add Staff Test Account
-- =====================================================
-- This script adds a Staff (Skill Coordinator) test account

USE mobiledev_portal;

-- Insert Staff Account
-- Email: staff@mobiledev.com
-- Password: staff123
INSERT INTO users (
    full_name,
    email,
    enrollment_no,
    roll_no,
    staff_id,
    auth_provider,
    password_hash,
    role_id,
    is_active,
    created_at,
    current_level
) VALUES (
    'Staff Coordinator',
    'staff@mobiledev.com',
    NULL,
    NULL,
    'STAFF002',
    'LOCAL',
    '$2b$10$/hxdALA5wNeNtzjKwy3Mquh3WIXcqRUISAo7vf6d8MCdAN2GY6MES', -- staff123
    2,  -- STAFF role_id
    1,
    NOW(),
    NULL
);

-- Verify the account was created
SELECT id, full_name, email, role_id, staff_id, is_active 
FROM users 
WHERE email = 'staff@mobiledev.com';
