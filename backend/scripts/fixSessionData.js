import pool from '../src/config/db.js';

async function fixSessionData() {
  try {
    console.log('🔧 Fixing user_session data format...\n');
    
    // 1. Check current sessions
    const [sessions] = await pool.query('SELECT * FROM user_session');
    
    console.log(`Found ${sessions.length} session(s) to check:`);
    
    for (const session of sessions) {
      console.log(`\nSession ID ${session.id}:`);
      console.log(`  Current value: ${session.assigned_problem_ids} (type: ${typeof session.assigned_problem_ids})`);
      
      let problemIds;
      try {
        problemIds = JSON.parse(session.assigned_problem_ids);
      } catch (e) {
        console.log(`  ❌ Parse error: ${e.message}`);
        continue;
      }
      
      // If it's not an array, fix it
      if (!Array.isArray(problemIds)) {
        console.log(`  ⚠️  Not an array! Converting ${problemIds} to [${problemIds}]`);
        
        await pool.query(
          'UPDATE user_session SET assigned_problem_ids = ? WHERE id = ?',
          [JSON.stringify([problemIds]), session.id]
        );
        
        console.log(`  ✅ Fixed!`);
      } else {
        console.log(`  ✅ Already correct (array with ${problemIds.length} item(s))`);
      }
    }
    
    // 2. Verify fix
    console.log('\n📊 Verification after fix:');
    const [verifyResult] = await pool.query('SELECT id, assigned_problem_ids FROM user_session');
    
    verifyResult.forEach(s => {
      const parsed = JSON.parse(s.assigned_problem_ids);
      console.log(`  Session ${s.id}: ${s.assigned_problem_ids} → Parsed as: ${JSON.stringify(parsed)} (isArray: ${Array.isArray(parsed)})`);
    });
    
    console.log('\n✅ Fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixSessionData();
