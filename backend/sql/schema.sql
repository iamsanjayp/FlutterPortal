-- Base schema for MobileDev Portal (React Native focused)
CREATE DATABASE IF NOT EXISTS `mobiledev_portal` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `mobiledev_portal`;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  enrollment_no VARCHAR(30) DEFAULT NULL,
  roll_no VARCHAR(30) DEFAULT NULL,
  staff_id VARCHAR(30) DEFAULT NULL,
  auth_provider ENUM('GOOGLE','LOCAL') NOT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  role_id INT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  active_session_id VARCHAR(100) DEFAULT NULL,
  current_level VARCHAR(8) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY email (email),
  UNIQUE KEY enrollment_no (enrollment_no),
  UNIQUE KEY roll_no (roll_no),
  UNIQUE KEY staff_id (staff_id),
  KEY role_id (role_id),
  CONSTRAINT users_ibfk_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- OAuth accounts
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider ENUM('GOOGLE') NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_provider_account (provider, provider_account_id),
  KEY user_id (user_id),
  CONSTRAINT oauth_accounts_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Problems (React Native only)
CREATE TABLE IF NOT EXISTS problems (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  level VARCHAR(10) NOT NULL,
  language ENUM('REACT_NATIVE') NOT NULL,
  problem_type ENUM('CODE','UI') NOT NULL,
  starter_code LONGTEXT NOT NULL,
  sample_image LONGBLOB DEFAULT NULL,
  created_by BIGINT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY created_by (created_by),
  CONSTRAINT problems_ibfk_user FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Test cases
CREATE TABLE IF NOT EXISTS test_cases (
  id BIGINT NOT NULL AUTO_INCREMENT,
  problem_id BIGINT NOT NULL,
  input_data TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden TINYINT(1) DEFAULT 1,
  test_order INT DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY problem_id (problem_id),
  CONSTRAINT test_cases_ibfk_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Test sessions
CREATE TABLE IF NOT EXISTS test_sessions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  level VARCHAR(10) NOT NULL,
  status ENUM('IN_PROGRESS','PASS','FAIL') NOT NULL DEFAULT 'IN_PROGRESS',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME DEFAULT NULL,
  duration_minutes INT NULL,
  level_cleared TINYINT(1) DEFAULT 0,
  ignore_schedule_end TINYINT(1) NOT NULL DEFAULT 0,
  feedback TEXT NULL,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT test_sessions_ibfk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Session questions
CREATE TABLE IF NOT EXISTS test_session_questions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  test_session_id BIGINT NOT NULL,
  problem_id BIGINT NOT NULL,
  order_no INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY session_id (test_session_id),
  KEY problem_id (problem_id),
  CONSTRAINT tsq_ibfk_session FOREIGN KEY (test_session_id) REFERENCES test_sessions (id) ON DELETE CASCADE,
  CONSTRAINT tsq_ibfk_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Test case results
CREATE TABLE IF NOT EXISTS test_case_results (
  id BIGINT NOT NULL AUTO_INCREMENT,
  test_session_id BIGINT NOT NULL,
  problem_id BIGINT NOT NULL,
  test_case_id BIGINT NOT NULL,
  status ENUM('PASS','FAIL') NOT NULL,
  output TEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY session_id (test_session_id),
  KEY problem_id (problem_id),
  KEY test_case_id (test_case_id),
  CONSTRAINT tcr_ibfk_session FOREIGN KEY (test_session_id) REFERENCES test_sessions (id) ON DELETE CASCADE,
  CONSTRAINT tcr_ibfk_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE,
  CONSTRAINT tcr_ibfk_case FOREIGN KEY (test_case_id) REFERENCES test_cases (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Test session submissions
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Submissions for React Native problems
CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  problem_id BIGINT NOT NULL,
  code LONGTEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  score DECIMAL(5,2) DEFAULT NULL,
  execution_time INT DEFAULT NULL,
  test_results LONGTEXT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  KEY problem_id (problem_id),
  CONSTRAINT submissions_ibfk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT submissions_ibfk_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Test schedules
CREATE TABLE IF NOT EXISTS test_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  duration_minutes INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff assignments to test schedules
CREATE TABLE IF NOT EXISTS test_schedule_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  user_id BIGINT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_assignment (schedule_id, user_id),
  FOREIGN KEY (schedule_id) REFERENCES test_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Basic seed roles
INSERT IGNORE INTO roles (id, name) VALUES (1,'STUDENT'),(2,'TEACHER'),(3,'ADMIN');

-- Seed users with shared password Pass@123 (bcrypt hash below)
SET @seed_password_hash := '$2b$10$cYEU4t0Jn21n7JdN5E/YbO01eO9a2hFO8fBPdGrahtk4HMcph86kC';

INSERT IGNORE INTO users (id, full_name, email, enrollment_no, roll_no, staff_id, auth_provider, password_hash, role_id, is_active)
VALUES
  (1001, 'Portal Admin', 'admin@mobiledev.local', NULL, NULL, NULL, 'LOCAL', @seed_password_hash, 3, 1),
  (1002, 'Review Staff', 'staff@mobiledev.local', NULL, NULL, 'STF001', 'LOCAL', @seed_password_hash, 2, 1),
  (1003, 'Test Student', 'student@mobiledev.local', 'STU001', NULL, NULL, 'LOCAL', @seed_password_hash, 1, 1);

-- Seed an active schedule for development/testing
INSERT IGNORE INTO test_schedules (id, name, start_at, end_at, duration_minutes, is_active, created_at, updated_at)
VALUES (9001, 'Dev Window', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 120, 1, NOW(), NOW());

-- Seed additional practice problems with visible sample outputs
INSERT INTO problems (id, level, title, description, starter_code, is_active, language, problem_type, created_by)
VALUES
  (2001, '1B', 'Reverse String',
   'Write a function that returns the reversed string. Preserve casing and punctuation.',
   'function solution(text) {\n  // return reversed text\n  return "";\n}',
   1, 'REACT_NATIVE', 'CODE', NULL),
  (2002, '2A', 'Sum of Squares',
   'Given an array of integers, return the sum of their squares.',
   'function solution(nums) {\n  // return sum of squares\n  return 0;\n}',
   1, 'REACT_NATIVE', 'CODE', NULL),
  (2003, '3B', 'Todo List UI',
   'Build a simple React Native todo list with add and toggle complete actions. Display remaining items count.',
   'import React, { useState } from ''react'';\nimport { View, Text, TextInput, TouchableOpacity, FlatList } from ''react-native'';\n\nexport default function App() {\n  const [items, setItems] = useState([]);\n  const [text, setText] = useState('''');\n  // add your handlers and UI here\n  return <View />;\n}',
   1, 'REACT_NATIVE', 'UI', NULL)
ON DUPLICATE KEY UPDATE id = VALUES(id);

SET @p_reverse := (SELECT id FROM problems WHERE id = 2001);
SET @p_squares := (SELECT id FROM problems WHERE id = 2002);
SET @p_todo := (SELECT id FROM problems WHERE id = 2003);

INSERT IGNORE INTO test_cases (problem_id, input_data, expected_output, is_hidden, test_order) VALUES
(@p_reverse, '"hello"', '"olleh"', 0, 1),
(@p_reverse, '"A man, a plan"', '"nalp a ,nam A"', 0, 2),
(@p_reverse, '"React Native"', '"evitaN tcaeR"', 1, 3),
(@p_reverse, '"12345"', '"54321"', 1, 4),

(@p_squares, '[1,2,3]', '14', 0, 1),
(@p_squares, '[-1,2,-2]', '9', 0, 2),
(@p_squares, '[0,0,5]', '25', 1, 3),
(@p_squares, '[]', '0', 1, 4),

(@p_todo, 'Initial render', 'Shows empty list and input', 0, 1),
(@p_todo, 'Add two items', 'Lists both items; remaining count = 2', 0, 2),
(@p_todo, 'Toggle first item complete', 'First item styled as done; remaining count = 1', 1, 3),
(@p_todo, 'Add then toggle multiple items', 'List renders updates correctly', 1, 4);
