import pool from '../src/config/db.js';
import fs from 'fs';

async function insertQuickTestProblem() {
  try {
    console.log('📝 Inserting Level 3A Profile Card problem...\n');

    // Insert the problem
    await pool.query(`
      INSERT INTO problems (
        id, level, title, description, starter_code, language, problem_type, is_active
      )
      VALUES (
        9001,
        '3A',
        'Build a Profile Card UI',
        'Create a React Native profile card component with:\n\n• Circular profile picture with gradient background\n• Display name and role/title\n• Bio section\n• Two action buttons: Follow and Message\n• Modern styling with shadows and proper spacing',
        'import React from \\'react\\';\nimport { View, Text, StyleSheet, TouchableOpacity } from \\'react-native\\';\n\nexport default function App() {\n  return (\n    <View style={styles.container}>\n      <View style={styles.card}>\n        {/* Add your profile card components here */}\n        <Text>Profile Card</Text>\n      </View>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: \\'#f5f5f5\\',\n    padding: 20,\n    alignItems: \\'center\\',\n    justifyContent: \\'center\\',\n  },\n  card: {\n    backgroundColor: \\'white\\',\n    borderRadius: 16,\n    padding: 24,\n    width: \\'100%\\',\n    maxWidth: 320,\n  },\n});',
        'REACT_NATIVE',
        'UI',
        1
      )
      ON DUPLICATE KEY UPDATE 
        title = VALUES(title),
        description = VALUES(description),
        starter_code = VALUES(starter_code),
        is_active = VALUES(is_active)
    `);

    console.log('✅ Problem inserted/updated successfully');

    // Verify insertion
    const [result] = await pool.query(`
      SELECT id, title, problem_type, is_active,
        CASE WHEN sample_image IS NOT NULL THEN '✓ Has image' ELSE '✗ No image' END as img
      FROM problems WHERE id = 9001
    `);

    console.log('\n📊 Verification:');
    console.log(`  ID: ${result[0].id}`);
    console.log(`  Title: "${result[0].title}"`);
    console.log(`  Type: ${result[0].problem_type}`);
    console.log(`  Image: ${result[0].img}`);
    console.log(`  Active: ${result[0].is_active ? 'YES' : 'NO'}`);

    // List all Level 3A problems
    const [allProblems] = await pool.query(`
      SELECT id, title, is_active 
      FROM problems 
      WHERE level = '3A' 
      ORDER BY id
    `);

    console.log('\n📋 All Level 3A Problems:');
    allProblems.forEach(p => {
      console.log(`  - ID ${p.id}: "${p.title}" (${p.is_active ? 'ACTIVE' : 'INACTIVE'})`);
    });

    // Clear sessions to force fresh assignment
    await pool.query("DELETE FROM user_session WHERE level = '3A'");
    console.log('\n🗑️  Cleared existing Level 3A sessions');

    console.log('\n✅ Ready for testing!');
    console.log('\n📝 Test with: http://localhost:5173');
    console.log('   Login: student@mobiledev.local / Pass@123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

insertQuickTestProblem();
