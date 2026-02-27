-- =====================================================
-- Migration: Add React Native Support to Problems
-- =====================================================
-- This script extends the database to support both Flutter and React Native problems

USE mobiledev_portal;

-- STEP 1: Backup existing tables
CREATE TABLE IF NOT EXISTS problems_backup AS SELECT * FROM problems;
CREATE TABLE IF NOT EXISTS test_cases_backup AS SELECT * FROM test_cases;

-- STEP 2: Update problems table to support React Native
ALTER TABLE problems 
MODIFY language ENUM('FLUTTER', 'REACT_NATIVE') NOT NULL;

-- STEP 3: Rename test_cases columns to be language-agnostic
-- From Flutter-specific (dart_args, dart_expected) to generic (input_data, expected_output)
ALTER TABLE test_cases 
CHANGE COLUMN dart_args input_data TEXT NOT NULL;

ALTER TABLE test_cases 
CHANGE COLUMN dart_expected expected_output TEXT NOT NULL;

-- STEP 4: Add order column if not exists (for test case ordering)
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS order_no INT DEFAULT 1 AFTER is_public;

-- Verification queries
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_problems, language FROM problems GROUP BY language;
SELECT COUNT(*) as total_test_cases FROM test_cases;
