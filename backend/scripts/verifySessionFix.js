import pool from '../src/config/db.js';

async function testGetCurrentProblem() {
  try {
    console.log('🧪 Testing getCurrentProblem with user 1003...\n');
    
    // Simulate what getCurrentProblem does
    const [sessions] = await pool.query(
      `SELECT id, assigned_problem_ids, current_problem_id FROM user_session WHERE user_id = ? AND level = ?`,
      [1003, '3A']
    );

    if (sessions.length === 0) {
      console.log('❌ No session found');
      return;
    }

    const session = sessions[0];
    console.log('Raw assigned_problem_ids:', session.assigned_problem_ids);
    console.log('Type:', typeof session.assigned_problem_ids);
    console.log('Is Array:', Array.isArray(session.assigned_problem_ids));
    
    let assignedIds = [];
    
    // Apply the fix logic
    if (typeof session.assigned_problem_ids === 'string') {
        try {
            assignedIds = JSON.parse(session.assigned_problem_ids);
            console.log('✅ Parsed from string');
        } catch(e) { 
            assignedIds = [];
            console.log('❌ Parse failed');
        }
    } else if (Array.isArray(session.assigned_problem_ids)) {
        assignedIds = session.assigned_problem_ids;
        console.log('✅ Already an array');
    }
    
    if (!Array.isArray(assignedIds)) {
        assignedIds = [];
    }
    
    console.log('\nFinal assignedIds:', assignedIds);
    console.log('Is Array:', Array.isArray(assignedIds));
    console.log('Has .includes:', typeof assignedIds.includes === 'function');
    
    // Test the includes check
    const targetId = assignedIds[0];
    if (assignedIds.length > 0) {
        const result = assignedIds.includes(parseInt(targetId)) || assignedIds.includes(targetId);
        console.log(`\n✅ .includes() test passed: ${result}`);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    pool.end();
  }
}

testGetCurrentProblem();
