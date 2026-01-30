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
-- Table structure for table `problems`
--

DROP TABLE IF EXISTS `problems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `problems` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `level` varchar(10) NOT NULL,
  `language` enum('FLUTTER') NOT NULL,
  `starter_code` text NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `problems_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `problems`
--

LOCK TABLES `problems` WRITE;
/*!40000 ALTER TABLE `problems` DISABLE KEYS */;
INSERT INTO `problems` VALUES (1,'Reverse a String','Implement reverseString(String input) that returns the reversed string.','1A','FLUTTER','String reverseString(String input) {\n  // write your code here\n  return \"\";\n}',NULL,1,'2026-01-22 08:57:05'),(2,'Palindrome Checker','Return true if the given string is a palindrome. Assume lowercase input with no spaces or punctuation.','1A','FLUTTER','bool isPalindrome(String input) {\n  // write your code here\n  return false;\n}',1,1,'2026-01-22 10:05:23'),(3,'','','1A','FLUTTER','',NULL,0,'2026-01-24 09:04:51'),(4,'Total Sum','Calculate the sum of all integers in a list.','1A','FLUTTER','int sumList(List<int> numbers) {\n  // TODO: Your code goes here\n  return 0; \n}',NULL,1,'2026-01-24 09:12:30'),(5,'Add Two Numbers','Return the sum of two integers.','1A','FLUTTER','int add(int a, int b) {\n  // TODO\n  return 0;\n}',NULL,1,'2026-01-24 09:32:16'),(6,'Reverse String','Return the input string reversed.','1A','FLUTTER','String reverseString(String s) {\n  // TODO\n  return \"\";\n}',NULL,0,'2026-01-24 09:32:16'),(7,'Max in List','Return the maximum value in a list of integers.','1A','FLUTTER','int maxValue(List<int> nums) {\n  // TODO\n  return 0;\n}',NULL,1,'2026-01-24 09:32:16');
/*!40000 ALTER TABLE `problems` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-30 10:38:50
