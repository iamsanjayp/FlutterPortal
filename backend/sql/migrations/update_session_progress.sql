-- Add progress tracking columns to user_session table

-- Add progress_data if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = "user_session";
SET @columnname = "progress_data";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE user_session ADD COLUMN progress_data JSON DEFAULT NULL AFTER assigned_problem_ids;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add current_problem_id if it doesn't exist
SET @columnname = "current_problem_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE user_session ADD COLUMN current_problem_id BIGINT DEFAULT NULL AFTER progress_data;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify columns
DESCRIBE user_session;
