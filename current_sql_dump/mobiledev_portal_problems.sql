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
