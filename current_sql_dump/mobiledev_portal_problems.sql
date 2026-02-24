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
  `is_sample` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reference_image_url` varchar(255) DEFAULT NULL,
  `ui_required_widgets` text,
  `resource_urls` text,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `problems_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `problems`
--

LOCK TABLES `problems` WRITE;
/*!40000 ALTER TABLE `problems` DISABLE KEYS */;
INSERT INTO `problems` VALUES (22,'Even Or ODD','Even or Odd Checker Write a function checkEvenOdd(int n) that returns \"Even\" if the number is even, \"Odd\" otherwise.','1A','FLUTTER','String checkEvenOdd(int number) {\n  // If the remainder of number / 2 is 0, it\'s even\n}',NULL,1,1,'2026-02-18 08:51:29','',NULL,NULL),(23,'My Orders Page','Replicate the \"My Orders\" screen exactly as shown in the design. The screen features an \"Ongoing\" and \"History\" tab section at the top, followed by a list of active orders.\n\nUI Requirements:\n\nAppBar: Title \"My Orders\" with a back button leading icon and a menu action icon.\nTabs: A custom tab bar with \"Ongoing\" (active, orange underline) and \"History\".\nOrder List: A scrollable list of order cards. Each card must include:\nThumbnail: A rounded square image on the left.\nDetails: Restaurant Name (Bold), Order ID (#...), Price, and Item Count.\nButtons: \"Track Order\" (Orange background) and \"Cancel\" (White background, Orange border).\nOrder Data:\n\nPizza Hut: $35.25 | 03 Items | Order #162432 | Image: pizza.png\nMcDonald: $40.15 | 02 Items | Order #242432 | Image: burger.png\nStarbucks: $10.20 | 01 Items | Order #240112 | Image: starbucks.png','2A','FLUTTER','import \'package:flutter/material.dart\';\n\n// Entry point for the test runner\nWidget buildUI() {\n  return const MyOrdersScreen();\n}\n\nclass MyOrdersScreen extends StatelessWidget {\n  const MyOrdersScreen({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      appBar: AppBar(\n        title: const Text(\"My Orders\"),\n        centerTitle: true,\n      ),\n      body: const Center(\n        child: Text(\"Implement your UI here\"),\n      ),\n    );\n  }\n}',NULL,1,0,'2026-02-19 05:47:09','/uploads/ui_samples/problem-23-1771480041705.png','[\"Scaffold\",\"AppBar\",\"Column\",\"Row\",\"ListView\",\"Container\",\"Card\",\"Image.asset\",\"Text\",\"ElevatedButton\",\"OutlinedButton\"]','[\"/uploads/ui_resources/problem-23-resource-1771480048894-starbucks.jpg\",\"/uploads/ui_resources/problem-23-resource-1771480048899-mcdonalds.jpg\",\"/uploads/ui_resources/problem-23-resource-1771480048905-pizza.jpg\"]');
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

-- Dump completed on 2026-02-24 13:46:09
