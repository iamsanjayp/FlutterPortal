SET FOREIGN_KEY_CHECKS = 0;
CREATE DATABASE  IF NOT EXISTS `mobiledev_portal` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `mobiledev_portal`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mobiledev_portal
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `test_session_submissions`
--

DROP TABLE IF EXISTS `test_session_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_session_submissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `test_session_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `problem_id` bigint NOT NULL,
  `code` longtext NOT NULL,
  `status` varchar(16) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `preview_image_url` varchar(255) DEFAULT NULL,
  `score` int DEFAULT NULL,
  `match_percent` decimal(5,2) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `manual_score` int DEFAULT NULL COMMENT 'Manual grading score (0-100, represents 50% of total grade)',
  `manual_graded_by` bigint DEFAULT NULL COMMENT 'User ID of teacher who manually graded',
  `manual_graded_at` datetime DEFAULT NULL COMMENT 'When manual grading was completed',
  `manual_feedback` text COMMENT 'Teacher feedback/comments on the submission',
  `final_score` decimal(5,2) DEFAULT NULL COMMENT 'Final combined score (automated 50% + manual 50%)',
  PRIMARY KEY (`id`),
  KEY `idx_session` (`test_session_id`),
  KEY `idx_user` (`user_id`),
  KEY `fk_submission_problem` (`problem_id`),
  KEY `idx_manual_grading` (`manual_graded_by`,`manual_graded_at`),
  CONSTRAINT `fk_submission_problem` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submission_session` FOREIGN KEY (`test_session_id`) REFERENCES `test_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submission_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_session_submissions`
--

LOCK TABLES `test_session_submissions` WRITE;
/*!40000 ALTER TABLE `test_session_submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `test_session_submissions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-24 13:46:10

SET FOREIGN_KEY_CHECKS = 1;
