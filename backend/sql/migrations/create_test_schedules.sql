-- =====================================================
-- Fix: Create test_schedules table if missing
-- =====================================================

USE mobiledev_portal;

-- Create test_schedules table
CREATE TABLE IF NOT EXISTS `test_schedules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `level` varchar(10) NOT NULL,
  `start_at` datetime NOT NULL,
  `end_at` datetime NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `start_at` (`start_at`),
  KEY `end_at` (`end_at`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `test_schedules_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Verify creation
SELECT 'Table test_schedules verified' as status;
SHOW TABLES LIKE 'test_schedules';
