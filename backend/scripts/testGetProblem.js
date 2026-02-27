// Add detailed logging to getCurrentProblem
import pool from '../src/config/db.js';

async function testGetCurrentProblem() {
  try {
    const userId = 1003; // Test Student
    const level = '3A';
    
    console.log(`Testing getCurrentProblem for user ${userId}, level ${level}\n`);
    
    // Step 1: Get user's session
    console.log('1. Fetching user session...');
    const [sessions] = await pool.query(
      `SELECT id, assigned_problem_ids FROM user_session 
       WHERE user_id = ? AND level = ?`,
      [userId, level]
    );
    
    console.log(`   Found ${sessions.length} session(s)`);
    if (sessions.length === 0) {
      console.log('   ❌ No session found!');
      return;
    }
    
    const session = sessions[0];
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Assigned problem IDs (raw): ${session.assigned_problem_ids}`);
    console.log(`   Type: ${typeof session.assigned_problem_ids}`);
    
    // Step 2: Parse problem IDs
    console.log('\n2. Parsing problem IDs...');
    let problemIds;
    try {
      problemIds = JSON.parse(session.assigned_problem_ids);
      console.log(`   Parsed: ${JSON.stringify(problemIds)}`);
      console.log(`   Type: ${typeof problemIds}, isArray: ${Array.isArray(problemIds)}`);
    } catch (e) {
      console.log(`   ❌ Parse error: ${e.message}`);
      return;
    }
    
    if (problemIds.length === 0) {
      console.log('   ❌ No problems assigned!');
      return;
    }
    
    const problemId = problemIds[0];
    console.log(`   First problem ID: ${problemId} (type: ${typeof problemId})`);
    
    // Step 3: Fetch problem
    console.log('\n3. Fetching problem details...');
    const [problems] = await pool.query(
      `SELECT id, title, description, starter_code, sample_image, problem_type, level 
       FROM problems 
       WHERE id = ? AND is_active = 1`,
      [problemId]
    );
    
    console.log(`   Query result: Found ${problems.length} problem(s)`);
    
    if (problems.length === 0) {
      console.log(`   ❌ Problem ${problemId} not found or inactive!`);
      
      // Check if problem exists at all
      const [allProblems] = await pool.query(
        'SELECT id, title, is_active FROM problems WHERE id = ?',
        [problemId]
      );
      console.log(`   Checking any problem with ID ${problemId}: ${allProblems.length} found`);
      if (allProblems.length > 0) {
        console.log(`      Problem exists but is_active = ${allProblems[0].is_active}`);
      }
    } else {
      const problem = problems[0];
      console.log(`   ✅ Problem found:`);
      console.log(`      ID: ${problem.id}`);
      console.log(`      Title: "${problem.title}"`);
      console.log(`      Type: ${problem.problem_type}, Level: ${problem.level}`);
      console.log(`      Description: ${problem.description.length} bytes`);
      console.log(`      Starter code: ${problem.starter_code.length} bytes`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

testGetCurrentProblem();
