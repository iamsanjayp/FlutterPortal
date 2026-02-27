-- =====================================================
-- Migration: Add Problem Type for Level-Based Testing
-- =====================================================
-- Adds problem_type column to support CODE (1A-2C) and UI (3A-5C) problems

USE mobiledev_portal;

-- Add problem_type column to problems table
ALTER TABLE problems 
ADD COLUMN problem_type ENUM('CODE', 'UI') NOT NULL DEFAULT 'UI' 
AFTER language;

-- Create index for efficient filtering
CREATE INDEX idx_problems_type_level ON problems(problem_type, level);

-- Verification
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_problems, language, problem_type 
FROM problems 
GROUP BY language, problem_type;
