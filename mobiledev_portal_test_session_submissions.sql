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
  PRIMARY KEY (`id`),
  KEY `idx_session` (`test_session_id`),
  KEY `idx_user` (`user_id`),
  KEY `fk_submission_problem` (`problem_id`),
  CONSTRAINT `fk_submission_problem` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submission_session` FOREIGN KEY (`test_session_id`) REFERENCES `test_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submission_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_session_submissions`
--

LOCK TABLES `test_session_submissions` WRITE;
/*!40000 ALTER TABLE `test_session_submissions` DISABLE KEYS */;
INSERT INTO `test_session_submissions` VALUES (2,41,2,1,'String reverseStringManual(String input) {\n  String reversed = \"\";\n  \n  // Start from the last index and move toward the first\n  for (int i = input.length - 1; i >= 0; i--) {\n    reversed += input[i];\n  }\n  \n  return reversed;\n}','FAIL','2026-01-24 14:59:09'),(3,41,2,2,'bool isPalindrome(String input) {\n  for (int i = 0; i < input.length / 2; i++) {\n    // Compare character at start with character at end\n    if (input[i] != input[input.length - 1 - i]) {\n      return false;\n    }\n  }\n  return true;\n}','PASS','2026-01-24 15:00:16'),(4,44,2,7,'import \'dart:math\';\n\nint maxValue(List<int> nums) {\n  // Use reduce to compare all elements and return the largest\n  return nums.reduce((current, next) => current > next ? current : next);\n}','FAIL','2026-01-24 15:55:39'),(5,50,2,7,'int maxValue(List<int> nums) {\n  // 1. Assume the first number is the largest\n  int maxSoFar = nums[0];\n\n  // 2. Iterate through the list\n  for (int i = 1; i < nums.length; i++) {\n    // 3. If we find a larger number, update maxSoFar\n    if (nums[i] > maxSoFar) {\n      maxSoFar = nums[i];\n    }\n  }\n\n  return maxSoFar;\n}\n\nvoid main() {\n  print(maxValue([1, 5, 3])); // Output: 5\n  print(maxValue([10]));      // Output: 10\n}','PASS','2026-01-24 16:09:15'),(6,50,2,2,'bool isPalindrome(String input) {\n  int left = 0;\n  int right = input.length - 1;\n\n  while (left < right) {\n    // Compare characters at the current pointers\n    if (input[left] != input[right]) {\n      return false; // Not a palindrome, exit early\n    }\n    \n    // Move pointers toward the middle\n    left++;\n    right--;\n  }\n\n  return true; // If we finish the loop, it\'s a palindrome\n}','PASS','2026-01-24 16:10:01'),(7,54,2,4,'int sumList(List<int> numbers) {\n  int total = 0;\n  for (int n in numbers) {\n    total += n;\n  }\n  return total;\n}','PASS','2026-01-27 09:13:26'),(8,55,2,5,'int add(int a, int b) {\n  return a + b;\n}','PASS','2026-01-27 09:14:06'),(9,55,2,7,'int maxValue(List<int> nums) {\n  if (nums.isEmpty) return 0;\n\n  int currentMax = nums[0];\n  for (int i = 1; i < nums.length; i++) {\n    if (nums[i] > currentMax) {\n      currentMax = nums[i];\n    }\n  }\n  return currentMax;\n}','PASS','2026-01-27 09:14:41');
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

-- Dump completed on 2026-01-30 10:38:50
