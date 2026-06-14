CREATE TABLE IF NOT EXISTS `test_schedule_registrations` (
  `schedule_id` int NOT NULL,
  `user_id` bigint NOT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'UI',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`schedule_id`,`user_id`),
  KEY `idx_schedule_registrations_user` (`user_id`),
  CONSTRAINT `fk_schedule_registrations_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `test_schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_registrations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_registrations_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;