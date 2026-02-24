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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `enrollment_no` varchar(30) DEFAULT NULL,
  `roll_no` varchar(30) DEFAULT NULL,
  `staff_id` varchar(30) DEFAULT NULL,
  `auth_provider` enum('GOOGLE','LOCAL') NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `active_session_id` varchar(100) DEFAULT NULL,
  `current_level` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `enrollment_no` (`enrollment_no`),
  UNIQUE KEY `roll_no` (`roll_no`),
  UNIQUE KEY `staff_id` (`staff_id`),
  KEY `role_id` (`role_id`),
  KEY `idx_users_enrollment` (`enrollment_no`),
  KEY `idx_users_roll` (`roll_no`),
  KEY `idx_users_staff` (`staff_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Local Admin','admin@local.test',NULL,NULL,'ADMIN001','LOCAL','$2b$10$LffzEQIeiNLsLW0WsNlj4enYRWzB2PTsNL1icbS5ZFbAb4Ne8XRNe',3,1,'2026-02-05 17:42:58','d9c55791-c770-46b1-ba24-b66dc57355c1',NULL),(2,'Local Faculty','faculty@local.test',NULL,NULL,'FAC001','LOCAL','$2b$10$2DgdVK1GjDiiNyTVhihZGODtgsVyM4aRWAF3hY/mfctUfQeskFARy',2,1,'2026-02-05 17:42:58','98791708-b70e-48b4-80b3-430a1d94d785',NULL),(3,'Local Student','student@local.test','LOCALSTU001','ROLL001',NULL,'LOCAL','$2b$10$nxxAkGR3djo9AGqR/K90GuEXOXVLbAn9pe6I06fglYLzOhzlKhDhy',1,1,'2026-02-05 17:42:58',NULL,NULL),(26,'student2','stu2@local.test','234235','899358',NULL,'LOCAL','$2b$10$e4/8l.p6SWSxukSxtEL3L.DZHpSqF.WN1Pq.VP9G/wZJxCw.fAZY2',1,1,'2026-02-19 08:42:55',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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
