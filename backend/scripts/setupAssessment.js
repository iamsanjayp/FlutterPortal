import pool from '../src/config/db.js';

async function checkAndFixProblems() {
  try {
    console.log('🔍 Checking Level 3A problems...\n');

    // Check current Level 3A problems
    const [problems] = await pool.query(
      `SELECT id, title, level, problem_type, is_active, 
       LENGTH(starter_code) as code_length,
       LENGTH(sample_image) as image_length
       FROM problems 
       WHERE level = '3A'`
    );

    console.log(`Found ${problems.length} Level 3A problem(s):`);
    problems.forEach(p => {
      console.log(`  - ID: ${p.id}, Title: "${p.title}"`);
      console.log(`    Type: ${p.problem_type}, Active: ${p.is_active}`);
      console.log(`    Starter code: ${p.code_length} bytes, Image: ${p.image_length || 0} bytes`);
    });

    // If no active Level 3A problems, insert one
    const [activeProblems] = await pool.query(
      "SELECT id FROM problems WHERE level = '3A' AND is_active = 1"
    );

    if (activeProblems.length === 0) {
      console.log('\n❌ No active Level 3A problems found');
      console.log('📝 Inserting new Level 3A problem...');

      await pool.query(`
        INSERT INTO problems (level, title, description, starter_code, language, problem_type, is_active, created_at)
        VALUES (
          '3A',
          'Build a Counter App',
          'Create a React Native counter application with the following requirements:\\n\\n**Features:**\\n- Display current count (starts at 0)\\n- "+" button to increment count\\n- "-" button to decrement count\\n- "Reset" button to reset to 0\\n\\n**Styling:**\\n- Center all elements\\n- Use large, readable font for count\\n- Style buttons with background colors\\n- Add padding and spacing',
          'import React, { useState } from \\'react\\';
import { StyleSheet, Text, View, TouchableOpacity } from \\'react-native\\';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Counter App</Text>
      <Text style={styles.count}>{count}</Text>
      
      <View style={styles.buttonContainer}>
        {/* Add your buttons here */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: \\'#fff\\',
    alignItems: \\'center\\',
    justifyContent: \\'center\\',
  },
  title: {
    fontSize: 24,
    fontWeight: \\'bold\\',
    marginBottom: 20,
  },
  count: {
    fontSize: 48,
    fontWeight: \\'bold\\',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: \\'row\\',
    gap: 10,
  },
});',
          'REACT_NATIVE',
          'UI',
          1,
          NOW()
        )
      `);

      console.log('✅ Level 3A problem inserted successfully');
    } else {
      console.log(`\n✅ Found ${activeProblems.length} active Level 3A problem(s)`);
      
      // Update existing problem if it's missing starter code
      const problemWithoutCode = problems.find(p => p.is_active === 1 && (!p.code_length || p.code_length < 100));
      if (problemWithoutCode) {
        console.log(`📝 Updating problem ${problemWithoutCode.id} with proper starter code...`);
        
        await pool.query(`
          UPDATE problems 
          SET starter_code = 'import React, { useState } from \\'react\\';
import { StyleSheet, Text, View, TouchableOpacity } from \\'react-native\\';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Counter App</Text>
      <Text style={styles.count}>{count}</Text>
      
      <View style={styles.buttonContainer}>
        {/* Add your buttons here */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: \\'#fff\\',
    alignItems: \\'center\\',
    justifyContent: \\'center\\',
  },
  title: {
    fontSize: 24,
    fontWeight: \\'bold\\',
    marginBottom: 20,
  },
  count: {
    fontSize: 48,
    fontWeight: \\'bold\\',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: \\'row\\',
    gap: 10,
  },
});',
            description = 'Create a React Native counter application with the following requirements:\\n\\n**Features:**\\n- Display current count (starts at 0)\\n- "+" button to increment count\\n- "-" button to decrement count\\n- "Reset" button to reset to 0\\n\\n**Styling:**\\n- Center all elements\\n- Use large, readable font for count\\n- Style buttons with background colors\\n- Add padding and spacing',
            is_active = 1
          WHERE id = ?
        `, [problemWithoutCode.id]);
        
        console.log('✅ Problem updated successfully');
      }
    }

    // Final summary
    console.log('\n📊 Final Status:');
    const [finalProblems] = await pool.query(
      "SELECT id, title, is_active FROM problems WHERE level = '3A'"
    );
    
    finalProblems.forEach(p => {
      console.log(`  - ID ${p.id}: "${p.title}" (${p.is_active ? 'ACTIVE' : 'INACTIVE'})`);
    });

    // Clear any existing sessions to force re-assignment
    await pool.query("DELETE FROM user_session WHERE level = '3A'");
    console.log('\n🗑️  Cleared existing Level 3A sessions for fresh testing');

    console.log('\n✅ Database ready for testing!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

checkAndFixProblems();
