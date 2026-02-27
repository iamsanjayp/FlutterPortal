-- Create user_session table for random question assignment persistence
-- This table stores which problem was randomly assigned to each student per level

CREATE TABLE IF NOT EXISTS user_session (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  level VARCHAR(10) NOT NULL,
  assigned_problem_ids JSON NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Ensure one active session per user per level
  UNIQUE KEY unique_user_level (user_id, level),
  
  -- Foreign key to users table
  CONSTRAINT user_session_ibfk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Index for faster lookups
  INDEX idx_user_level (user_id, level),
  INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Example data structure for assigned_problem_ids:
-- ["9001"] for Level 3A with single problem
-- or [1001, 1002, 1003] for multiple problems
