-- ============================================================
-- COMPLETE TEST SETUP: Sample React Native Problem with Image
-- ============================================================
-- This script creates a complete test problem with an image
-- that you can use to test the entire submission flow

USE mobiledev_portal;

-- ============================================
-- Step 1: Add a test problem with image
-- ============================================

-- First, save the generated image file to a known location
-- For example: E:\MobileDev_Portal\backend\sql\sample_images\profile_card.png

-- Then run this to insert the problem with the image:
INSERT INTO problems (
  id,
  level,
  title,
  description,
  starter_code,
  language,
  problem_type,
  sample_image,
  is_active,
  created_by
)
VALUES (
  9001,
  '3A',
  'Build a Profile Card UI',
  'Create a React Native profile card component that matches the sample image.

Requirements:
- Circular profile picture with gradient background
- Display name in bold text
- Show role/title text
- Include a short bio section
- Two action buttons: "Follow" (primary) and "Message" (secondary)
- Clean, modern styling with proper spacing
- Responsive card layout

Styling Guidelines:
- Use centered alignment
- Apply subtle shadows to the card
- Use appropriate font sizes and weights
- Match the color scheme shown in the sample',
  'import React from ''react'';
import { View, Text, Image, StyleSheet, TouchableOpacity } from ''react-native'';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* TODO: Add profile picture */}
        
        {/* TODO: Add name */}
        
        {/* TODO: Add role */}
        
        {/* TODO: Add bio */}
        
        {/* TODO: Add action buttons */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ''#f5f5f5'',
    alignItems: ''center'',
    justifyContent: ''center'',
    padding: 20,
  },
  card: {
    backgroundColor: ''white'',
    borderRadius: 12,
    padding: 24,
    width: ''100%'',
    maxWidth: 320,
    // TODO: Add shadow styling
  },
});',
  'REACT_NATIVE',
  'UI',
  LOAD_FILE('E:\\MobileDev_Portal\\backend\\sql\\sample_images\\profile_card.png'),  -- UPDATE THIS PATH
  1,
  NULL
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  description = VALUES(description),
  sample_image = VALUES(sample_image);

-- ============================================
-- Step 2: Add test cases for the problem
-- ============================================

INSERT IGNORE INTO test_cases (problem_id, input_data, expected_output, is_hidden, test_order)
VALUES
(9001, 'Initial render', 'Profile card displays with all required elements', 0, 1),
(9001, 'Avatar styling', 'Circular avatar with gradient background', 0, 2),
(9001, 'Button interaction', 'Follow and Message buttons are touchable and styled correctly', 1, 3),
(9001, 'Layout responsive', 'Card layout adjusts properly on different screen sizes', 1, 4);

-- ============================================
-- ALTERNATIVE: Insert without image file
-- ============================================
-- If you don't have a physical image file yet, 
-- you can insert the problem WITHOUT the image first:

/*
INSERT INTO problems (
  id, level, title, description, starter_code, language, problem_type, is_active, created_by
)
VALUES (
  9001, '3A', 'Build a Profile Card UI',
  'Create a React Native profile card component...',
  'import React from ''react'';...',
  'REACT_NATIVE', 'UI', 1, NULL
)
ON DUPLICATE KEY UPDATE id = VALUES(id);
*/

-- ============================================
-- Step 3: Verify the problem was created
-- ============================================

SELECT 
  id,
  level,
  title,
  problem_type,
  CASE 
    WHEN sample_image IS NOT NULL THEN CONCAT('✓ Image present (', LENGTH(sample_image), ' bytes)')
    ELSE '✗ No image'
  END as image_status,
  LEFT(description, 80) as description_preview,
  is_active,
  created_at
FROM problems
WHERE id = 9001;

-- ============================================
-- Step 4: Check test cases
-- ============================================

SELECT 
  id,
  problem_id,
  LEFT(input_data, 50) as input_preview,
  LEFT(expected_output, 50) as expected_preview,
  is_hidden,
  test_order
FROM test_cases
WHERE problem_id = 9001
ORDER BY test_order;

-- ============================================
-- Step 5: Test the student flow
-- ============================================
-- After running this script:
-- 1. Navigate to: http://localhost:5173/react-native?problemId=9001
-- 2. Verify the problem loads correctly
-- 3. Check that the sample image displays
-- 4. Write some test code
-- 5. Click "Submit Solution"
-- 6. Check that success message appears

-- ============================================
-- Step 6: View submissions (Admin view)
-- ============================================
-- After submitting, run this to see your submission:

SELECT 
  s.id as submission_id,
  s.user_id,
  u.full_name as student_name,
  u.enrollment_no,
  s.problem_id,
  p.title as problem_title,
  s.status,
  s.score,
  LEFT(s.code, 100) as code_preview,
  s.submitted_at
FROM submissions s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN problems p ON s.problem_id = p.id
WHERE s.problem_id = 9001
ORDER BY s.submitted_at DESC;

-- ============================================
-- Step 7: Admin panel verification
-- ============================================
-- To view in the admin panel:
-- 1. Login as admin (admin@mobiledev.local / Pass@123)
-- 2. Click on "Submissions" in the sidebar
-- 3. You should see your submission listed
-- 4. Click "View" to see the code details
-- 5. Use "Mark as Passed/Failed" to update status

-- ============================================
-- Cleanup (Run only if you want to remove test data)
-- ============================================

/*
-- Uncomment to remove all test data:
DELETE FROM submissions WHERE problem_id = 9001;
DELETE FROM test_cases WHERE problem_id = 9001;
DELETE FROM problems WHERE id = 9001;
*/

-- ============================================
-- Notes
-- ============================================
/*
1. Make sure the image path is correct for your system
2. The image will be stored as BLOB in the database
3. Frontend automatically converts BLOB to base64 for display
4. Submissions are linked to the authenticated user
5. Admin can view and manage all submissions
*/
