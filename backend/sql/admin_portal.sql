CREATE TABLE IF NOT EXISTS test_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  duration_minutes INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'test_sessions'
    AND COLUMN_NAME = 'duration_minutes'
);

SET @alter_sql = IF(
  @col_exists = 0,
  'ALTER TABLE test_sessions ADD COLUMN duration_minutes INT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ignore_col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'test_sessions'
    AND COLUMN_NAME = 'ignore_schedule_end'
);

SET @ignore_alter_sql = IF(
  @ignore_col_exists = 0,
  'ALTER TABLE test_sessions ADD COLUMN ignore_schedule_end TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE ignore_stmt FROM @ignore_alter_sql;
EXECUTE ignore_stmt;
DEALLOCATE PREPARE ignore_stmt;

CREATE TABLE IF NOT EXISTS test_session_submissions (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  test_session_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  problem_id BIGINT NOT NULL,
  code LONGTEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session (test_session_id),
  INDEX idx_user (user_id),
  CONSTRAINT fk_submission_session FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

SET @level_col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'current_level'
);

SET @level_alter_sql = IF(
  @level_col_exists = 0,
  "ALTER TABLE users ADD COLUMN current_level VARCHAR(8) NULL",
  'SELECT 1'
);

PREPARE level_stmt FROM @level_alter_sql;
EXECUTE level_stmt;
DEALLOCATE PREPARE level_stmt;
