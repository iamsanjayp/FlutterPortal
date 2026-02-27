-- ============================================================
-- QUICK TEST: Insert Sample Problem WITHOUT Image File
-- ============================================================
-- This is a simpler version for immediate testing
-- Run this first to test the submission flow, then add image later

USE mobiledev_portal;

-- Insert the test problem
INSERT INTO problems (
  id, level, title, description, starter_code, language, problem_type, is_active
)
VALUES (
  9001,
  '3A',
  'Build a Profile Card UI',
  'Create a React Native profile card component with:
  
• Circular profile picture with gradient background
• Display name and role/title  
• Bio section
• Two action buttons: Follow and Message
• Modern styling with shadows and proper spacing',
  'import React from ''react'';
import { View, Text, StyleSheet, TouchableOpacity } from ''react-native'';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Add your profile card components here */}
        <Text>Profile Card</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ''#f5f5f5'',
    padding: 20,
    alignItems: ''center'',
    justifyContent: ''center'',
  },
  card: {
    backgroundColor: ''white'',
    borderRadius: 16,
    padding: 24,
    width: ''100%'',
    maxWidth: 320,
  },
});',
  'REACT_NATIVE',
  'UI',
  1
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  description = VALUES(description);

-- Verify insertion
SELECT id, title, problem_type,
  CASE WHEN sample_image IS NOT NULL THEN '✓ Has image' ELSE '✗ No image' END as img,
  is_active
FROM problems WHERE id = 9001;

-- ============================================================
-- HOW TO TEST THE COMPLETE FLOW:
-- ============================================================
-- 1. Run this SQL script
-- 2. Open browser: http://localhost:5173/react-native?problemId=9001
-- 3. Log in as student: student@mobiledev.local / Pass@123
-- 4. Write code in the editor
-- 5. Click "Submit Solution" button
-- 6. Note the submission ID from success message
-- 7. Log out and login as admin: admin@mobiledev.local / Pass@123
-- 8. Click "Submissions" in admin sidebar
-- 9. Find your submission in the list
-- 10. Click "View" to see code details
-- 11. Use "Mark as Passed/Failed" to update status

-- Check submissions (run after testing)
SELECT s.id, u.full_name, p.title, s.status, 
       LEFT(s.code, 60) as code_preview, s.submitted_at
FROM submissions s
JOIN users u ON s.user_id = u.id
JOIN problems p ON s.problem_id = p.id
WHERE p.id = 9001
ORDER BY s.submitted_at DESC
LIMIT 10;
