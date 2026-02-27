-- =====================================================
-- Test Accounts Creation Script
-- =====================================================
-- This script creates test accounts for Admin and Student roles

USE mobiledev_portal;

-- Insert Admin Account
-- Email: admin@mobiledev.com
-- Password: admin123
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
    'Admin User',
    'admin@mobiledev.com',
    NULL,
    NULL,
    'STAFF001',
    'LOCAL',
    '$2b$10$YwJX5qK1OZvGxJ8P6B/xjO/nqtXfsf3U.TRQfW2xzP1matPjkU02C',
    3,  -- ADMIN role_id
    1,
    NOW(),
    NULL
);

-- Insert Student Account  
-- Email: student@mobiledev.com
-- Password: student123
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
    'Test Student',
    'student@mobiledev.com',
    'EN001',
    'RN001',
    NULL,
    'LOCAL',
    '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq',
    1,  -- STUDENT role_id
    1,
    NOW(),
    '1A'
);

-- Verify the accounts were created
SELECT id, full_name, email, role_id, is_active 
FROM users 
WHERE email IN ('admin@mobiledev.com', 'student@mobiledev.com');
