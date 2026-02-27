-- =====================================================
-- Sample Problems for Level-Based Testing System
-- =====================================================

USE mobiledev_portal;

-- Sample UI Problem (Level 3A) - Simple Counter
INSERT INTO problems (level, title, description, starter_code, is_active, language, problem_type, created_by)
VALUES (
  '3A',
  'Counter App',
  'Create a React Native counter application with the following requirements:\n\n1. Display a number starting at 0\n2. Include an "Increment" button that increases the count by 1\n3. Include a "Decrement" button that decreases the count by 1\n4. Include a "Reset" button that sets the count back to 0\n5. Use appropriate styling to make the UI presentable',
  'import React, { useState } from ''react'';\nimport { View, Text, TouchableOpacity, StyleSheet } from ''react-native'';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <View style={styles.container}>\n      <Text style={styles.counter}>{count}</Text>\n      {/* Add your buttons here */}\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    justifyContent: ''center'',\n    alignItems: ''center'',\n    backgroundColor: ''#f5f5f5'',\n  },\n  counter: {\n    fontSize: 48,\n    fontWeight: ''bold'',\n    marginBottom: 30,\n  },\n});',
  1,
  'REACT_NATIVE',
  'UI',
  NULL
);

-- Verification
SELECT 'Sample problems created successfully!' as status;
SELECT id, level, title, problem_type, language FROM problems WHERE language = 'REACT_NATIVE';
