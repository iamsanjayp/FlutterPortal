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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'SANJAY P','sanjayp.cs24@bitsathy.ac.in','2024UCS1294','7376241CS361','','GOOGLE',NULL,1,1,'2026-01-21 09:17:39',NULL,'1A'),(2,'sanjay','itsanjayp@gmail.com',NULL,NULL,NULL,'GOOGLE',NULL,1,1,'2026-01-22 05:54:14',NULL,'1B'),(3,'DONNN','itsanjayp2@gmail.com',NULL,NULL,'CS45546','GOOGLE',NULL,2,1,'2026-01-23 04:14:14',NULL,'1C'),(5,'Lalithkumar Pallipalayam Ravikumar','lalithkumarpallipalayam.cs24@bitsathy.ac.in','','','CS11088','GOOGLE',NULL,2,1,'2026-02-04 06:29:02','af5957b0-c5c3-4d53-aac0-514898e15da1',NULL),(10,'Sanjay Pasupatheeswaran','sanjay006p@gmail.com',NULL,NULL,'PCDP1','GOOGLE',NULL,3,1,'2026-02-04 06:36:43','660b73eb-6cba-40ea-ac83-227ea94d2846',NULL),(11,'SELVAGANAPATHY P','selvaganapathyp.ad24@bitsathy.ac.in','2024UAD1189','7376242AD297',NULL,'GOOGLE',NULL,1,1,'2026-02-04 06:52:49',NULL,NULL),(12,'KIRUTHICK PS','kiruthikps.cs24@bitsathy.ac.in','2024UCS1274','7376241CS246',NULL,'GOOGLE',NULL,1,1,'2026-02-04 06:52:49',NULL,NULL),(13,'KARTHEEPAN JK','kartheepanjk.al24@bitsathy.ac.in','2024UAL1101','7376242AL137',NULL,'GOOGLE',NULL,1,1,'2026-02-04 06:52:49',NULL,NULL),(14,'Nishaanth Mohanasundaram','nishaanthmohanasundaram.al24@bitsathy.ac.in','2024UAL1100','7376242AL160',NULL,'GOOGLE',NULL,1,1,'2026-02-04 06:52:49',NULL,NULL),(15,'HARI PRANAV MURUGAN M','haripranavmuruganm.al24@bitsathy.ac.in','2024UAL1090','7376242AL130',NULL,'GOOGLE',NULL,1,1,'2026-02-04 06:52:49',NULL,NULL),(16,'RITHIK P','rithikp.al24@bitsathy.ac.in','2024UAL1092','7376242AL177',NULL,'GOOGLE',NULL,1,1,'2026-02-04 06:52:49',NULL,NULL),(17,'K S RAGUL RAKAV','ksragulrakav.cs24@bitsathy.ac.in','2024UCS1344','7376241CS221',NULL,'GOOGLE',NULL,1,1,'2026-02-04 06:52:49',NULL,NULL);
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

-- Dump completed on 2026-02-05 15:49:01
