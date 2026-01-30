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
-- Table structure for table `test_cases`
--

DROP TABLE IF EXISTS `test_cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_cases` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `problem_id` bigint NOT NULL,
  `input` text NOT NULL,
  `expected_output` text NOT NULL,
  `is_hidden` tinyint(1) DEFAULT '0',
  `order_no` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `problem_id` (`problem_id`),
  CONSTRAINT `test_cases_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_cases`
--

LOCK TABLES `test_cases` WRITE;
/*!40000 ALTER TABLE `test_cases` DISABLE KEYS */;
INSERT INTO `test_cases` VALUES (1,1,'abc','cba',0,1,'2026-01-22 08:57:06'),(2,1,'','',0,2,'2026-01-22 08:57:06'),(3,1,'madam','madam',1,3,'2026-01-22 08:57:06'),(4,1,'flutter','rettulf',1,4,'2026-01-22 08:57:06'),(5,1,'a','a',1,5,'2026-01-22 08:57:06'),(6,1,'racecar','racecar',1,6,'2026-01-22 08:57:06'),(7,1,'12345','54321',1,7,'2026-01-22 08:57:06'),(8,1,'hello','olleh',1,8,'2026-01-22 08:57:06'),(9,1,'xyz','zyx',1,9,'2026-01-22 08:57:06'),(10,1,'level','level',1,10,'2026-01-22 08:57:06'),(11,2,'noon','true',0,1,'2026-01-22 10:07:43'),(12,2,'radar','true',0,2,'2026-01-22 10:07:43'),(13,2,'a','true',1,3,'2026-01-22 10:07:43'),(14,2,'ab','false',1,4,'2026-01-22 10:07:43'),(15,2,'level','true',1,5,'2026-01-22 10:07:43'),(16,2,'flutter','false',1,6,'2026-01-22 10:07:43'),(17,2,'madam','true',1,7,'2026-01-22 10:07:43'),(18,2,'coding','false',1,8,'2026-01-22 10:07:43'),(19,2,'refer','true',1,9,'2026-01-22 10:07:43'),(20,2,'hello','false',1,10,'2026-01-22 10:07:43'),(21,3,'[1,2,3,4]','10',0,1,'2026-01-24 09:06:26'),(22,3,'[2,5]','7',0,2,'2026-01-24 09:07:37'),(23,3,'[]','',1,3,'2026-01-24 09:07:52'),(24,3,'[5,4]','9',1,4,'2026-01-24 09:08:28'),(25,3,'[11,10]','21',1,5,'2026-01-24 09:08:47'),(26,3,'[30,20]','50',1,6,'2026-01-24 09:09:03'),(27,3,'[99,2]','101',1,7,'2026-01-24 09:09:21'),(28,3,'[-1,5]','4',1,8,'2026-01-24 09:09:42'),(29,3,'[-5,-10]','-15',1,9,'2026-01-24 09:09:56'),(30,3,'[-5,5]','0',1,10,'2026-01-24 09:10:12'),(31,4,'[]','0',0,1,'2026-01-24 09:12:50'),(32,4,'[1,2]','3',0,2,'2026-01-24 09:13:00'),(33,4,'[99,2]','101',1,3,'2026-01-24 09:13:11'),(34,4,'[100,-5]','95',1,4,'2026-01-24 09:13:27'),(35,4,'[-5,-5]','-10',1,5,'2026-01-24 09:13:39'),(36,4,'[-5,5]','0',1,6,'2026-01-24 09:13:47'),(37,4,'[9,9]','18',1,7,'2026-01-24 09:14:02'),(38,4,'[-1,0]','-1',1,8,'2026-01-24 09:14:26'),(39,4,'[2,2]','4',1,9,'2026-01-24 09:14:41'),(40,4,'[99,1]','100',1,10,'2026-01-24 09:14:55'),(41,5,'[1,2]','3',0,1,'2026-01-24 09:32:16'),(42,5,'[-4,10]','6',0,2,'2026-01-24 09:32:16'),(43,5,'[100,200]','300',1,3,'2026-01-24 09:32:16'),(44,6,'\"hello\"','\"olleh\"',0,1,'2026-01-24 09:32:16'),(45,6,'\"abc\"','\"cba\"',0,2,'2026-01-24 09:32:16'),(46,6,'\"level\"','\"level\"',1,3,'2026-01-24 09:32:16'),(47,7,'[1,5,3]','5',0,1,'2026-01-24 09:32:16'),(48,7,'[10]','10',0,2,'2026-01-24 09:32:16'),(49,7,'[-1,-5,-3]','-1',1,3,'2026-01-24 09:32:16'),(50,7,'[3,7,2]','7',1,4,'2026-01-24 10:33:56'),(51,7,'[5,6,1]','6',1,5,'2026-01-24 10:34:12'),(52,7,'[99,4,21]','99',1,6,'2026-01-24 10:34:37'),(53,7,'[56,21,-21]','56',1,7,'2026-01-24 10:35:02'),(54,7,'[-89,-1,-9]','-1',1,8,'2026-01-24 10:35:28'),(55,7,'[-23,1,0]','1',1,9,'2026-01-24 10:35:47'),(56,7,'[24,4,1]','24',1,10,'2026-01-24 10:36:09'),(57,5,'[-5,5]','0',1,4,'2026-01-27 03:39:13'),(58,5,'[-5,6]','1',1,5,'2026-01-27 03:39:23'),(59,5,'[-12,6]','-6',1,6,'2026-01-27 03:39:41'),(60,5,'[12,0]','12',1,7,'2026-01-27 03:40:00'),(61,5,'[0,0]','0',1,8,'2026-01-27 03:40:12'),(62,5,'[7,1]','8',1,9,'2026-01-27 03:40:29'),(63,5,'[77,-1]','76',1,10,'2026-01-27 03:41:22');
/*!40000 ALTER TABLE `test_cases` ENABLE KEYS */;
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
