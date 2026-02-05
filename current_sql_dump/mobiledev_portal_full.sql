SET FOREIGN_KEY_CHECKS=0;
\n\n-- ===== mobiledev_portal_roles.sql =====\n
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
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (3,'ADMIN'),(1,'STUDENT'),(2,'TEACHER');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
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
\n\n-- ===== mobiledev_portal_users.sql =====\n
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
\n\n-- ===== mobiledev_portal_oauth_accounts.sql =====\n
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
-- Table structure for table `oauth_accounts`
--

DROP TABLE IF EXISTS `oauth_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `provider` enum('GOOGLE') NOT NULL,
  `provider_user_id` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `provider` (`provider`,`provider_user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `oauth_accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oauth_accounts`
--

LOCK TABLES `oauth_accounts` WRITE;
/*!40000 ALTER TABLE `oauth_accounts` DISABLE KEYS */;
INSERT INTO `oauth_accounts` VALUES (1,1,'GOOGLE','113688303794047331251'),(2,2,'GOOGLE','111596757208576614580'),(3,3,'GOOGLE','113124969793449919768');
/*!40000 ALTER TABLE `oauth_accounts` ENABLE KEYS */;
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
\n\n-- ===== mobiledev_portal_levels.sql =====\n
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
-- Table structure for table `levels`
--

