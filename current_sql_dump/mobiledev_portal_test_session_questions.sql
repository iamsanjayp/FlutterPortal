CREATE DATABASE  IF NOT EXISTS `mobiledev_portal` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `mobiledev_portal`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: mobiledev_portal
-- ------------------------------------------------------
-- Server version	8.0.44

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
-- Table structure for table `test_session_questions`
--

DROP TABLE IF EXISTS `test_session_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_session_questions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `test_session_id` bigint NOT NULL,
  `problem_id` bigint NOT NULL,
  `order_no` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `test_session_id` (`test_session_id`),
  KEY `problem_id` (`problem_id`),
  CONSTRAINT `test_session_questions_ibfk_1` FOREIGN KEY (`test_session_id`) REFERENCES `test_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `test_session_questions_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_session_questions`
--

LOCK TABLES `test_session_questions` WRITE;
/*!40000 ALTER TABLE `test_session_questions` DISABLE KEYS */;
INSERT INTO `test_session_questions` VALUES (5,2,1,1,'2026-01-30 06:06:25'),(6,2,2,2,'2026-01-30 06:06:25'),(7,3,1,1,'2026-01-30 13:47:41'),(8,3,5,2,'2026-01-30 13:47:41'),(9,4,8,1,'2026-01-30 13:50:17'),(10,5,8,1,'2026-01-30 14:50:28'),(11,6,8,1,'2026-01-30 16:51:07'),(12,7,9,1,'2026-01-31 03:20:26'),(13,8,9,1,'2026-01-31 04:31:20'),(14,9,9,1,'2026-02-02 07:37:34'),(15,10,8,1,'2026-02-02 08:40:33'),(16,11,9,1,'2026-02-02 09:22:44'),(17,12,8,1,'2026-02-02 09:55:35'),(18,13,8,1,'2026-02-02 16:35:57'),(19,14,9,1,'2026-02-02 17:04:57'),(21,16,8,1,'2026-02-04 04:27:15'),(22,17,8,1,'2026-02-04 04:43:41'),(23,18,7,1,'2026-02-04 05:32:49'),(24,18,1,2,'2026-02-04 05:32:49'),(29,19,11,1,'2026-02-04 09:29:21'),(30,20,7,1,'2026-02-05 05:52:44'),(31,20,2,2,'2026-02-05 05:52:44'),(33,21,11,1,'2026-02-05 05:55:32'),(34,22,10,1,'2026-02-05 07:49:13'),(35,23,4,1,'2026-02-05 09:00:29'),(36,23,1,2,'2026-02-05 09:00:29'),(38,24,10,1,'2026-02-05 09:04:41');
/*!40000 ALTER TABLE `test_session_questions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-05 15:49:01
