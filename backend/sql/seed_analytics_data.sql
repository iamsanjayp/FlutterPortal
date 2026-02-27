-- =====================================================
-- Seed Database with Test Data
-- =====================================================
-- This script populates the database with realistic test data
-- for demonstration and testing purposes

USE mobiledev_portal;

-- =====================================================
-- 1. INSERT ADDITIONAL STUDENTS (to reach ~245 total users)
-- =====================================================

-- Batch insert students (using INSERT IGNORE to skip duplicates)
INSERT IGNORE INTO users (full_name, email, enrollment_no, roll_no, auth_provider, password_hash, role_id, is_active, current_level) VALUES
('Rahul Kumar', 'rahul.kumar@student.edu', 'EN002', 'RN002', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '3A'),
('Priya Sharma', 'priya.sharma@student.edu', 'EN003', 'RN003', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '3A'),
('Amit Patel', 'amit.patel@student.edu', 'EN004', 'RN004', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '3A'),
('Sneha Reddy', 'sneha.reddy@student.edu', 'EN005', 'RN005', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '2C'),
('Vikram Singh', 'vikram.singh@student.edu', 'EN006', 'RN006', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '3A'),
('Anjali Verma', 'anjali.verma@student.edu', 'EN007', 'RN007', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '3A'),
('Karthik Iyer', 'karthik.iyer@student.edu', 'EN008', 'RN008', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '1A'),
('Divya Menon', 'divya.menon@student.edu', 'EN009', 'RN009', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '3A'),
('Rohan Gupta', 'rohan.gupta@student.edu', 'EN010', 'RN010', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '3A'),
('Pooja Nair', 'pooja.nair@student.edu', 'EN011', 'RN011', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '2B'),
('Arjun Bhat', 'arjun.bhat@student.edu', 'EN012', 'RN012', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '3A'),
('Shreya Das', 'shreya.das@student.edu', 'EN013', 'RN013', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '3A'),
('Aditya Chopra', 'aditya.chopra@student.edu', 'EN014', 'RN014', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '3A'),
('Nisha Joshi', 'nisha.joshi@student.edu', 'EN015', 'RN015', 'LOCAL', '$2b$10$Ehbyee5w9bLWe2xzP1matPjkU02EhxJX5qK1OZvGxJ8P6B/xjO/nq', 1, 1, '1B');

-- Add more students to reach 245 total (simplified - generates pattern)
-- Note: This is a subset. In production, you'd generate all 245 records.

-- =====================================================
-- 2. INSERT TEST SESSIONS (Active and Completed)
-- =====================================================

-- Level 3A Completed Sessions (42 completions)
INSERT INTO test_sessions (user_id, level, status, started_at, ended_at, duration_minutes, level_cleared) 
SELECT id, '3A', 'PASS', 
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY) + INTERVAL 90 MINUTE,
    90, 1
FROM users WHERE role_id = 1 AND current_level = '3A' LIMIT 42;

-- Level 3A Failed/In Progress Sessions (114 more attempts to reach 156 total)
INSERT INTO test_sessions (user_id, level, status, started_at, ended_at, duration_minutes, level_cleared)
SELECT id, '3A', 
    CASE 
        WHEN RAND() > 0.7 THEN 'IN_PROGRESS'
        ELSE 'FAIL'
    END,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 20) DAY),
    CASE 
        WHEN RAND() > 0.7 THEN NULL
        ELSE DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 20) DAY) + INTERVAL 90 MINUTE
    END,
    90, 0
FROM users WHERE role_id = 1 LIMIT 114;

-- =====================================================
-- 3. INSERT USER SESSIONS (for active students tracking)
-- =====================================================

-- Create active sessions for 187 students (skip if already exists)
INSERT IGNORE INTO user_session (
    user_id, 
    level, 
    assigned_problem_ids, 
    started_at, 
    expires_at,
    current_problem_id,
    progress_data
)
SELECT 
    id,
    '3A',
    '[1,2]',
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 2) HOUR),
    DATE_ADD(NOW(), INTERVAL 88 MINUTE),
    1,
    '{}'
FROM users 
WHERE role_id = 1 
LIMIT 187;

-- =====================================================
-- 4. INSERT SUBMISSIONS (Recent activity)
-- =====================================================

-- Insert 28 submissions for today
INSERT INTO test_session_submissions (
    user_id,
    problem_id,
    test_session_id,
    code,
    status,
    created_at
)
SELECT 
    u.id,
    FLOOR(1 + RAND() * 2), -- Random problem 1 or 2
    ts.id,
    '// Sample submitted code\nexport default function App() {\n  return <View><Text>Hello</Text></View>;\n}',
    CASE 
        WHEN RAND() > 0.5 THEN 'COMPLETED'
        ELSE 'SUBMITTED'
    END,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 24) HOUR)
FROM users u
JOIN test_sessions ts ON ts.user_id = u.id
WHERE u.role_id = 1
LIMIT 28;

-- =====================================================
-- 5. UPDATE BLOCKED USERS (for testing)
-- =====================================================

-- Mark some users as inactive (blocked)
UPDATE users 
SET is_active = 0 
WHERE role_id = 1 
ORDER BY RAND() 
LIMIT 5;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check total users
SELECT 'Total Users' as metric, COUNT(*) as value FROM users;

-- Check active students  
SELECT 'Active Students' as metric, COUNT(*) as value FROM users WHERE role_id = 1 AND is_active = 1;

-- Check Level 3A attempts
SELECT 'Level 3A Attempts' as metric, COUNT(*) as value FROM test_sessions WHERE level = '3A';

-- Check Level 3A completions
SELECT 'Level 3A Completions' as metric, COUNT(*) as value FROM test_sessions WHERE level = '3A' AND status = 'PASS';

-- Check active sessions
SELECT 'Active Sessions' as metric, COUNT(*) as value FROM user_session WHERE expires_at > NOW();

-- Check submissions today
SELECT 'Submissions Today' as metric, COUNT(*) as value FROM test_session_submissions WHERE DATE(created_at) = CURDATE();

-- Check blocked users
SELECT 'Blocked Users' as metric, COUNT(*) as value FROM users WHERE role_id = 1 AND is_active = 0;
