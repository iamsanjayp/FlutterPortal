-- =====================================================
-- Migration: Fix test_cases column names
-- =====================================================
-- Renames columns to be language-agnostic and fixes is_public/is_hidden

USE mobiledev_portal;

-- Rename dart-specific columns to generic names
ALTER TABLE test_cases 
CHANGE COLUMN dart_args input_data TEXT NOT NULL;

ALTER TABLE test_cases 
CHANGE COLUMN dart_expected expected_output TEXT NOT NULL;

-- Rename is_public to is_hidden (inverted logic)
-- First add the new column
ALTER TABLE test_cases 
ADD COLUMN is_hidden TINYINT(1) DEFAULT 0 AFTER expected_output;

-- Copy inverted values (is_public=1 means is_hidden=0)
UPDATE test_cases SET is_hidden = IF(is_public = 1, 0, 1);

-- Drop old column
ALTER TABLE test_cases DROP COLUMN is_public;

-- Add test_order if not exists
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS test_order INT DEFAULT 1 AFTER is_hidden;

-- Verification
SELECT 'Column renaming completed!' as status;
DESCRIBE test_cases;