DROP TABLE IF EXISTS `levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `levels` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `level_code` varchar(10) NOT NULL,
  `assessment_type` enum('TEST_CASE','UI_COMPARE') NOT NULL DEFAULT 'TEST_CASE',
  `question_count` int NOT NULL DEFAULT '2',
  `duration_minutes` int NOT NULL DEFAULT '60',
  `pass_threshold` int NOT NULL DEFAULT '85',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_levels_code` (`level_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `levels`
--

LOCK TABLES `levels` WRITE;
/*!40000 ALTER TABLE `levels` DISABLE KEYS */;
INSERT INTO `levels` VALUES (1,'1A','TEST_CASE',2,60,85,1,'2026-01-30 13:14:39','2026-01-30 13:14:39'),(2,'1B','UI_COMPARE',1,90,70,1,'2026-01-30 13:14:39','2026-01-30 13:19:36'),(3,'1C','UI_COMPARE',2,60,85,0,'2026-01-30 13:14:39','2026-01-30 13:19:45'),(4,'2A','UI_COMPARE',2,90,85,0,'2026-01-30 13:14:39','2026-01-30 13:19:47'),(5,'2B','UI_COMPARE',2,90,85,0,'2026-01-30 13:14:39','2026-01-30 13:19:49'),(6,'2C','UI_COMPARE',2,90,85,0,'2026-01-30 13:14:39','2026-01-30 13:19:50'),(7,'3A','UI_COMPARE',1,90,85,0,'2026-01-30 13:14:39','2026-01-30 13:19:52'),(8,'3B','UI_COMPARE',1,90,85,0,'2026-01-30 13:14:39','2026-01-30 13:19:54'),(9,'3C','UI_COMPARE',1,90,85,0,'2026-01-30 13:14:39','2026-01-30 13:19:56');
/*!40000 ALTER TABLE `levels` ENABLE KEYS */;
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
\n\n-- ===== mobiledev_portal_student_levels.sql =====\n
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
-- Table structure for table `student_levels`
--

DROP TABLE IF EXISTS `student_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_levels` (
  `user_id` bigint NOT NULL,
  `current_level` varchar(8) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_student_levels_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_levels`
--

LOCK TABLES `student_levels` WRITE;
/*!40000 ALTER TABLE `student_levels` DISABLE KEYS */;
INSERT INTO `student_levels` VALUES (1,'1C','2026-02-05 09:08:20'),(2,'1C','2026-02-05 09:00:11'),(11,'1A','2026-02-05 04:50:19'),(12,'1A','2026-02-05 04:50:19'),(13,'1A','2026-02-05 04:50:19'),(14,'1A','2026-02-05 04:50:19'),(15,'1A','2026-02-05 04:50:19'),(16,'1A','2026-02-05 04:50:19'),(17,'1A','2026-02-05 04:50:19');
/*!40000 ALTER TABLE `student_levels` ENABLE KEYS */;
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
\n\n-- ===== mobiledev_portal_problems.sql =====\n
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
  `reference_image_url` varchar(255) DEFAULT NULL,
  `ui_required_widgets` text,
  `resource_urls` text,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `problems_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `problems`
--

LOCK TABLES `problems` WRITE;
/*!40000 ALTER TABLE `problems` DISABLE KEYS */;
INSERT INTO `problems` VALUES (1,'Reverse a String','Implement reverseString(String input) that returns the reversed string.','1A','FLUTTER','String reverseString(String input) {\n  // write your code here\n  return \"\";\n}',NULL,1,'2026-01-22 08:57:05',NULL,NULL,NULL),(2,'Palindrome Checker','Return true if the given string is a palindrome. Assume lowercase input with no spaces or punctuation.','1A','FLUTTER','bool isPalindrome(String input) {\n  // write your code here\n  return false;\n}',1,1,'2026-01-22 10:05:23',NULL,NULL,NULL),(4,'Total Sum','Calculate the sum of all integers in a list.','1A','FLUTTER','int sumList(List<int> numbers) {\n  // TODO: Your code goes here\n  return 0; \n}',NULL,1,'2026-01-24 09:12:30',NULL,NULL,NULL),(5,'Add Two Numbers','Return the sum of two integers.','1A','FLUTTER','int add(int a, int b) {\n  // TODO\n  return 0;\n}',NULL,1,'2026-01-24 09:32:16',NULL,NULL,NULL),(7,'Max in List','Return the maximum value in a list of integers.','1A','FLUTTER','int maxValue(List<int> nums) {\n  // TODO\n  return 0;\n}',NULL,1,'2026-01-24 09:32:16',NULL,NULL,NULL),(8,'PCDP Login Screen UI','Design a Flutter login screen that visually matches the reference image provided.\n\nUI Requirements\n\nThe screen background must be a vertical blue gradient.\n\nDisplay the following texts centered horizontally:\n\nApp title: “PCDP App”\n\nHeading: “Welcome Back!”\n\nSubtext: “Please Log into your existing account”\n\nAdd two rounded input fields:\n\nEmail input with placeholder “Your Email”\n\nPassword input with placeholder “Your Password”\n\nAdd a rounded green button labeled “Log in”.\n\nAll elements must be vertically aligned and evenly spaced.\n\nDo not implement authentication logic.\n\nConstraints\n\nUse only Flutter widgets.\n\nDo not add navigation or validation logic.\n\nFocus strictly on layout, spacing, colors, and typography.','1B','FLUTTER','import \'package:flutter/material.dart\';\n\nclass LoginScreen extends StatelessWidget {\n  const LoginScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      body: Container(\n        // TODO: Add gradient background\n        color: Colors.blue,\n        child: SafeArea(\n          child: Padding(\n            padding: const EdgeInsets.all(24),\n            child: Column(\n              mainAxisAlignment: MainAxisAlignment.center,\n              children: [\n                // TODO: Add app title text \"PCDP App\"\n\n                const SizedBox(height: 24),\n\n                // TODO: Add \"Welcome Back!\" text\n\n                const SizedBox(height: 8),\n\n                // TODO: Add subtitle text\n\n                const SizedBox(height: 32),\n\n                // TODO: Add email input field\n\n                const SizedBox(height: 16),\n\n                // TODO: Add password input field\n\n                const SizedBox(height: 32),\n\n                // TODO: Add login button\n              ],\n            ),\n          ),\n        ),\n      ),\n    );\n  }\n}\n',NULL,0,'2026-01-30 13:43:30','/uploads/ui_samples/problem-8-1769780628412.jpg','[\"Scaffold\",\"Container\",\"SafeArea\",\"Padding\",\"Column\",\"Text\",\"SizedBox\",\"TextField\",\"ElevatedButton\",\"LinearGradient\"]',NULL),(9,'Profile & Settings Screen UI','Create a Flutter settings screen that matches the provided reference image.\n\nUI Requirements\n\nUse a white background.\n\nAdd a top bar with:\n\nBack arrow icon (left)\n\nMenu icon (right)\n\nDisplay the title “Profile And Settings”.\n\nDisplay a vertical list of settings options:\n\nHome\n\nPersonal Information\n\nNotification Settings\n\nCustomize App Appearance\n\nHelp And Support\n\nEach list item must contain:\n\nCircular icon on the left\n\nTitle text\n\nRight arrow icon\n\nAdd a bottom navigation bar with icons.\n\nConstraints\n\nNo navigation logic.\n\nNo state management.\n\nUI structure only.','1B','FLUTTER','import \'package:flutter/material.dart\';\n\nclass SettingsScreen extends StatelessWidget {\n  const SettingsScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      // TODO: Set background color\n      appBar: AppBar(\n        // TODO: Match app bar style from design\n        leading: const Icon(Icons.arrow_back),\n        actions: const [\n          Icon(Icons.menu),\n          SizedBox(width: 16),\n        ],\n      ),\n      body: Padding(\n        padding: const EdgeInsets.all(16),\n        child: Column(\n          crossAxisAlignment: CrossAxisAlignment.start,\n          children: [\n            // TODO: Add page title \"Profile And Settings\"\n\n            const SizedBox(height: 24),\n\n            // TODO: Add settings list items\n            // Home\n            // Personal Information\n            // Notification Settings\n            // Customize App Appearance\n            // Help And Support\n          ],\n        ),\n      ),\n\n      // TODO: Add bottom navigation bar\n    );\n  }\n}\n',NULL,0,'2026-01-30 13:45:01','/uploads/ui_samples/problem-9-1769780707620.jpg',NULL,NULL),(10,'Simple Admin Dashboard UI','Design a Flutter admin dashboard screen similar to the provided reference image.\n\nUI Requirements\n\nDisplay a welcome card at the top with:\n\nUser name\n\nOrganization name\n\nShow four statistic cards:\n\nTotal Members\n\nMinisters\n\nMinistries\n\nActive Events\n\nAdd a Quick Actions section with 4 rounded cards:\n\nAdd Member\n\nSend Notification\n\nCreate Event\n\nAdd Ministry\n\nAdd sections for:\n\nPending Actions\n\nRecent Activity\n\nInclude a bottom navigation bar.\n\nConstraints\n\nUI only.\n\nStatic values allowed.\n\nNo interaction logic required.','1B','FLUTTER','import \'package:flutter/material.dart\';\n\nclass DashboardScreen extends StatelessWidget {\n  const DashboardScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      backgroundColor: Colors.grey.shade200,\n\n      appBar: AppBar(\n        // TODO: Style app bar with welcome message\n        title: const Text(\"Welcome\"),\n      ),\n\n      body: SingleChildScrollView(\n        padding: const EdgeInsets.all(16),\n        child: Column(\n          crossAxisAlignment: CrossAxisAlignment.start,\n          children: [\n            // TODO: Add stats cards (members, ministers, etc.)\n\n            const SizedBox(height: 16),\n\n            // TODO: Add \"Quick Actions\" section\n\n            const SizedBox(height: 16),\n\n            // TODO: Add \"Pending Actions\" section\n\n            const SizedBox(height: 16),\n\n            // TODO: Add \"Recent Activity\" section\n          ],\n        ),\n      ),\n\n      // TODO: Add bottom navigation bar\n    );\n  }\n}\n',NULL,1,'2026-01-30 13:46:01','/uploads/ui_samples/problem-10-1770282319768.jpg','[\"Scaffold\",\"SafeArea\",\"Container\",\"Text\",\"Column\",\"Row\",\"Card\",\"GridView\",\"ListView\",\"BottomNavigationBar\",\"Icon\",\"Padding\",\"SizedBox\"]',NULL),(11,'Leave a Review Screen','Build the UI to match the reference screen. Include the orange top bar with icons, the main white card with dish image, title, description text, 5 outlined stars, a rounded text input area, two rounded buttons (Cancel and Submit), and the orange bottom navigation bar with icons. Use the provided image resources for the dish photo and icons.','1B','FLUTTER','import \'package:flutter/material.dart\';\n\nclass ReviewScreen extends StatelessWidget {\n  const ReviewScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      backgroundColor: const Color(0xFFF9D46A),\n      body: SafeArea(\n        child: Column(\n          children: [\n            // TODO: top nav bar image (PNG)\n            // Image.asset(\'assets/top_nav.png\', width: double.infinity, fit: BoxFit.cover),\n\n            const SizedBox(height: 16),\n\n            const Text(\n              \'Leave a Review\',\n              style: TextStyle(\n                color: Colors.white,\n                fontSize: 22,\n                fontWeight: FontWeight.w700,\n              ),\n            ),\n\n            const SizedBox(height: 18),\n\n            // TODO: main card container\n            Container(\n              margin: const EdgeInsets.symmetric(horizontal: 22),\n              padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),\n              decoration: BoxDecoration(\n                color: Colors.white,\n                borderRadius: BorderRadius.circular(22),\n              ),\n              child: Column(\n                children: [\n                  // TODO: food image (PNG)\n                  // TODO: dish title + description\n                  // TODO: rating stars row (PNG)\n                  // TODO: comment box (TextField or styled container)\n                  // TODO: Cancel and Submit buttons\n                ],\n              ),\n            ),\n\n            const Spacer(),\n\n            // TODO: bottom nav bar image (PNG)\n            // Image.asset(\'assets/bottom_nav.png\', width: double.infinity, fit: BoxFit.cover),\n          ],\n        ),\n      ),\n    );\n  }\n}',NULL,1,'2026-02-04 09:22:36','/uploads/ui_samples/problem-11-1770197046288.png','[\"Scaffold\",\"SafeArea\",\"Image\",\"Container\",\"Text\",\"TextField\"]','[\"/uploads/ui_resources/problem-11-resource-1770197052140.png\",\"/uploads/ui_resources/problem-11-resource-1770197060970.png\",\"/uploads/ui_resources/problem-11-resource-1770197065347.png\"]');
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

-- Dump completed on 2026-02-05 15:49:01
\n\n-- ===== mobiledev_portal_test_cases.sql =====\n
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
INSERT INTO `test_cases` VALUES (1,1,'abc','cba',0,1,'2026-01-22 08:57:06'),(2,1,'','',0,2,'2026-01-22 08:57:06'),(3,1,'madam','madam',1,3,'2026-01-22 08:57:06'),(4,1,'flutter','rettulf',1,4,'2026-01-22 08:57:06'),(5,1,'a','a',1,5,'2026-01-22 08:57:06'),(6,1,'racecar','racecar',1,6,'2026-01-22 08:57:06'),(7,1,'12345','54321',1,7,'2026-01-22 08:57:06'),(8,1,'hello','olleh',1,8,'2026-01-22 08:57:06'),(9,1,'xyz','zyx',1,9,'2026-01-22 08:57:06'),(10,1,'level','level',1,10,'2026-01-22 08:57:06'),(11,2,'noon','true',0,1,'2026-01-22 10:07:43'),(12,2,'radar','true',0,2,'2026-01-22 10:07:43'),(13,2,'a','true',1,3,'2026-01-22 10:07:43'),(14,2,'ab','false',1,4,'2026-01-22 10:07:43'),(15,2,'level','true',1,5,'2026-01-22 10:07:43'),(16,2,'flutter','false',1,6,'2026-01-22 10:07:43'),(17,2,'madam','true',1,7,'2026-01-22 10:07:43'),(18,2,'coding','false',1,8,'2026-01-22 10:07:43'),(19,2,'refer','true',1,9,'2026-01-22 10:07:43'),(20,2,'hello','false',1,10,'2026-01-22 10:07:43'),(31,4,'[]','0',0,1,'2026-01-24 09:12:50'),(32,4,'[1,2]','3',0,2,'2026-01-24 09:13:00'),(33,4,'[99,2]','101',1,3,'2026-01-24 09:13:11'),(34,4,'[100,-5]','95',1,4,'2026-01-24 09:13:27'),(35,4,'[-5,-5]','-10',1,5,'2026-01-24 09:13:39'),(36,4,'[-5,5]','0',1,6,'2026-01-24 09:13:47'),(37,4,'[9,9]','18',1,7,'2026-01-24 09:14:02'),(38,4,'[-1,0]','-1',1,8,'2026-01-24 09:14:26'),(39,4,'[2,2]','4',1,9,'2026-01-24 09:14:41'),(40,4,'[99,1]','100',1,10,'2026-01-24 09:14:55'),(41,5,'[1,2]','3',0,1,'2026-01-24 09:32:16'),(42,5,'[-4,10]','6',0,2,'2026-01-24 09:32:16'),(43,5,'[100,200]','300',1,3,'2026-01-24 09:32:16'),(47,7,'[1,5,3]','5',0,1,'2026-01-24 09:32:16'),(48,7,'[10]','10',0,2,'2026-01-24 09:32:16'),(49,7,'[-1,-5,-3]','-1',1,3,'2026-01-24 09:32:16'),(50,7,'[3,7,2]','7',1,4,'2026-01-24 10:33:56'),(51,7,'[5,6,1]','6',1,5,'2026-01-24 10:34:12'),(52,7,'[99,4,21]','99',1,6,'2026-01-24 10:34:37'),(53,7,'[56,21,-21]','56',1,7,'2026-01-24 10:35:02'),(54,7,'[-89,-1,-9]','-1',1,8,'2026-01-24 10:35:28'),(55,7,'[-23,1,0]','1',1,9,'2026-01-24 10:35:47'),(56,7,'[24,4,1]','24',1,10,'2026-01-24 10:36:09'),(57,5,'[-5,5]','0',1,4,'2026-01-27 03:39:13'),(58,5,'[-5,6]','1',1,5,'2026-01-27 03:39:23'),(59,5,'[-12,6]','-6',1,6,'2026-01-27 03:39:41'),(60,5,'[12,0]','12',1,7,'2026-01-27 03:40:00'),(61,5,'[0,0]','0',1,8,'2026-01-27 03:40:12'),(62,5,'[7,1]','8',1,9,'2026-01-27 03:40:29'),(63,5,'[77,-1]','76',1,10,'2026-01-27 03:41:22');
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

-- Dump completed on 2026-02-05 15:49:01
\n\n-- ===== mobiledev_portal_test_schedules.sql =====\n
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
-- Table structure for table `test_schedules`
--

DROP TABLE IF EXISTS `test_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `start_at` datetime NOT NULL,
  `end_at` datetime NOT NULL,
  `duration_minutes` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `live_teacher_id` bigint DEFAULT NULL,
  `code_reviewer_id` bigint DEFAULT NULL,
  `ui_reviewer_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_schedules`
--

LOCK TABLES `test_schedules` WRITE;
/*!40000 ALTER TABLE `test_schedules` DISABLE KEYS */;
INSERT INTO `test_schedules` VALUES (1,'Level 1A - Batch 1','2026-01-30 11:22:00','2026-01-30 12:22:00',60,1,'2026-01-30 11:22:13','2026-01-30 11:22:13',NULL,NULL,NULL),(2,'Level 1B - Batch 1','2026-01-30 19:16:00','2026-01-30 20:16:00',60,1,'2026-01-30 19:17:07','2026-01-30 19:17:07',NULL,NULL,NULL),(3,'Level 1B - Batch 2','2026-01-30 20:20:00','2026-01-30 21:20:00',60,1,'2026-01-30 20:19:59','2026-01-30 20:19:59',NULL,NULL,NULL),(4,'Level 1B - Batch 2','2026-01-30 21:58:00','2026-01-30 22:58:00',60,1,'2026-01-30 21:57:50','2026-01-30 21:57:50',NULL,NULL,NULL),(5,'Level 1B - Batch 3','2026-01-31 09:50:00','2026-01-31 12:00:00',180,1,'2026-01-31 08:50:06','2026-01-31 09:58:49',NULL,NULL,NULL),(6,'Level 1B - Batch 4','2026-02-02 13:06:00','2026-02-02 14:06:00',60,1,'2026-02-02 13:06:51','2026-02-02 13:06:51',NULL,NULL,NULL),(7,'Level 1B - Batch 5','2026-02-02 14:10:00','2026-02-02 15:10:00',60,1,'2026-02-02 14:10:16','2026-02-02 14:10:16',NULL,NULL,NULL),(8,'Level 1B - Batch 6','2026-02-02 15:24:00','2026-02-02 16:24:00',60,1,'2026-02-02 15:24:54','2026-02-02 15:24:54',NULL,NULL,NULL),(9,'Level 1B - Batch 7','2026-02-02 22:05:00','2026-02-02 23:05:00',60,1,'2026-02-02 22:05:10','2026-02-02 22:05:10',NULL,NULL,NULL),(10,'Level 1B - Batch 8','2026-02-04 09:56:00','2026-02-04 10:56:00',60,1,'2026-02-04 09:56:38','2026-02-04 10:13:32',NULL,NULL,NULL),(11,'Level 1B - Batch 9','2026-02-04 11:02:00','2026-02-04 12:02:00',60,1,'2026-02-04 11:02:09','2026-02-04 11:02:09',NULL,NULL,NULL),(12,'Level 1B - Batch 10','2026-02-04 14:56:00','2026-02-04 15:56:00',60,1,'2026-02-04 14:56:48','2026-02-04 14:56:48',5,5,5),(13,'Level 1B - Batch 11','2026-02-05 11:22:00','2026-02-05 12:22:00',60,1,'2026-02-05 11:22:22','2026-02-05 11:22:22',5,5,5),(14,'Level 1B - Batch 12','2026-02-05 13:10:00','2026-02-05 14:10:00',60,1,'2026-02-05 13:10:44','2026-02-05 13:10:44',5,5,5),(15,'Final Test - 1','2026-02-05 14:29:00','2026-02-05 15:29:00',120,0,'2026-02-05 14:29:58','2026-02-05 14:33:47',5,5,5),(16,'Final Test - 2','2026-02-05 14:34:00','2026-02-05 15:34:00',120,1,'2026-02-05 14:34:10','2026-02-05 14:34:10',5,5,5);
/*!40000 ALTER TABLE `test_schedules` ENABLE KEYS */;
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
\n\n-- ===== mobiledev_portal_test_sessions.sql =====\n
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
-- Table structure for table `test_sessions`
--

DROP TABLE IF EXISTS `test_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `level` varchar(10) NOT NULL,
  `status` enum('IN_PROGRESS','PASS','FAIL','AWAITING_MANUAL') DEFAULT 'IN_PROGRESS',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` timestamp NULL DEFAULT NULL,
  `feedback` text,
  `level_cleared` tinyint(1) NOT NULL DEFAULT '0',
  `duration_minutes` int DEFAULT NULL,
  `ignore_schedule_end` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `test_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_sessions`
--

LOCK TABLES `test_sessions` WRITE;
/*!40000 ALTER TABLE `test_sessions` DISABLE KEYS */;
INSERT INTO `test_sessions` VALUES (2,2,'1A','PASS','2026-01-30 06:06:25','2026-01-30 06:08:30','Nil',1,5,0),(3,2,'1A','PASS','2026-01-30 13:47:41','2026-01-30 13:49:20','Very Good',1,60,0),(4,3,'1B','FAIL','2026-01-30 13:50:17','2026-01-30 14:50:20',NULL,0,60,0),(5,3,'1B','FAIL','2026-01-30 14:50:28','2026-01-30 16:51:02',NULL,0,60,0),(6,3,'1B','FAIL','2026-01-30 16:51:07','2026-01-31 03:20:21',NULL,0,60,0),(7,3,'1B','FAIL','2026-01-31 03:20:26','2026-01-31 04:30:41','nil',0,70,1),(8,2,'1B','FAIL','2026-01-31 04:31:20','2026-02-02 07:36:55',NULL,0,180,0),(9,2,'1B','FAIL','2026-02-02 07:37:34','2026-02-02 08:40:29',NULL,0,60,0),(10,2,'1B','FAIL','2026-02-02 08:40:33','2026-02-02 09:40:08',NULL,0,60,0),(11,3,'1B','FAIL','2026-02-02 09:22:44','2026-02-02 17:04:53',NULL,0,60,0),(12,2,'1B','FAIL','2026-02-02 09:55:35','2026-02-02 09:57:58','nil',0,60,0),(13,2,'1B','FAIL','2026-02-02 16:35:57','2026-02-02 16:48:01',NULL,0,60,0),(14,3,'1B','FAIL','2026-02-02 17:04:57','2026-02-02 17:11:57','nil',0,60,0),(16,2,'1B','FAIL','2026-02-04 04:27:15','2026-02-04 04:54:36','nil',0,60,0),(17,3,'1B','PASS','2026-02-04 04:43:41','2026-02-04 05:55:49','Nil',1,95,1),(18,2,'1A','PASS','2026-02-04 05:32:49','2026-02-04 05:50:00','Nil',1,60,0),(19,2,'1B','FAIL','2026-02-04 09:27:56','2026-02-04 10:26:04',NULL,0,60,0),(20,1,'1A','PASS','2026-02-05 05:52:44','2026-02-05 05:54:07','Good',1,60,0),(21,2,'1B','FAIL','2026-02-05 05:54:50','2026-02-05 06:52:00','nil',0,60,0),(22,2,'1B','PASS','2026-02-05 07:49:13','2026-02-05 08:44:19','Good',1,120,1),(23,1,'1A','PASS','2026-02-05 09:00:29','2026-02-05 09:03:27','Nil',1,120,0),(24,1,'1B','PASS','2026-02-05 09:04:21','2026-02-05 09:07:47','Nil',1,120,0);
/*!40000 ALTER TABLE `test_sessions` ENABLE KEYS */;
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
\n\n-- ===== mobiledev_portal_test_session_questions.sql =====\n
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
\n\n-- ===== mobiledev_portal_test_case_results.sql =====\n
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
-- Table structure for table `test_case_results`
--

DROP TABLE IF EXISTS `test_case_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_case_results` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `test_session_id` bigint NOT NULL,
  `problem_id` bigint NOT NULL,
  `test_case_id` bigint NOT NULL,
  `status` enum('PASS','FAIL') NOT NULL,
  `output` text,
  `executed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `test_session_id` (`test_session_id`),
  KEY `problem_id` (`problem_id`),
  KEY `test_case_id` (`test_case_id`),
  CONSTRAINT `test_case_results_ibfk_1` FOREIGN KEY (`test_session_id`) REFERENCES `test_sessions` (`id`),
  CONSTRAINT `test_case_results_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`),
  CONSTRAINT `test_case_results_ibfk_3` FOREIGN KEY (`test_case_id`) REFERENCES `test_cases` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=231 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_case_results`
--

LOCK TABLES `test_case_results` WRITE;
/*!40000 ALTER TABLE `test_case_results` DISABLE KEYS */;
INSERT INTO `test_case_results` VALUES (31,2,1,1,'PASS',NULL,'2026-01-30 06:06:55'),(32,2,1,2,'PASS',NULL,'2026-01-30 06:06:55'),(33,2,1,3,'PASS',NULL,'2026-01-30 06:06:55'),(34,2,1,4,'PASS',NULL,'2026-01-30 06:06:55'),(35,2,1,5,'PASS',NULL,'2026-01-30 06:06:55'),(36,2,1,6,'PASS',NULL,'2026-01-30 06:06:55'),(37,2,1,7,'PASS',NULL,'2026-01-30 06:06:55'),(38,2,1,8,'PASS',NULL,'2026-01-30 06:06:55'),(39,2,1,9,'PASS',NULL,'2026-01-30 06:06:55'),(40,2,1,10,'PASS',NULL,'2026-01-30 06:06:55'),(41,2,1,1,'PASS',NULL,'2026-01-30 06:07:31'),(42,2,1,2,'PASS',NULL,'2026-01-30 06:07:31'),(43,2,1,3,'PASS',NULL,'2026-01-30 06:07:31'),(44,2,1,4,'PASS',NULL,'2026-01-30 06:07:31'),(45,2,1,5,'PASS',NULL,'2026-01-30 06:07:31'),(46,2,1,6,'PASS',NULL,'2026-01-30 06:07:31'),(47,2,1,7,'PASS',NULL,'2026-01-30 06:07:31'),(48,2,1,8,'PASS',NULL,'2026-01-30 06:07:31'),(49,2,1,9,'PASS',NULL,'2026-01-30 06:07:31'),(50,2,1,10,'PASS',NULL,'2026-01-30 06:07:31'),(51,2,2,11,'PASS',NULL,'2026-01-30 06:08:18'),(52,2,2,12,'PASS',NULL,'2026-01-30 06:08:18'),(53,2,2,13,'PASS',NULL,'2026-01-30 06:08:18'),(54,2,2,14,'PASS',NULL,'2026-01-30 06:08:18'),(55,2,2,15,'PASS',NULL,'2026-01-30 06:08:18'),(56,2,2,16,'PASS',NULL,'2026-01-30 06:08:18'),(57,2,2,17,'PASS',NULL,'2026-01-30 06:08:18'),(58,2,2,18,'PASS',NULL,'2026-01-30 06:08:18'),(59,2,2,19,'PASS',NULL,'2026-01-30 06:08:18'),(60,2,2,20,'PASS',NULL,'2026-01-30 06:08:18'),(61,3,1,1,'PASS',NULL,'2026-01-30 13:48:22'),(62,3,1,2,'PASS',NULL,'2026-01-30 13:48:22'),(63,3,1,3,'PASS',NULL,'2026-01-30 13:48:22'),(64,3,1,4,'PASS',NULL,'2026-01-30 13:48:22'),(65,3,1,5,'PASS',NULL,'2026-01-30 13:48:22'),(66,3,1,6,'PASS',NULL,'2026-01-30 13:48:22'),(67,3,1,7,'PASS',NULL,'2026-01-30 13:48:22'),(68,3,1,8,'PASS',NULL,'2026-01-30 13:48:22'),(69,3,1,9,'PASS',NULL,'2026-01-30 13:48:22'),(70,3,1,10,'PASS',NULL,'2026-01-30 13:48:22'),(71,3,5,41,'PASS',NULL,'2026-01-30 13:49:15'),(72,3,5,42,'PASS',NULL,'2026-01-30 13:49:15'),(73,3,5,43,'PASS',NULL,'2026-01-30 13:49:15'),(74,3,5,57,'PASS',NULL,'2026-01-30 13:49:15'),(75,3,5,58,'PASS',NULL,'2026-01-30 13:49:15'),(76,3,5,59,'PASS',NULL,'2026-01-30 13:49:15'),(77,3,5,60,'PASS',NULL,'2026-01-30 13:49:15'),(78,3,5,61,'PASS',NULL,'2026-01-30 13:49:15'),(79,3,5,62,'PASS',NULL,'2026-01-30 13:49:15'),(80,3,5,63,'PASS',NULL,'2026-01-30 13:49:15'),(81,18,7,47,'FAIL',NULL,'2026-02-04 05:34:02'),(82,18,7,48,'FAIL',NULL,'2026-02-04 05:34:02'),(83,18,7,49,'FAIL',NULL,'2026-02-04 05:34:02'),(84,18,7,50,'FAIL',NULL,'2026-02-04 05:34:02'),(85,18,7,51,'FAIL',NULL,'2026-02-04 05:34:02'),(86,18,7,52,'FAIL',NULL,'2026-02-04 05:34:02'),(87,18,7,53,'FAIL',NULL,'2026-02-04 05:34:02'),(88,18,7,54,'FAIL',NULL,'2026-02-04 05:34:02'),(89,18,7,55,'FAIL',NULL,'2026-02-04 05:34:02'),(90,18,7,56,'FAIL',NULL,'2026-02-04 05:34:02'),(91,18,1,1,'FAIL',NULL,'2026-02-04 05:35:57'),(92,18,1,2,'FAIL',NULL,'2026-02-04 05:35:57'),(93,18,1,3,'FAIL',NULL,'2026-02-04 05:35:57'),(94,18,1,4,'FAIL',NULL,'2026-02-04 05:35:57'),(95,18,1,5,'FAIL',NULL,'2026-02-04 05:35:57'),(96,18,1,6,'FAIL',NULL,'2026-02-04 05:35:57'),(97,18,1,7,'FAIL',NULL,'2026-02-04 05:35:57'),(98,18,1,8,'FAIL',NULL,'2026-02-04 05:35:57'),(99,18,1,9,'FAIL',NULL,'2026-02-04 05:35:57'),(100,18,1,10,'FAIL',NULL,'2026-02-04 05:35:57'),(101,18,1,1,'FAIL',NULL,'2026-02-04 05:41:19'),(102,18,1,2,'FAIL',NULL,'2026-02-04 05:41:19'),(103,18,1,3,'FAIL',NULL,'2026-02-04 05:41:19'),(104,18,1,4,'FAIL',NULL,'2026-02-04 05:41:19'),(105,18,1,5,'FAIL',NULL,'2026-02-04 05:41:19'),(106,18,1,6,'FAIL',NULL,'2026-02-04 05:41:19'),(107,18,1,7,'FAIL',NULL,'2026-02-04 05:41:19'),(108,18,1,8,'FAIL',NULL,'2026-02-04 05:41:19'),(109,18,1,9,'FAIL',NULL,'2026-02-04 05:41:19'),(110,18,1,10,'FAIL',NULL,'2026-02-04 05:41:19'),(111,18,1,1,'FAIL',NULL,'2026-02-04 05:43:09'),(112,18,1,2,'FAIL',NULL,'2026-02-04 05:43:09'),(113,18,1,3,'FAIL',NULL,'2026-02-04 05:43:09'),(114,18,1,4,'FAIL',NULL,'2026-02-04 05:43:09'),(115,18,1,5,'FAIL',NULL,'2026-02-04 05:43:09'),(116,18,1,6,'FAIL',NULL,'2026-02-04 05:43:09'),(117,18,1,7,'FAIL',NULL,'2026-02-04 05:43:09'),(118,18,1,8,'FAIL',NULL,'2026-02-04 05:43:09'),(119,18,1,9,'FAIL',NULL,'2026-02-04 05:43:09'),(120,18,1,10,'FAIL',NULL,'2026-02-04 05:43:09'),(121,18,1,1,'FAIL',NULL,'2026-02-04 05:45:29'),(122,18,1,2,'FAIL',NULL,'2026-02-04 05:45:29'),(123,18,1,3,'FAIL',NULL,'2026-02-04 05:45:29'),(124,18,1,4,'FAIL',NULL,'2026-02-04 05:45:29'),(125,18,1,5,'FAIL',NULL,'2026-02-04 05:45:29'),(126,18,1,6,'FAIL',NULL,'2026-02-04 05:45:29'),(127,18,1,7,'FAIL',NULL,'2026-02-04 05:45:29'),(128,18,1,8,'FAIL',NULL,'2026-02-04 05:45:29'),(129,18,1,9,'FAIL',NULL,'2026-02-04 05:45:29'),(130,18,1,10,'FAIL',NULL,'2026-02-04 05:45:29'),(131,18,1,1,'FAIL',NULL,'2026-02-04 05:46:00'),(132,18,1,2,'FAIL',NULL,'2026-02-04 05:46:00'),(133,18,1,3,'FAIL',NULL,'2026-02-04 05:46:00'),(134,18,1,4,'FAIL',NULL,'2026-02-04 05:46:00'),(135,18,1,5,'FAIL',NULL,'2026-02-04 05:46:00'),(136,18,1,6,'FAIL',NULL,'2026-02-04 05:46:00'),(137,18,1,7,'FAIL',NULL,'2026-02-04 05:46:00'),(138,18,1,8,'FAIL',NULL,'2026-02-04 05:46:00'),(139,18,1,9,'FAIL',NULL,'2026-02-04 05:46:00'),(140,18,1,10,'FAIL',NULL,'2026-02-04 05:46:00'),(141,18,1,1,'PASS',NULL,'2026-02-04 05:47:04'),(142,18,1,2,'PASS',NULL,'2026-02-04 05:47:04'),(143,18,1,3,'PASS',NULL,'2026-02-04 05:47:04'),(144,18,1,4,'PASS',NULL,'2026-02-04 05:47:04'),(145,18,1,5,'PASS',NULL,'2026-02-04 05:47:04'),(146,18,1,6,'PASS',NULL,'2026-02-04 05:47:04'),(147,18,1,7,'PASS',NULL,'2026-02-04 05:47:04'),(148,18,1,8,'PASS',NULL,'2026-02-04 05:47:04'),(149,18,1,9,'PASS',NULL,'2026-02-04 05:47:04'),(150,18,1,10,'PASS',NULL,'2026-02-04 05:47:04'),(151,18,7,47,'PASS',NULL,'2026-02-04 05:49:24'),(152,18,7,48,'PASS',NULL,'2026-02-04 05:49:24'),(153,18,7,49,'PASS',NULL,'2026-02-04 05:49:24'),(154,18,7,50,'PASS',NULL,'2026-02-04 05:49:24'),(155,18,7,51,'PASS',NULL,'2026-02-04 05:49:24'),(156,18,7,52,'PASS',NULL,'2026-02-04 05:49:24'),(157,18,7,53,'PASS',NULL,'2026-02-04 05:49:24'),(158,18,7,54,'PASS',NULL,'2026-02-04 05:49:24'),(159,18,7,55,'PASS',NULL,'2026-02-04 05:49:24'),(160,18,7,56,'PASS',NULL,'2026-02-04 05:49:24'),(161,20,7,47,'PASS',NULL,'2026-02-05 05:53:26'),(162,20,7,48,'PASS',NULL,'2026-02-05 05:53:26'),(163,20,7,49,'PASS',NULL,'2026-02-05 05:53:26'),(164,20,7,50,'PASS',NULL,'2026-02-05 05:53:26'),(165,20,7,51,'PASS',NULL,'2026-02-05 05:53:26'),(166,20,7,52,'PASS',NULL,'2026-02-05 05:53:26'),(167,20,7,53,'PASS',NULL,'2026-02-05 05:53:26'),(168,20,7,54,'PASS',NULL,'2026-02-05 05:53:26'),(169,20,7,55,'PASS',NULL,'2026-02-05 05:53:26'),(170,20,7,56,'PASS',NULL,'2026-02-05 05:53:26'),(171,20,2,11,'PASS',NULL,'2026-02-05 05:53:50'),(172,20,2,12,'PASS',NULL,'2026-02-05 05:53:50'),(173,20,2,13,'PASS',NULL,'2026-02-05 05:53:50'),(174,20,2,14,'PASS',NULL,'2026-02-05 05:53:50'),(175,20,2,15,'PASS',NULL,'2026-02-05 05:53:50'),(176,20,2,16,'PASS',NULL,'2026-02-05 05:53:50'),(177,20,2,17,'PASS',NULL,'2026-02-05 05:53:50'),(178,20,2,18,'PASS',NULL,'2026-02-05 05:53:50'),(179,20,2,19,'PASS',NULL,'2026-02-05 05:53:50'),(180,20,2,20,'PASS',NULL,'2026-02-05 05:53:50'),(181,23,4,31,'FAIL',NULL,'2026-02-05 09:01:05'),(182,23,4,32,'FAIL',NULL,'2026-02-05 09:01:05'),(183,23,4,33,'FAIL',NULL,'2026-02-05 09:01:05'),(184,23,4,34,'FAIL',NULL,'2026-02-05 09:01:05'),(185,23,4,35,'FAIL',NULL,'2026-02-05 09:01:05'),(186,23,4,36,'FAIL',NULL,'2026-02-05 09:01:05'),(187,23,4,37,'FAIL',NULL,'2026-02-05 09:01:05'),(188,23,4,38,'FAIL',NULL,'2026-02-05 09:01:05'),(189,23,4,39,'FAIL',NULL,'2026-02-05 09:01:05'),(190,23,4,40,'FAIL',NULL,'2026-02-05 09:01:05'),(191,23,4,31,'FAIL',NULL,'2026-02-05 09:01:42'),(192,23,4,32,'FAIL',NULL,'2026-02-05 09:01:42'),(193,23,4,33,'FAIL',NULL,'2026-02-05 09:01:42'),(194,23,4,34,'FAIL',NULL,'2026-02-05 09:01:42'),(195,23,4,35,'FAIL',NULL,'2026-02-05 09:01:42'),(196,23,4,36,'FAIL',NULL,'2026-02-05 09:01:42'),(197,23,4,37,'FAIL',NULL,'2026-02-05 09:01:42'),(198,23,4,38,'FAIL',NULL,'2026-02-05 09:01:42'),(199,23,4,39,'FAIL',NULL,'2026-02-05 09:01:42'),(200,23,4,40,'FAIL',NULL,'2026-02-05 09:01:42'),(201,23,4,31,'PASS',NULL,'2026-02-05 09:02:28'),(202,23,4,32,'PASS',NULL,'2026-02-05 09:02:28'),(203,23,4,33,'PASS',NULL,'2026-02-05 09:02:28'),(204,23,4,34,'PASS',NULL,'2026-02-05 09:02:28'),(205,23,4,35,'PASS',NULL,'2026-02-05 09:02:28'),(206,23,4,36,'PASS',NULL,'2026-02-05 09:02:28'),(207,23,4,37,'PASS',NULL,'2026-02-05 09:02:28'),(208,23,4,38,'PASS',NULL,'2026-02-05 09:02:28'),(209,23,4,39,'PASS',NULL,'2026-02-05 09:02:28'),(210,23,4,40,'PASS',NULL,'2026-02-05 09:02:28'),(211,23,1,1,'FAIL',NULL,'2026-02-05 09:03:07'),(212,23,1,2,'FAIL',NULL,'2026-02-05 09:03:07'),(213,23,1,3,'FAIL',NULL,'2026-02-05 09:03:07'),(214,23,1,4,'FAIL',NULL,'2026-02-05 09:03:07'),(215,23,1,5,'FAIL',NULL,'2026-02-05 09:03:07'),(216,23,1,6,'FAIL',NULL,'2026-02-05 09:03:07'),(217,23,1,7,'FAIL',NULL,'2026-02-05 09:03:07'),(218,23,1,8,'FAIL',NULL,'2026-02-05 09:03:07'),(219,23,1,9,'FAIL',NULL,'2026-02-05 09:03:07'),(220,23,1,10,'FAIL',NULL,'2026-02-05 09:03:07'),(221,23,1,1,'PASS',NULL,'2026-02-05 09:03:23'),(222,23,1,2,'PASS',NULL,'2026-02-05 09:03:23'),(223,23,1,3,'PASS',NULL,'2026-02-05 09:03:23'),(224,23,1,4,'PASS',NULL,'2026-02-05 09:03:23'),(225,23,1,5,'PASS',NULL,'2026-02-05 09:03:23'),(226,23,1,6,'PASS',NULL,'2026-02-05 09:03:23'),(227,23,1,7,'PASS',NULL,'2026-02-05 09:03:23'),(228,23,1,8,'PASS',NULL,'2026-02-05 09:03:23'),(229,23,1,9,'PASS',NULL,'2026-02-05 09:03:23'),(230,23,1,10,'PASS',NULL,'2026-02-05 09:03:23');
/*!40000 ALTER TABLE `test_case_results` ENABLE KEYS */;
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
\n\n-- ===== mobiledev_portal_test_session_submissions.sql =====\n
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
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_session_submissions`
--

LOCK TABLES `test_session_submissions` WRITE;
/*!40000 ALTER TABLE `test_session_submissions` DISABLE KEYS */;
INSERT INTO `test_session_submissions` VALUES (4,2,2,1,'String reverseString(String input) {\n  // 1. Split the string into a list of characters\n  // 2. Reverse the list\n  // 3. Join the characters back into a string\n  return input.split(\'\').reversed.join(\'\');\n}','PASS','2026-01-30 11:36:55',NULL,NULL,NULL,'2026-01-30 18:38:15',NULL,NULL,NULL,NULL,NULL),(5,2,2,1,'String reverseString(String input) {\n  // 1. Split the string into a list of characters\n  // 2. Reverse the list\n  // 3. Join the characters back into a string\n  return input.split(\'\').reversed.join(\'\');\n}','PASS','2026-01-30 11:37:31',NULL,NULL,NULL,'2026-01-30 18:38:15',NULL,NULL,NULL,NULL,NULL),(6,2,2,2,'bool isPalindrome(String text) {\n  // Normalize to lowercase so \'Level\' is same as \'level\'\n  String clean = text.toLowerCase();\n  \n  // Compare the string to its reversed version\n  return clean == clean.split(\'\').reversed.join(\'\');\n}','FAIL','2026-01-30 11:38:18',NULL,NULL,NULL,'2026-01-30 18:38:15',NULL,NULL,NULL,NULL,NULL),(7,3,2,1,'String reverseString(String input) {\n  // 1. Split the string into a list of characters\n  // 2. Reverse the list\n  // 3. Join the characters back into a string\n  return input.split(\'\').reversed.join(\'\');\n}','PASS','2026-01-30 19:18:22',NULL,NULL,NULL,'2026-01-30 19:18:22',NULL,NULL,NULL,NULL,NULL),(8,3,2,5,'int add(int a, int b) {\n  // Return the sum of a and b\n  return a + b;\n}','PASS','2026-01-30 19:19:15',NULL,NULL,NULL,'2026-01-30 19:19:15',NULL,NULL,NULL,NULL,NULL),(9,7,3,9,'import \'package:flutter/material.dart\';\n\nclass SettingsScreen extends StatelessWidget {\n  const SettingsScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      backgroundColor: Colors.white,\n      appBar: AppBar(\n        elevation: 0,\n        backgroundColor: Colors.white,\n        leading: const Icon(Icons.arrow_back, color: Colors.black),\n        actions: const [\n          Padding(\n            padding: EdgeInsets.only(right: 16),\n            child: Icon(Icons.menu, color: Colors.black),\n          )\n        ],\n      ),\n      body: Padding(\n        padding: const EdgeInsets.all(16),\n        child: Column(\n          crossAxisAlignment: CrossAxisAlignment.start,\n          children: [\n            const Text(\n              \"Profile And Settings\",\n              style: TextStyle(\n                fontSize: 20,\n                fontWeight: FontWeight.bold,\n              ),\n            ),\n            const SizedBox(height: 24),\n            _buildItem(Icons.home, \"Home\"),\n            _buildItem(Icons.person, \"Personal Information\"),\n            _buildItem(Icons.notifications, \"Notification Settings\"),\n            _buildItem(Icons.palette, \"Customize App Appearance\"),\n            _buildItem(Icons.help_outline, \"Help And Support\"),\n          ],\n        ),\n      ),\n      bottomNavigationBar: BottomNavigationBar(\n        items: const [\n          BottomNavigationBarItem(icon: Icon(Icons.home), label: \"Home\"),\n          BottomNavigationBarItem(icon: Icon(Icons.calendar_today), label: \"Calender\"),\n          BottomNavigationBarItem(icon: Icon(Icons.notifications), label: \"Notification\"),\n          BottomNavigationBarItem(icon: Icon(Icons.settings), label: \"Settings\"),\n        ],\n        currentIndex: 3,\n        selectedItemColor: Colors.blue,\n        unselectedItemColor: Colors.grey,\n      ),\n    );\n  }\n\n  Widget _buildItem(IconData icon, String title) {\n    return ListTile(\n      leading: CircleAvatar(\n        backgroundColor: const Color(0xFFEAEAFF),\n        child: Icon(icon, color: Colors.blue),\n      ),\n      title: Text(title),\n      trailing: const Icon(Icons.chevron_right),\n    );\n  }\n}\nWidget buildUI() {\n  return const SettingsScreen();\n}','FAIL','2026-01-31 10:00:51','/uploads/ui_previews/submit-7-9-1769833851450.png',66,65.65,'2026-02-02 15:28:39',88,1,'2026-02-02 15:28:39',NULL,77.00),(10,12,2,8,'import \'package:flutter/material.dart\';\n\nWidget buildUI() {\n  return Scaffold(\n    backgroundColor: Colors.white,\n    appBar: AppBar(\n      elevation: 0,\n      backgroundColor: Colors.white,\n      leading: Icon(Icons.arrow_back, color: Colors.black),\n      actions: [\n        Padding(\n          padding: EdgeInsets.only(right: 16),\n          child: Icon(Icons.menu, color: Colors.black),\n        ),\n      ],\n    ),\n    body: Padding(\n      padding: EdgeInsets.all(16),\n      child: Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n          Text(\n            \"Profile And Settings\",\n            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),\n          ),\n          SizedBox(height: 24),\n          _buildItem(Icons.home, \"Home\"),\n          _buildItem(Icons.person, \"Personal Information\"),\n          _buildItem(Icons.notifications, \"Notification Settings\"),\n          _buildItem(Icons.palette, \"Customize App Appearance\"),\n          _buildItem(Icons.help_outline, \"Help And Support\"),\n        ],\n      ),\n    ),\n    bottomNavigationBar: BottomNavigationBar(\n      type: BottomNavigationBarType.fixed,\n      items: [\n        BottomNavigationBarItem(icon: Icon(Icons.home), label: \"Home\"),\n        BottomNavigationBarItem(\n          icon: Icon(Icons.calendar_today),\n          label: \"Calender\",\n        ),\n        BottomNavigationBarItem(\n          icon: Icon(Icons.notifications),\n          label: \"Notification\",\n        ),\n        BottomNavigationBarItem(icon: Icon(Icons.settings), label: \"Settings\"),\n      ],\n      currentIndex: 3,\n      selectedItemColor: Colors.blue,\n      unselectedItemColor: Colors.grey,\n    ),\n  );\n}\n\nWidget _buildItem(IconData icon, String title) {\n  return Container(\n    margin: EdgeInsets.only(bottom: 8),\n    decoration: BoxDecoration(\n      color: Colors.white,\n      borderRadius: BorderRadius.circular(12),\n    ),\n    child: ListTile(\n      leading: CircleAvatar(\n        backgroundColor: Color(0xFFEEF2FF),\n        child: Icon(icon, color: Colors.blue, size: 20),\n      ),\n      title: Text(title, style: TextStyle(fontSize: 16, color: Colors.black87)),\n      trailing: Icon(Icons.chevron_right, color: Colors.grey),\n    ),\n  );\n}','FAIL','2026-02-02 15:27:58','/uploads/ui_previews/submit-12-8-1770026277398.png',2,2.36,'2026-02-02 15:28:52',77,1,'2026-02-02 15:28:52',NULL,39.50),(11,13,2,8,'import \'package:flutter/material.dart\';\n\nWidget buildUI() {\n  const gradientTop = Color(0xFF0B0B8F);\n  const gradientBottom = Color(0xFF0B0B6D);\n  const accentGreen = Color(0xFF36C984);\n\n  return Scaffold(\n    body: Container(\n      width: double.infinity,\n      height: double.infinity,\n      decoration: const BoxDecoration(\n        gradient: LinearGradient(\n          begin: Alignment.topCenter,\n          end: Alignment.bottomCenter,\n          colors: [gradientTop, gradientBottom],\n        ),\n      ),\n      child: SafeArea(\n        child: Padding(\n          padding: const EdgeInsets.symmetric(horizontal: 24),\n          child: Column(\n            mainAxisAlignment: MainAxisAlignment.center,\n            children: [\n              const SizedBox(height: 8),\n              const Text(\n                \"PCDP App\",\n                style: TextStyle(\n                  color: Colors.white,\n                  fontSize: 24,\n                  fontWeight: FontWeight.w600,\n                ),\n              ),\n              const SizedBox(height: 24),\n              const Text(\n                \"Welcome Back!\",\n                style: TextStyle(\n                  color: Colors.white,\n                  fontSize: 26,\n                  fontWeight: FontWeight.w700,\n                ),\n              ),\n              const SizedBox(height: 10),\n              const Text(\n                \"Please Log into your existing account\",\n                textAlign: TextAlign.center,\n                style: TextStyle(\n                  color: Colors.white70,\n                  fontSize: 14,\n                ),\n              ),\n              const SizedBox(height: 28),\n              _roundedField(\n                hint: \"Your Email\",\n                isPassword: false,\n              ),\n              const SizedBox(height: 14),\n              _roundedField(\n                hint: \"Your Password\",\n                isPassword: true,\n              ),\n              const SizedBox(height: 22),\n              SizedBox(\n                width: double.infinity,\n                height: 52,\n                child: ElevatedButton(\n                  style: ElevatedButton.styleFrom(\n                    backgroundColor: accentGreen,\n                    shape: RoundedRectangleBorder(\n                      borderRadius: BorderRadius.circular(26),\n                    ),\n                    elevation: 0,\n                  ),\n                  onPressed: () {},\n                  child: const Text(\n                    \"Log in\",\n                    style: TextStyle(\n                      color: Colors.white,\n                      fontSize: 18,\n                      fontWeight: FontWeight.w600,\n                    ),\n                  ),\n                ),\n              ),\n              const SizedBox(height: 12),\n            ],\n          ),\n        ),\n      ),\n    ),\n  );\n}\n\nWidget _roundedField({required String hint, required bool isPassword}) {\n  return TextField(\n    obscureText: isPassword,\n    style: const TextStyle(color: Colors.white),\n    decoration: InputDecoration(\n      hintText: hint,\n      hintStyle: const TextStyle(color: Colors.white70),\n      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),\n      enabledBorder: OutlineInputBorder(\n        borderRadius: BorderRadius.circular(26),\n        borderSide: const BorderSide(color: Colors.white70, width: 1),\n      ),\n      focusedBorder: OutlineInputBorder(\n        borderRadius: BorderRadius.circular(26),\n        borderSide: const BorderSide(color: Colors.white, width: 1.2),\n      ),\n    ),\n  );\n}','FAIL','2026-02-02 22:18:00','/uploads/ui_previews/submit-13-8-1770050880753.png',1,1.37,'2026-02-02 22:47:07',98,1,'2026-02-02 22:47:07',NULL,49.50),(12,14,3,9,'import \'package:flutter/material.dart\';\n\nWidget buildUI() {\n  return Scaffold(\n    backgroundColor: Colors.white,\n    appBar: AppBar(\n      elevation: 0,\n      backgroundColor: Colors.white,\n      leading: const Icon(Icons.arrow_back, color: Colors.black),\n      actions: const [\n        Padding(\n          padding: EdgeInsets.only(right: 16),\n          child: CircleAvatar(\n            backgroundColor: Color(0xFFF0F0F0),\n            child: Icon(Icons.menu, color: Colors.black),\n          ),\n        ),\n      ],\n    ),\n    body: Padding(\n      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),\n      child: Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n          const Text(\n            \"Profile And Settings\",\n            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),\n          ),\n          const SizedBox(height: 16),\n          _settingItem(Icons.home, \"Home\"),\n          _divider(),\n          _settingItem(Icons.person, \"Personal Information\"),\n          _divider(),\n          _settingItem(Icons.notifications, \"Notification Settings\"),\n          _divider(),\n          _settingItem(Icons.palette, \"Customize App Appearance\"),\n          _divider(),\n          _settingItem(Icons.help_outline, \"Help And Support\"),\n        ],\n      ),\n    ),\n    bottomNavigationBar: BottomNavigationBar(\n      type: BottomNavigationBarType.fixed,\n      currentIndex: 3,\n      selectedItemColor: Colors.indigo,\n      unselectedItemColor: Colors.grey,\n      items: const [\n        BottomNavigationBarItem(icon: Icon(Icons.home), label: \"Home\"),\n        BottomNavigationBarItem(icon: Icon(Icons.calendar_today), label: \"Calender\"),\n        BottomNavigationBarItem(icon: Icon(Icons.notifications), label: \"Notification\"),\n        BottomNavigationBarItem(icon: Icon(Icons.settings), label: \"Settings\"),\n      ],\n    ),\n  );\n}\n\nWidget _settingItem(IconData icon, String title) {\n  return Padding(\n    padding: const EdgeInsets.symmetric(vertical: 10),\n    child: Row(\n      children: [\n        CircleAvatar(\n          radius: 18,\n          backgroundColor: const Color(0xFFE8EAFF),\n          child: Icon(icon, color: Colors.indigo, size: 18),\n        ),\n        const SizedBox(width: 12),\n        Expanded(\n          child: Text(\n            title,\n            style: const TextStyle(fontSize: 16, color: Colors.black87),\n          ),\n        ),\n        const Icon(Icons.chevron_right, color: Colors.grey),\n      ],\n    ),\n  );\n}\n\nWidget _divider() {\n  return const Divider(height: 1, color: Color(0xFFE6E6E6));\n}','FAIL','2026-02-02 22:41:57','/uploads/ui_previews/submit-14-9-1770052317887.png',10,10.00,'2026-02-02 22:46:54',20,1,'2026-02-02 22:46:54',NULL,15.00),(16,18,2,7,'int maxValue(List<int> nums) {\n  int max = nums[0];\n\n  for (int i = 1; i < nums.length; i++) {\n    if (nums[i] > max) {\n      max = nums[i];\n    }\n  }\n\n  return max;\n}\n','FAIL','2026-02-04 11:04:02',NULL,NULL,NULL,'2026-02-04 11:04:02',NULL,NULL,NULL,NULL,NULL),(17,18,2,1,'String reverseString(String input) {\n  String reversed = \"\";\n\n  for (int i = input.length - 1; i >= 0; i--) {\n    reversed += input[i];\n  }\n\n  return reversed;\n}\n','FAIL','2026-02-04 11:05:57',NULL,NULL,NULL,'2026-02-04 11:05:57',NULL,NULL,NULL,NULL,NULL),(18,18,2,1,'String reverseString(String input) {\n  String reversed = \"\";\n\n  for (int i = input.length - 1; i >= 0; i--) {\n    reversed += input[i];\n  }\n\n  return reversed;\n}\n','FAIL','2026-02-04 11:11:19',NULL,NULL,NULL,'2026-02-04 11:11:19',NULL,NULL,NULL,NULL,NULL),(19,18,2,1,'String reverseString(String input) {\n  String reversed = \"\";\n\n  for (int i = input.length - 1; i >= 0; i--) {\n    reversed += input[i];\n  }\n\n  return reversed;\n}\n','FAIL','2026-02-04 11:13:09',NULL,NULL,NULL,'2026-02-04 11:13:09',NULL,NULL,NULL,NULL,NULL),(20,18,2,1,'String reverseString(String input) {\n  String reversed = \"\";\n\n  for (int i = input.length - 1; i >= 0; i--) {\n    reversed += input[i];\n  }\n\n  return reversed;\n}\n','FAIL','2026-02-04 11:15:29',NULL,NULL,NULL,'2026-02-04 11:15:29',NULL,NULL,NULL,NULL,NULL),(21,18,2,1,'String reverseString(String input) {\n  String reversed = \"\";\n\n  for (int i = input.length - 1; i >= 0; i--) {\n    reversed += input[i];\n  }\n\n  return reversed;\n}\n','FAIL','2026-02-04 11:16:00',NULL,NULL,NULL,'2026-02-04 11:16:00',NULL,NULL,NULL,NULL,NULL),(22,18,2,1,'String reverseString(String input) {\n  String reversed = \"\";\n\n  for (int i = input.length - 1; i >= 0; i--) {\n    reversed += input[i];\n  }\n\n  return reversed;\n}\n','PASS','2026-02-04 11:17:04',NULL,NULL,NULL,'2026-02-04 11:17:04',NULL,NULL,NULL,NULL,NULL),(23,18,2,7,'int maxValue(List<int> nums) {\n  int max = nums[0];\n\n  for (int i = 1; i < nums.length; i++) {\n    if (nums[i] > max) {\n      max = nums[i];\n    }\n  }\n\n  return max;\n}\n','PASS','2026-02-04 11:19:24',NULL,NULL,NULL,'2026-02-04 11:19:24',NULL,NULL,NULL,NULL,NULL),(24,17,3,8,'import \'package:flutter/material.dart\';\n\nWidget buildUI() {\n  const gradientTop = Color(0xFF0B0B8F);\n  const gradientBottom = Color(0xFF0B0B6D);\n  const accentGreen = Color(0xFF36C984);\n\n  return Scaffold(\n    body: Container(\n      width: double.infinity,\n      height: double.infinity,\n      decoration: const BoxDecoration(\n        gradient: LinearGradient(\n          begin: Alignment.topCenter,\n          end: Alignment.bottomCenter,\n          colors: [gradientTop, gradientBottom],\n        ),\n      ),\n      child: SafeArea(\n        child: Padding(\n          padding: const EdgeInsets.symmetric(horizontal: 24),\n          child: Column(\n            mainAxisAlignment: MainAxisAlignment.center,\n            children: [\n              const SizedBox(height: 8),\n              const Text(\n                \"PCDP App\",\n                style: TextStyle(\n                  color: Colors.white,\n                  fontSize: 24,\n                  fontWeight: FontWeight.w600,\n                ),\n              ),\n              const SizedBox(height: 24),\n              const Text(\n                \"Welcome Back!\",\n                style: TextStyle(\n                  color: Colors.white,\n                  fontSize: 26,\n                  fontWeight: FontWeight.w700,\n                ),\n              ),\n              const SizedBox(height: 10),\n              const Text(\n                \"Please Log into your existing account\",\n                textAlign: TextAlign.center,\n                style: TextStyle(\n                  color: Colors.white70,\n                  fontSize: 14,\n                ),\n              ),\n              const SizedBox(height: 28),\n              _roundedField(\n                hint: \"Your Email\",\n                isPassword: false,\n              ),\n              const SizedBox(height: 14),\n              _roundedField(\n                hint: \"Your Password\",\n                isPassword: true,\n              ),\n              const SizedBox(height: 22),\n              SizedBox(\n                width: double.infinity,\n                height: 52,\n                child: ElevatedButton(\n                  style: ElevatedButton.styleFrom(\n                    backgroundColor: accentGreen,\n                    shape: RoundedRectangleBorder(\n                      borderRadius: BorderRadius.circular(26),\n                    ),\n                    elevation: 0,\n                  ),\n                  onPressed: () {},\n                  child: const Text(\n                    \"Log in\",\n                    style: TextStyle(\n                      color: Colors.white,\n                      fontSize: 18,\n                      fontWeight: FontWeight.w600,\n                    ),\n                  ),\n                ),\n              ),\n              const SizedBox(height: 12),\n            ],\n          ),\n        ),\n      ),\n    ),\n  );\n}\n\nWidget _roundedField({required String hint, required bool isPassword}) {\n  return TextField(\n    obscureText: isPassword,\n    style: const TextStyle(color: Colors.white),\n    decoration: InputDecoration(\n      hintText: hint,\n      hintStyle: const TextStyle(color: Colors.white70),\n      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),\n      enabledBorder: OutlineInputBorder(\n        borderRadius: BorderRadius.circular(26),\n        borderSide: const BorderSide(color: Colors.white70, width: 1),\n      ),\n      focusedBorder: OutlineInputBorder(\n        borderRadius: BorderRadius.circular(26),\n        borderSide: const BorderSide(color: Colors.white, width: 1.2),\n      ),\n    ),\n  );\n}','PASS','2026-02-04 11:25:41','/uploads/ui_previews/submit-17-8-1770184541940.png',83,83.00,'2026-02-04 11:26:14',100,1,'2026-02-04 11:26:14','Good',91.50),(25,20,1,7,'int maxValue(List<int> nums) {\n  if (nums.isEmpty) return 0;\n\n  int currentMax = nums[0];\n  for (int i = 1; i < nums.length; i++) {\n    if (nums[i] > currentMax) {\n      currentMax = nums[i];\n    }\n  }\n  return currentMax;\n}','PASS','2026-02-05 11:23:26',NULL,NULL,NULL,'2026-02-05 11:23:26',NULL,NULL,NULL,NULL,NULL),(26,20,1,2,'bool isPalindrome(String input) {\n  int left = 0;\n  int right = input.length - 1;\n\n  while (left < right) {\n    // Compare characters at the current pointers\n    if (input[left] != input[right]) {\n      return false; // Not a palindrome, exit early\n    }\n    \n    // Move pointers toward the middle\n    left++;\n    right--;\n  }\n\n  return true; // If we finish the loop, it\'s a palindrome\n}','PASS','2026-02-05 11:23:50',NULL,NULL,NULL,'2026-02-05 11:23:50',NULL,NULL,NULL,NULL,NULL),(27,22,2,10,'import \'package:flutter/material.dart\';\n\nWidget buildUI() {\n  return const AdminDashboardScreen();\n}\n\nclass AdminDashboardScreen extends StatelessWidget {\n  const AdminDashboardScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    const red = Color(0xFFD62828);\n    const lightBg = Color(0xFFF7F7F9);\n    const border = Color(0xFFE6E6E6);\n\n    return Scaffold(\n      backgroundColor: Colors.white,\n      body: SafeArea(\n        child: SingleChildScrollView(\n          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),\n          child: Column(\n            crossAxisAlignment: CrossAxisAlignment.stretch,\n            children: [\n              // Welcome card\n              Container(\n                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),\n                decoration: BoxDecoration(\n                  color: red,\n                  borderRadius: BorderRadius.circular(10),\n                ),\n                child: Column(\n                  children: const [\n                    Text(\n                      \'Welcome, Pastor John\',\n                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),\n                    ),\n                    SizedBox(height: 4),\n                    Text(\n                      \'Grace Community Church • Admin\',\n                      style: TextStyle(color: Colors.white70, fontSize: 12),\n                    ),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Stats grid (2x2)\n              GridView.count(\n                crossAxisCount: 2,\n                shrinkWrap: true,\n                physics: const NeverScrollableScrollPhysics(),\n                crossAxisSpacing: 12,\n                mainAxisSpacing: 12,\n                children: const [\n                  StatCard(title: \'Total Members\', value: \'247\'),\n                  StatCard(title: \'Ministers\', value: \'12\'),\n                  StatCard(title: \'Ministries\', value: \'15\'),\n                  StatCard(title: \'Active Events\', value: \'8\'),\n                ],\n              ),\n              const SizedBox(height: 12),\n\n              // Quick Actions\n              SectionCard(\n                title: \'Quick Actions\',\n                child: GridView.count(\n                  crossAxisCount: 2,\n                  shrinkWrap: true,\n                  physics: const NeverScrollableScrollPhysics(),\n                  crossAxisSpacing: 12,\n                  mainAxisSpacing: 12,\n                  children: const [\n                    ActionCard(icon: Icons.add, label: \'Add Member\'),\n                    ActionCard(icon: Icons.campaign, label: \'Send Notification\'),\n                    ActionCard(icon: Icons.event, label: \'Create Event\'),\n                    ActionCard(icon: Icons.church, label: \'Add Ministry\'),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Pending Actions\n              SectionCard(\n                title: \'Pending Actions\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• 5 new member registrations pending approval\'),\n                    SizedBox(height: 4),\n                    Text(\'• 2 event requests awaiting confirmation\'),\n                    SizedBox(height: 4),\n                    Text(\'• 3 profile updates need review\'),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Recent Activity\n              SectionCard(\n                title: \'Recent Activity\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• Sarah Johnson completed profile setup\'),\n                    SizedBox(height: 4),\n                    Text(\'• Youth Ministry event scheduled\'),\n                    SizedBox(height: 4),\n                    Text(\'• New prayer request from Mike Wilson\'),\n                  ],\n                ),\n              ),\n            ],\n          ),\n        ),\n      ),\n      bottomNavigationBar: BottomNavigationBar(\n        selectedItemColor: red,\n        unselectedItemColor: Colors.grey,\n        type: BottomNavigationBarType.fixed,\n        items: const [\n          BottomNavigationBarItem(icon: Icon(Icons.home), label: \'Home\'),\n          BottomNavigationBarItem(icon: Icon(Icons.group), label: \'Members\'),\n          BottomNavigationBarItem(icon: Icon(Icons.event), label: \'Events\'),\n          BottomNavigationBarItem(icon: Icon(Icons.campaign), label: \'Notify\'),\n          BottomNavigationBarItem(icon: Icon(Icons.settings), label: \'Settings\'),\n        ],\n      ),\n    );\n  }\n}\n\nclass StatCard extends StatelessWidget {\n  final String title;\n  final String value;\n  const StatCard({super.key, required this.title, required this.value});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(12),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFFD62828))),\n          const SizedBox(height: 4),\n          Text(title, style: const TextStyle(fontSize: 12, color: Colors.black54)),\n        ],\n      ),\n    );\n  }\n}\n\nclass ActionCard extends StatelessWidget {\n  final IconData icon;\n  final String label;\n  const ActionCard({super.key, required this.icon, required this.label});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: const Color(0xFFF7F7F9),\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.symmetric(vertical: 16),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Icon(icon, color: const Color(0xFFD62828)),\n          const SizedBox(height: 8),\n          Text(label, style: const TextStyle(fontSize: 12)),\n        ],\n      ),\n    );\n  }\n}\n\nclass SectionCard extends StatelessWidget {\n  final String title;\n  final Widget child;\n  const SectionCard({super.key, required this.title, required this.child});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(12),\n      child: Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n          Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),\n          const SizedBox(height: 8),\n          child,\n        ],\n      ),\n    );\n  }\n}','AWAITING_MANUAL','2026-02-05 13:24:14','/uploads/ui_previews/submit-22-10-1770278054308.png',66,66.00,'2026-02-05 13:24:14',NULL,NULL,NULL,NULL,NULL),(28,22,2,10,'import \'package:flutter/material.dart\';\n\nWidget buildUI() {\n  return const AdminDashboardScreen();\n}\n\nclass AdminDashboardScreen extends StatelessWidget {\n  const AdminDashboardScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    const red = Color(0xFFD62828);\n    const lightBg = Color(0xFFF7F7F9);\n    const border = Color(0xFFE6E6E6);\n\n    return Scaffold(\n      backgroundColor: Colors.white,\n      body: SafeArea(\n        child: SingleChildScrollView(\n          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),\n          child: Column(\n            crossAxisAlignment: CrossAxisAlignment.stretch,\n            children: [\n              // Welcome card\n              Container(\n                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),\n                decoration: BoxDecoration(\n                  color: red,\n                  borderRadius: BorderRadius.circular(10),\n                ),\n                child: Column(\n                  children: const [\n                    Text(\n                      \'Welcome, Pastor John\',\n                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),\n                    ),\n                    SizedBox(height: 4),\n                    Text(\n                      \'Grace Community Church • Admin\',\n                      style: TextStyle(color: Colors.white70, fontSize: 12),\n                    ),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Stats grid (2x2)\n              GridView.count(\n                crossAxisCount: 2,\n                shrinkWrap: true,\n                physics: const NeverScrollableScrollPhysics(),\n                crossAxisSpacing: 12,\n                mainAxisSpacing: 12,\n                children: const [\n                  StatCard(title: \'Total Members\', value: \'247\'),\n                  StatCard(title: \'Ministers\', value: \'12\'),\n                  StatCard(title: \'Ministries\', value: \'15\'),\n                  StatCard(title: \'Active Events\', value: \'8\'),\n                ],\n              ),\n              const SizedBox(height: 12),\n\n              // Quick Actions\n              SectionCard(\n                title: \'Quick Actions\',\n                child: GridView.count(\n                  crossAxisCount: 2,\n                  shrinkWrap: true,\n                  physics: const NeverScrollableScrollPhysics(),\n                  crossAxisSpacing: 12,\n                  mainAxisSpacing: 12,\n                  children: const [\n                    ActionCard(icon: Icons.add, label: \'Add Member\'),\n                    ActionCard(icon: Icons.campaign, label: \'Send Notification\'),\n                    ActionCard(icon: Icons.event, label: \'Create Event\'),\n                    ActionCard(icon: Icons.church, label: \'Add Ministry\'),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Pending Actions\n              SectionCard(\n                title: \'Pending Actions\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• 5 new member registrations pending approval\'),\n                    SizedBox(height: 4),\n                    Text(\'• 2 event requests awaiting confirmation\'),\n                    SizedBox(height: 4),\n                    Text(\'• 3 profile updates need review\'),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Recent Activity\n              SectionCard(\n                title: \'Recent Activity\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• Sarah Johnson completed profile setup\'),\n                    SizedBox(height: 4),\n                    Text(\'• Youth Ministry event scheduled\'),\n                    SizedBox(height: 4),\n                    Text(\'• New prayer request from Mike Wilson\'),\n                  ],\n                ),\n              ),\n            ],\n          ),\n        ),\n      ),\n      bottomNavigationBar: BottomNavigationBar(\n        selectedItemColor: red,\n        unselectedItemColor: Colors.grey,\n        type: BottomNavigationBarType.fixed,\n        items: const [\n          BottomNavigationBarItem(icon: Icon(Icons.home), label: \'Home\'),\n          BottomNavigationBarItem(icon: Icon(Icons.group), label: \'Members\'),\n          BottomNavigationBarItem(icon: Icon(Icons.event), label: \'Events\'),\n          BottomNavigationBarItem(icon: Icon(Icons.campaign), label: \'Notify\'),\n          BottomNavigationBarItem(icon: Icon(Icons.settings), label: \'Settings\'),\n        ],\n      ),\n    );\n  }\n}\n\nclass StatCard extends StatelessWidget {\n  final String title;\n  final String value;\n  const StatCard({super.key, required this.title, required this.value});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(12),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFFD62828))),\n          const SizedBox(height: 4),\n          Text(title, style: const TextStyle(fontSize: 12, color: Colors.black54)),\n        ],\n      ),\n    );\n  }\n}\n\nclass ActionCard extends StatelessWidget {\n  final IconData icon;\n  final String label;\n  const ActionCard({super.key, required this.icon, required this.label});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: const Color(0xFFF7F7F9),\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.symmetric(vertical: 16),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Icon(icon, color: const Color(0xFFD62828)),\n          const SizedBox(height: 8),\n          Text(label, style: const TextStyle(fontSize: 12)),\n        ],\n      ),\n    );\n  }\n}\n\nclass SectionCard extends StatelessWidget {\n  final String title;\n  final Widget child;\n  const SectionCard({super.key, required this.title, required this.child});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(12),\n      child: Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n          Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),\n          const SizedBox(height: 8),\n          child,\n        ],\n      ),\n    );\n  }\n}','AWAITING_MANUAL','2026-02-05 13:40:29','/uploads/ui_previews/submit-22-10-1770279029679.png',66,66.00,'2026-02-05 13:40:29',NULL,NULL,NULL,NULL,NULL),(29,22,2,10,'import \'package:flutter/material.dart\';\n\nWidget buildUI() {\n  return const AdminDashboardScreen();\n}\n\nclass AdminDashboardScreen extends StatelessWidget {\n  const AdminDashboardScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    const red = Color(0xFFD62828);\n    const lightBg = Color(0xFFF7F7F9);\n    const border = Color(0xFFE6E6E6);\n\n    return Scaffold(\n      backgroundColor: Colors.white,\n      body: SafeArea(\n        child: SingleChildScrollView(\n          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),\n          child: Column(\n            crossAxisAlignment: CrossAxisAlignment.stretch,\n            children: [\n              // Welcome card\n              Container(\n                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),\n                decoration: BoxDecoration(\n                  color: red,\n                  borderRadius: BorderRadius.circular(10),\n                ),\n                child: Column(\n                  children: const [\n                    Text(\n                      \'Welcome, Pastor John\',\n                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),\n                    ),\n                    SizedBox(height: 4),\n                    Text(\n                      \'Grace Community Church • Admin\',\n                      style: TextStyle(color: Colors.white70, fontSize: 12),\n                    ),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Stats grid (2x2)\n              GridView.count(\n                crossAxisCount: 2,\n                shrinkWrap: true,\n                physics: const NeverScrollableScrollPhysics(),\n                crossAxisSpacing: 12,\n                mainAxisSpacing: 12,\n                children: const [\n                  StatCard(title: \'Total Members\', value: \'247\'),\n                  StatCard(title: \'Ministers\', value: \'12\'),\n                  StatCard(title: \'Ministries\', value: \'15\'),\n                  StatCard(title: \'Active Events\', value: \'8\'),\n                ],\n              ),\n              const SizedBox(height: 12),\n\n              // Quick Actions\n              SectionCard(\n                title: \'Quick Actions\',\n                child: GridView.count(\n                  crossAxisCount: 2,\n                  shrinkWrap: true,\n                  physics: const NeverScrollableScrollPhysics(),\n                  crossAxisSpacing: 12,\n                  mainAxisSpacing: 12,\n                  children: const [\n                    ActionCard(icon: Icons.add, label: \'Add Member\'),\n                    ActionCard(icon: Icons.campaign, label: \'Send Notification\'),\n                    ActionCard(icon: Icons.event, label: \'Create Event\'),\n                    ActionCard(icon: Icons.church, label: \'Add Ministry\'),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Pending Actions\n              SectionCard(\n                title: \'Pending Actions\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• 5 new member registrations pending approval\'),\n                    SizedBox(height: 4),\n                    Text(\'• 2 event requests awaiting confirmation\'),\n                    SizedBox(height: 4),\n                    Text(\'• 3 profile updates need review\'),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Recent Activity\n              SectionCard(\n                title: \'Recent Activity\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• Sarah Johnson completed profile setup\'),\n                    SizedBox(height: 4),\n                    Text(\'• Youth Ministry event scheduled\'),\n                    SizedBox(height: 4),\n                    Text(\'• New prayer request from Mike Wilson\'),\n                  ],\n                ),\n              ),\n            ],\n          ),\n        ),\n      ),\n      bottomNavigationBar: BottomNavigationBar(\n        selectedItemColor: red,\n        unselectedItemColor: Colors.grey,\n        type: BottomNavigationBarType.fixed,\n        items: const [\n          BottomNavigationBarItem(icon: Icon(Icons.home), label: \'Home\'),\n          BottomNavigationBarItem(icon: Icon(Icons.group), label: \'Members\'),\n          BottomNavigationBarItem(icon: Icon(Icons.event), label: \'Events\'),\n          BottomNavigationBarItem(icon: Icon(Icons.campaign), label: \'Notify\'),\n          BottomNavigationBarItem(icon: Icon(Icons.settings), label: \'Settings\'),\n        ],\n      ),\n    );\n  }\n}\n\nclass StatCard extends StatelessWidget {\n  final String title;\n  final String value;\n  const StatCard({super.key, required this.title, required this.value});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(12),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFFD62828))),\n          const SizedBox(height: 4),\n          Text(title, style: const TextStyle(fontSize: 12, color: Colors.black54)),\n        ],\n      ),\n    );\n  }\n}\n\nclass ActionCard extends StatelessWidget {\n  final IconData icon;\n  final String label;\n  const ActionCard({super.key, required this.icon, required this.label});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: const Color(0xFFF7F7F9),\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.symmetric(vertical: 16),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Icon(icon, color: const Color(0xFFD62828)),\n          const SizedBox(height: 8),\n          Text(label, style: const TextStyle(fontSize: 12)),\n        ],\n      ),\n    );\n  }\n}\n\nclass SectionCard extends StatelessWidget {\n  final String title;\n  final Widget child;\n  const SectionCard({super.key, required this.title, required this.child});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(12),\n      child: Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n          Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),\n          const SizedBox(height: 8),\n          child,\n        ],\n      ),\n    );\n  }\n}','AWAITING_MANUAL','2026-02-05 13:41:44','/uploads/ui_previews/submit-22-10-1770279104359.png',68,68.00,'2026-02-05 13:41:44',NULL,NULL,NULL,NULL,NULL),(30,22,2,10,'import \'package:flutter/material.dart\';\n\nWidget buildUI() {\n  return const AdminDashboardScreen();\n}\n\nclass AdminDashboardScreen extends StatelessWidget {\n  const AdminDashboardScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    const red = Color(0xFFD62828);\n    const lightBg = Color(0xFFF7F7F9);\n    const border = Color(0xFFE6E6E6);\n\n    return Scaffold(\n      backgroundColor: Colors.white,\n      body: SafeArea(\n        child: SingleChildScrollView(\n          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),\n          child: Column(\n            crossAxisAlignment: CrossAxisAlignment.stretch,\n            children: [\n              // Welcome card\n              Container(\n                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),\n                decoration: BoxDecoration(\n                  color: red,\n                  borderRadius: BorderRadius.circular(10),\n                ),\n                child: Column(\n                  children: const [\n                    Text(\n                      \'Welcome, Pastor John\',\n                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),\n                    ),\n                    SizedBox(height: 4),\n                    Text(\n                      \'Grace Community Church • Admin\',\n                      style: TextStyle(color: Colors.white70, fontSize: 12),\n                    ),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Stats grid (2x2)\n              GridView.count(\n                crossAxisCount: 2,\n                shrinkWrap: true,\n                physics: const NeverScrollableScrollPhysics(),\n                crossAxisSpacing: 12,\n                mainAxisSpacing: 12,\n                children: const [\n                  StatCard(title: \'Total Members\', value: \'247\'),\n                  StatCard(title: \'Ministers\', value: \'12\'),\n                  StatCard(title: \'Ministries\', value: \'15\'),\n                  StatCard(title: \'Active Events\', value: \'8\'),\n                ],\n              ),\n              const SizedBox(height: 12),\n\n              // Quick Actions\n              SectionCard(\n                title: \'Quick Actions\',\n                child: GridView.count(\n                  crossAxisCount: 2,\n                  shrinkWrap: true,\n                  physics: const NeverScrollableScrollPhysics(),\n                  crossAxisSpacing: 12,\n                  mainAxisSpacing: 12,\n                  children: const [\n                    ActionCard(icon: Icons.add, label: \'Add Member\'),\n                    ActionCard(icon: Icons.campaign, label: \'Send Notification\'),\n                    ActionCard(icon: Icons.event, label: \'Create Event\'),\n                    ActionCard(icon: Icons.church, label: \'Add Ministry\'),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Pending Actions\n              SectionCard(\n                title: \'Pending Actions\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• 5 new member registrations pending approval\'),\n                    SizedBox(height: 4),\n                    Text(\'• 2 event requests awaiting confirmation\'),\n                    SizedBox(height: 4),\n                    Text(\'• 3 profile updates need review\'),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 12),\n\n              // Recent Activity\n              SectionCard(\n                title: \'Recent Activity\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• Sarah Johnson completed profile setup\'),\n                    SizedBox(height: 4),\n                    Text(\'• Youth Ministry event scheduled\'),\n                    SizedBox(height: 4),\n                    Text(\'• New prayer request from Mike Wilson\'),\n                  ],\n                ),\n              ),\n            ],\n          ),\n        ),\n      ),\n      bottomNavigationBar: BottomNavigationBar(\n        selectedItemColor: red,\n        unselectedItemColor: Colors.grey,\n        type: BottomNavigationBarType.fixed,\n        items: const [\n          BottomNavigationBarItem(icon: Icon(Icons.home), label: \'Home\'),\n          BottomNavigationBarItem(icon: Icon(Icons.group), label: \'Members\'),\n          BottomNavigationBarItem(icon: Icon(Icons.event), label: \'Events\'),\n          BottomNavigationBarItem(icon: Icon(Icons.campaign), label: \'Notify\'),\n          BottomNavigationBarItem(icon: Icon(Icons.settings), label: \'Settings\'),\n        ],\n      ),\n    );\n  }\n}\n\nclass StatCard extends StatelessWidget {\n  final String title;\n  final String value;\n  const StatCard({super.key, required this.title, required this.value});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(12),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFFD62828))),\n          const SizedBox(height: 4),\n          Text(title, style: const TextStyle(fontSize: 12, color: Colors.black54)),\n        ],\n      ),\n    );\n  }\n}\n\nclass ActionCard extends StatelessWidget {\n  final IconData icon;\n  final String label;\n  const ActionCard({super.key, required this.icon, required this.label});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: const Color(0xFFF7F7F9),\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.symmetric(vertical: 16),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Icon(icon, color: const Color(0xFFD62828)),\n          const SizedBox(height: 8),\n          Text(label, style: const TextStyle(fontSize: 12)),\n        ],\n      ),\n    );\n  }\n}\n\nclass SectionCard extends StatelessWidget {\n  final String title;\n  final Widget child;\n  const SectionCard({super.key, required this.title, required this.child});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(12),\n      child: Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n          Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),\n          const SizedBox(height: 8),\n          child,\n        ],\n      ),\n    );\n  }\n}','AWAITING_MANUAL','2026-02-05 13:49:13','/uploads/ui_previews/submit-22-10-1770279553016.png',68,68.00,'2026-02-05 13:49:13',NULL,NULL,NULL,NULL,NULL),(31,22,2,10,'import \'package:flutter/material.dart\';\n\nWidget buildUI() {\n  return const AdminDashboardScreen();\n}\n\nclass AdminDashboardScreen extends StatelessWidget {\n  const AdminDashboardScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    const red = Color(0xFFD62828);\n\n    return Scaffold(\n      backgroundColor: Colors.white,\n      body: SafeArea(\n        child: Padding(\n          padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),\n          child: Column(\n            crossAxisAlignment: CrossAxisAlignment.stretch,\n            children: [\n              // Welcome card\n              Container(\n                padding:\n                    const EdgeInsets.symmetric(vertical: 8, horizontal: 10),\n                decoration: BoxDecoration(\n                  color: red,\n                  borderRadius: BorderRadius.circular(10),\n                ),\n                child: Column(\n                  children: const [\n                    Text(\n                      \'Welcome, Pastor John\',\n                      style: TextStyle(\n                          color: Colors.white,\n                          fontWeight: FontWeight.w700,\n                          fontSize: 12),\n                    ),\n                    SizedBox(height: 1),\n                    Text(\n                      \'Grace Community Church • Admin\',\n                      style: TextStyle(color: Colors.white70, fontSize: 10),\n                    ),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 8),\n\n              // Stats grid (2x2)\n              GridView.count(\n                crossAxisCount: 2,\n                shrinkWrap: true,\n                physics: const NeverScrollableScrollPhysics(),\n                crossAxisSpacing: 8,\n                mainAxisSpacing: 8,\n                childAspectRatio: 1.75,\n                children: const [\n                  StatCard(title: \'Total Members\', value: \'247\'),\n                  StatCard(title: \'Ministers\', value: \'12\'),\n                  StatCard(title: \'Ministries\', value: \'15\'),\n                  StatCard(title: \'Active Events\', value: \'8\'),\n                ],\n              ),\n              const SizedBox(height: 8),\n\n              // Quick Actions\n              SectionCard(\n                title: \'Quick Actions\',\n                child: GridView.count(\n                  crossAxisCount: 2,\n                  shrinkWrap: true,\n                  physics: const NeverScrollableScrollPhysics(),\n                  crossAxisSpacing: 8,\n                  mainAxisSpacing: 8,\n                  childAspectRatio: 1.5,\n                  children: const [\n                    ActionCard(icon: Icons.add, label: \'Add Member\'),\n                    ActionCard(\n                        icon: Icons.campaign, label: \'Send Notification\'),\n                    ActionCard(icon: Icons.event, label: \'Create Event\'),\n                    ActionCard(icon: Icons.church, label: \'Add Ministry\'),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 8),\n\n              // Pending Actions\n              SectionCard(\n                title: \'Pending Actions\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• 5 new member registrations pending approval\',\n                        style: TextStyle(fontSize: 9)),\n                    SizedBox(height: 1),\n                    Text(\'• 2 event requests awaiting confirmation\',\n                        style: TextStyle(fontSize: 9)),\n                    SizedBox(height: 1),\n                    Text(\'• 3 profile updates need review\',\n                        style: TextStyle(fontSize: 9)),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 6),\n\n              // Recent Activity\n              SectionCard(\n                title: \'Recent Activity\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• Sarah Johnson completed profile setup\',\n                        style: TextStyle(fontSize: 9)),\n                    SizedBox(height: 1),\n                    Text(\'• Youth Ministry event scheduled\',\n                        style: TextStyle(fontSize: 9)),\n                    SizedBox(height: 1),\n                    Text(\'• New prayer request from Mike Wilson\',\n                        style: TextStyle(fontSize: 9)),\n                  ],\n                ),\n              ),\n            ],\n          ),\n        ),\n      ),\n      bottomNavigationBar: const _DashboardNav(),\n    );\n  }\n}\n\nclass _DashboardNav extends StatelessWidget {\n  const _DashboardNav();\n\n  @override\n  Widget build(BuildContext context) {\n    const red = Color(0xFFD62828);\n    return BottomNavigationBar(\n      selectedItemColor: red,\n      unselectedItemColor: Colors.grey,\n      type: BottomNavigationBarType.fixed,\n      iconSize: 20,\n      selectedFontSize: 10,\n      unselectedFontSize: 10,\n      items: const [\n        BottomNavigationBarItem(icon: Icon(Icons.home), label: \'Home\'),\n        BottomNavigationBarItem(icon: Icon(Icons.group), label: \'Members\'),\n        BottomNavigationBarItem(icon: Icon(Icons.event), label: \'Events\'),\n        BottomNavigationBarItem(icon: Icon(Icons.campaign), label: \'Notify\'),\n        BottomNavigationBarItem(icon: Icon(Icons.settings), label: \'Settings\'),\n      ],\n    );\n  }\n}\n\nclass StatCard extends StatelessWidget {\n  final String title;\n  final String value;\n  const StatCard({super.key, required this.title, required this.value});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(8),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Text(value,\n              style: const TextStyle(\n                  fontSize: 15,\n                  fontWeight: FontWeight.w700,\n                  color: Color(0xFFD62828))),\n          const SizedBox(height: 2),\n          Text(title,\n              style: const TextStyle(fontSize: 9, color: Colors.black54)),\n        ],\n      ),\n    );\n  }\n}\n\nclass ActionCard extends StatelessWidget {\n  final IconData icon;\n  final String label;\n  const ActionCard({super.key, required this.icon, required this.label});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: const Color(0xFFF7F7F9),\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.symmetric(vertical: 8),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Icon(icon, color: const Color(0xFFD62828), size: 18),\n          const SizedBox(height: 4),\n          Text(label, style: const TextStyle(fontSize: 9)),\n        ],\n      ),\n    );\n  }\n}\n\nclass SectionCard extends StatelessWidget {\n  final String title;\n  final Widget child;\n  const SectionCard({super.key, required this.title, required this.child});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(8),\n      child: Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n          Text(title,\n              style:\n                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 11)),\n          const SizedBox(height: 4),\n          child,\n        ],\n      ),\n    );\n  }\n}\n','PASS','2026-02-05 14:13:47','/uploads/ui_previews/submit-22-10-1770281027922.png',72,72.00,'2026-02-05 14:15:28',100,5,'2026-02-05 14:15:28',NULL,86.00),(32,23,1,4,'int add(int a, int b) {\n  return a + b;\n}','FAIL','2026-02-05 14:31:05',NULL,NULL,NULL,'2026-02-05 14:31:05',NULL,NULL,NULL,NULL,NULL),(33,23,1,4,'int add(int a, int b) {\n  return a + b;\n}','FAIL','2026-02-05 14:31:42',NULL,NULL,NULL,'2026-02-05 14:31:42',NULL,NULL,NULL,NULL,NULL),(34,23,1,4,'int sumList(List<int> numbers) {\n  int total = 0;\n  for (int n in numbers) {\n    total += n;\n  }\n  return total;\n}','PASS','2026-02-05 14:32:28',NULL,NULL,NULL,'2026-02-05 14:32:28',NULL,NULL,NULL,NULL,NULL),(35,23,1,1,'String reverseStringManual(String input) {\n  String reversed = \"\";\n  \n  // Start from the last index and move toward the first\n  for (int i = input.length - 1; i >= 0; i--) {\n    reversed += input[i];\n  }\n  \n  return reversed;\n}','FAIL','2026-02-05 14:33:07',NULL,NULL,NULL,'2026-02-05 14:33:07',NULL,NULL,NULL,NULL,NULL),(36,23,1,1,'String reverseString(String input) {\n  return input.split(\'\').reversed.join(\'\');\n}','PASS','2026-02-05 14:33:23',NULL,NULL,NULL,'2026-02-05 14:33:23',NULL,NULL,NULL,NULL,NULL),(37,24,1,10,'import \'package:flutter/material.dart\';\n\nWidget buildUI() {\n  return const AdminDashboardScreen();\n}\n\nclass AdminDashboardScreen extends StatelessWidget {\n  const AdminDashboardScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    const red = Color(0xFFD62828);\n\n    return Scaffold(\n      backgroundColor: Colors.white,\n      body: SafeArea(\n        child: Padding(\n          padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),\n          child: Column(\n            crossAxisAlignment: CrossAxisAlignment.stretch,\n            children: [\n              // Welcome card\n              Container(\n                padding:\n                    const EdgeInsets.symmetric(vertical: 8, horizontal: 10),\n                decoration: BoxDecoration(\n                  color: red,\n                  borderRadius: BorderRadius.circular(10),\n                ),\n                child: Column(\n                  children: const [\n                    Text(\n                      \'Welcome, Pastor John\',\n                      style: TextStyle(\n                          color: Colors.white,\n                          fontWeight: FontWeight.w700,\n                          fontSize: 12),\n                    ),\n                    SizedBox(height: 1),\n                    Text(\n                      \'Grace Community Church • Admin\',\n                      style: TextStyle(color: Colors.white70, fontSize: 10),\n                    ),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 8),\n\n              // Stats grid (2x2)\n              GridView.count(\n                crossAxisCount: 2,\n                shrinkWrap: true,\n                physics: const NeverScrollableScrollPhysics(),\n                crossAxisSpacing: 8,\n                mainAxisSpacing: 8,\n                childAspectRatio: 1.75,\n                children: const [\n                  StatCard(title: \'Total Members\', value: \'247\'),\n                  StatCard(title: \'Ministers\', value: \'12\'),\n                  StatCard(title: \'Ministries\', value: \'15\'),\n                  StatCard(title: \'Active Events\', value: \'8\'),\n                ],\n              ),\n              const SizedBox(height: 8),\n\n              // Quick Actions\n              SectionCard(\n                title: \'Quick Actions\',\n                child: GridView.count(\n                  crossAxisCount: 2,\n                  shrinkWrap: true,\n                  physics: const NeverScrollableScrollPhysics(),\n                  crossAxisSpacing: 8,\n                  mainAxisSpacing: 8,\n                  childAspectRatio: 1.5,\n                  children: const [\n                    ActionCard(icon: Icons.add, label: \'Add Member\'),\n                    ActionCard(\n                        icon: Icons.campaign, label: \'Send Notification\'),\n                    ActionCard(icon: Icons.event, label: \'Create Event\'),\n                    ActionCard(icon: Icons.church, label: \'Add Ministry\'),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 8),\n\n              // Pending Actions\n              SectionCard(\n                title: \'Pending Actions\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• 5 new member registrations pending approval\',\n                        style: TextStyle(fontSize: 9)),\n                    SizedBox(height: 1),\n                    Text(\'• 2 event requests awaiting confirmation\',\n                        style: TextStyle(fontSize: 9)),\n                    SizedBox(height: 1),\n                    Text(\'• 3 profile updates need review\',\n                        style: TextStyle(fontSize: 9)),\n                  ],\n                ),\n              ),\n              const SizedBox(height: 6),\n\n              // Recent Activity\n              SectionCard(\n                title: \'Recent Activity\',\n                child: Column(\n                  crossAxisAlignment: CrossAxisAlignment.start,\n                  children: const [\n                    Text(\'• Sarah Johnson completed profile setup\',\n                        style: TextStyle(fontSize: 9)),\n                    SizedBox(height: 1),\n                    Text(\'• Youth Ministry event scheduled\',\n                        style: TextStyle(fontSize: 9)),\n                    SizedBox(height: 1),\n                    Text(\'• New prayer request from Mike Wilson\',\n                        style: TextStyle(fontSize: 9)),\n                  ],\n                ),\n              ),\n            ],\n          ),\n        ),\n      ),\n      bottomNavigationBar: const _DashboardNav(),\n    );\n  }\n}\n\nclass _DashboardNav extends StatelessWidget {\n  const _DashboardNav();\n\n  @override\n  Widget build(BuildContext context) {\n    const red = Color(0xFFD62828);\n    return BottomNavigationBar(\n      selectedItemColor: red,\n      unselectedItemColor: Colors.grey,\n      type: BottomNavigationBarType.fixed,\n      iconSize: 20,\n      selectedFontSize: 10,\n      unselectedFontSize: 10,\n      items: const [\n        BottomNavigationBarItem(icon: Icon(Icons.home), label: \'Home\'),\n        BottomNavigationBarItem(icon: Icon(Icons.group), label: \'Members\'),\n        BottomNavigationBarItem(icon: Icon(Icons.event), label: \'Events\'),\n        BottomNavigationBarItem(icon: Icon(Icons.campaign), label: \'Notify\'),\n        BottomNavigationBarItem(icon: Icon(Icons.settings), label: \'Settings\'),\n      ],\n    );\n  }\n}\n\nclass StatCard extends StatelessWidget {\n  final String title;\n  final String value;\n  const StatCard({super.key, required this.title, required this.value});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(8),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Text(value,\n              style: const TextStyle(\n                  fontSize: 15,\n                  fontWeight: FontWeight.w700,\n                  color: Color(0xFFD62828))),\n          const SizedBox(height: 2),\n          Text(title,\n              style: const TextStyle(fontSize: 9, color: Colors.black54)),\n        ],\n      ),\n    );\n  }\n}\n\nclass ActionCard extends StatelessWidget {\n  final IconData icon;\n  final String label;\n  const ActionCard({super.key, required this.icon, required this.label});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: const Color(0xFFF7F7F9),\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.symmetric(vertical: 8),\n      child: Column(\n        mainAxisAlignment: MainAxisAlignment.center,\n        children: [\n          Icon(icon, color: const Color(0xFFD62828), size: 18),\n          const SizedBox(height: 4),\n          Text(label, style: const TextStyle(fontSize: 9)),\n        ],\n      ),\n    );\n  }\n}\n\nclass SectionCard extends StatelessWidget {\n  final String title;\n  final Widget child;\n  const SectionCard({super.key, required this.title, required this.child});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      decoration: BoxDecoration(\n        color: Colors.white,\n        border: Border.all(color: const Color(0xFFE6E6E6)),\n        borderRadius: BorderRadius.circular(10),\n      ),\n      padding: const EdgeInsets.all(8),\n      child: Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n          Text(title,\n              style:\n                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 11)),\n          const SizedBox(height: 4),\n          child,\n        ],\n      ),\n    );\n  }\n}\n','PASS','2026-02-05 14:37:42','/uploads/ui_previews/submit-24-10-1770282462804.png',72,72.00,'2026-02-05 14:38:20',100,10,'2026-02-05 14:38:20',NULL,86.00);
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

-- Dump completed on 2026-02-05 15:49:01
\n\n-- ===== mobiledev_portal_routines.sql =====\n
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
-- Dumping events for database 'mobiledev_portal'
--

--
-- Dumping routines for database 'mobiledev_portal'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-05 15:49:02
\nSET FOREIGN_KEY_CHECKS=1;
