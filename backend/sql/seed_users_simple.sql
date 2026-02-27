-- =====================================================
-- Simplified Seed Script - Users Only
-- =====================================================
-- This creates test users for the admin dashboard

USE mobiledev_portal;

-- Insert test students (using INSERT IGNORE to skip duplicates)
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

-- Show results
SELECT 'Total Users' as metric, COUNT(*) as value FROM users;
SELECT 'Total Students' as metric, COUNT(*) as value FROM users WHERE role_id = 1;
SELECT 'Active Students' as metric, COUNT(*) as value FROM users WHERE role_id = 1 AND is_active = 1;
