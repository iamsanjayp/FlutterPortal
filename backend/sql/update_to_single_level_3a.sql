-- ============================================================
-- UPDATE DATABASE TO ONLY HAVE LEVEL 3A
-- ============================================================
-- This script removes all other levels and ensures only 3A exists
-- Run this to align the database with the simplified level structure

USE mobiledev_portal;

-- Step 1: Delete all test cases (since level 3A has no test cases)
DELETE FROM test_cases;

-- Step 2: Delete all problems that are not level 3A
DELETE FROM problems WHERE level != '3A';

-- Step 3: Update all user current_level to 3A
UPDATE users SET current_level = '3A' WHERE current_level IS NOT NULL;

-- Step 4: Update all test_sessions to level 3A
UPDATE test_sessions SET level = '3A' WHERE level != '3A';

-- Step 5: Verify the changes
SELECT 'Database updated to only have level 3A' as status;

-- Show remaining problems
SELECT id, level, title, problem_type, language, 
  CASE WHEN sample_image IS NOT NULL THEN '✓ Has image' ELSE '✗ No image' END as img,
  is_active
FROM problems;

-- Show test case count (should be 0)
SELECT COUNT(*) as test_case_count FROM test_cases;

-- Show users current level
SELECT id, full_name, current_level FROM users;
