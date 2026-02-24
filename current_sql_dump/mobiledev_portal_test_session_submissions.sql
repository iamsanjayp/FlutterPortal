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
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_session_submissions`
--

LOCK TABLES `test_session_submissions` WRITE;
/*!40000 ALTER TABLE `test_session_submissions` DISABLE KEYS */;
INSERT INTO `test_session_submissions` VALUES (53,38,26,23,'import \'package:flutter/material.dart\';\n\n// Entry point required by the platform\nWidget buildUI() {\n  return const MyOrdersScreen();\n}\n\nclass MyOrdersScreen extends StatelessWidget {\n  const MyOrdersScreen({super.key});\n\n  final List<Map<String, dynamic>> orders = const [\n    {\n      \"restaurant\": \"Pizza Hut\",\n      \"price\": \"\\$35.25\",\n      \"items\": \"03 Items\",\n      \"orderId\": \"#162432\",\n      \"image\": \"assets/images/problem-23-resource-1771480048905-pizza.jpg\",\n    },\n    {\n      \"restaurant\": \"McDonald\",\n      \"price\": \"\\$40.15\",\n      \"items\": \"02 Items\",\n      \"orderId\": \"#242432\",\n      \"image\": \"assets/images/problem-23-resource-1771480048899-mcdonalds.jpg\",\n    },\n    {\n      \"restaurant\": \"Starbucks\",\n      \"price\": \"\\$10.20\",\n      \"items\": \"01 Items\",\n      \"orderId\": \"#240112\",\n      \"image\": \"assets/images/problem-23-resource-1771480048894-starbucks.jpg\",\n    },\n  ];\n\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      backgroundColor: Colors.white,\n      appBar: AppBar(\n        backgroundColor: Colors.white,\n        elevation: 0,\n        leading: IconButton(\n          icon: const Icon(Icons.arrow_back_ios, color: Colors.black),\n          onPressed: () {},\n        ),\n        title: const Text(\n          \'My Orders\',\n          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),\n        ),\n        centerTitle: true,\n        actions: [\n          IconButton(\n            icon: const Icon(Icons.more_horiz, color: Colors.black),\n            onPressed: () {},\n          ),\n        ],\n      ),\n      body: Column(\n        children: [\n          // Tab Section\n          Container(\n            padding: const EdgeInsets.symmetric(vertical: 16),\n            decoration: const BoxDecoration(\n              border: Border(bottom: BorderSide(color: Colors.grey, width: 0.2)),\n            ),\n            child: Row(\n              mainAxisAlignment: MainAxisAlignment.spaceEvenly,\n              children: [\n                Column(\n                  children: [\n                    const Text(\n                      \"Ongoing\",\n                      style: TextStyle(\n                        color: Colors.orange,\n                        fontWeight: FontWeight.bold,\n                        fontSize: 16,\n                      ),\n                    ),\n                    const SizedBox(height: 6),\n                    Container(height: 3, width: 60, color: Colors.orange),\n                  ],\n                ),\n                const Text(\n                  \"Histori\",\n                  style: TextStyle(\n                    color: Colors.grey,\n                    fontWeight: FontWeight.w500,\n                    fontSize: 16,\n                  ),\n                ),\n              ],\n            ),\n          ),\n          \n          // Order List\n          Expanded(\n            child: ListView.builder(\n              padding: const EdgeInsets.all(20),\n              itemCount: orders.length,\n              itemBuilder: (context, index) {\n                final order = orders[index];\n                return OrderCard(order: order);\n              },\n            ),\n          ),\n        ],\n      ),\n    );\n  }\n}\n\nclass OrderCard extends StatelessWidget {\n  final Map<String, dynamic> order;\n\n  const OrderCard({super.key, required this.order});\n\n  @override\n  Widget build(BuildContext context) {\n    return Container(\n      margin: const EdgeInsets.only(bottom: 24),\n      padding: const EdgeInsets.only(bottom: 24),\n      decoration: const BoxDecoration(\n        border: Border(bottom: BorderSide(color: Colors.black12, width: 0.5)),\n      ),\n      child: Row(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n          // Image\n          ClipRRect(\n            borderRadius: BorderRadius.circular(16),\n            child: Image.asset(\n              order[\'image\'],\n              width: 80,\n              height: 80,\n              fit: BoxFit.cover,\n              errorBuilder: (c, e, s) => Container(\n                width: 80,\n                height: 80,\n                color: Colors.grey[200],\n                child: const Icon(Icons.fastfood, color: Colors.grey),\n              ),\n            ),\n          ),\n          \n          const SizedBox(width: 16),\n          \n          Expanded(\n            child: Column(\n              crossAxisAlignment: CrossAxisAlignment.start,\n              children: [\n                Row(\n                  mainAxisAlignment: MainAxisAlignment.spaceBetween,\n                  children: [\n                    Text(\n                      order[\'restaurant\'],\n                      style: const TextStyle(\n                        fontSize: 18,\n                        fontWeight: FontWeight.bold,\n                        color: Colors.black87,\n                      ),\n                    ),\n                    Text(\n                      order[\'orderId\'],\n                      style: const TextStyle(\n                        fontSize: 14,\n                        color: Colors.grey,\n                      ),\n                    ),\n                  ],\n                ),\n                const SizedBox(height: 4),\n                \n                Row(\n                  children: [\n                    Text(\n                      order[\'price\'],\n                      style: const TextStyle(\n                        fontSize: 14,\n                        fontWeight: FontWeight.w500,\n                        color: Colors.black54,\n                      ),\n                    ),\n                    const Padding(\n                      padding: EdgeInsets.symmetric(horizontal: 8.0),\n                      child: Text(\"|\", style: TextStyle(color: Colors.grey)),\n                    ),\n                    Text(\n                      order[\'items\'],\n                      style: const TextStyle(\n                        fontSize: 14,\n                        color: Colors.black54,\n                      ),\n                    ),\n                  ],\n                ),\n                \n                const SizedBox(height: 16),\n                \n                Row(\n                  children: [\n                    Expanded(\n                      child: ElevatedButton(\n                        onPressed: () {},\n                        style: ElevatedButton.styleFrom(\n                          backgroundColor: Colors.orange,\n                          foregroundColor: Colors.white,\n                          elevation: 0,\n                          shape: RoundedRectangleBorder(\n                            borderRadius: BorderRadius.circular(8),\n                          ),\n                          padding: const EdgeInsets.symmetric(vertical: 12),\n                        ),\n                        child: const Text(\"Track Order\"),\n                      ),\n                    ),\n                    const SizedBox(width: 12),\n                    Expanded(\n                      child: OutlinedButton(\n                        onPressed: () {},\n                        style: OutlinedButton.styleFrom(\n                          foregroundColor: Colors.orange,\n                          side: const BorderSide(color: Colors.orange),\n                          shape: RoundedRectangleBorder(\n                            borderRadius: BorderRadius.circular(8),\n                          ),\n                          padding: const EdgeInsets.symmetric(vertical: 12),\n                        ),\n                        child: const Text(\"Cancel\"),\n                      ),\n                    ),\n                  ],\n                ),\n              ],\n            ),\n          ),\n        ],\n      ),\n    );\n  }\n}','PASS','2026-02-19 14:24:45','/uploads/ui_previews/submit-38-23-1771491285165.png',85,85.00,'2026-02-19 14:25:41',85,1,'2026-02-19 14:25:41',NULL,85.00);
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
