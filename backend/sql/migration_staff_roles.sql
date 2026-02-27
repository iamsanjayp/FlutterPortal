-- Migration: Add staff task types and permissions
-- Run this against the mobiledev_portal database

USE mobiledev_portal;

-- 1. Add task_type to existing assignments table
ALTER TABLE test_schedule_assignments
  ADD COLUMN task_type ENUM('GRADER','SLOT_SUPERVISOR') NOT NULL DEFAULT 'SLOT_SUPERVISOR'
  AFTER user_id;

-- 2. Drop old unique key and recreate with task_type
ALTER TABLE test_schedule_assignments
  DROP INDEX unique_assignment,
  ADD UNIQUE KEY unique_assignment (schedule_id, user_id, task_type);

-- 3. Staff permissions (global, not slot-specific)
CREATE TABLE IF NOT EXISTS staff_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  can_manage_questions TINYINT(1) DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
