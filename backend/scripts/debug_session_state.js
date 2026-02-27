import pool from '../src/config/db.js';

async function debugState() {
  try {
    console.log('🔍 Inspecting current DB state...\n');

    // 1. Check User Sessions
    console.log('1. User Sessions:');
    const [sessions] = await pool.query('SELECT * FROM user_session');
    
    if (sessions.length === 0) {
      console.log('   ❌ No sessions found! Login has not created a session yet.');
    } else {
      sessions.forEach(s => {
        console.log(`\n   Session ID: ${s.id}`);
        console.log(`   User ID: ${s.user_id}`);
        console.log(`   Level: ${s.level}`);
        console.log(`   Assigned IDs (Raw): '${s.assigned_problem_ids}'`);
        console.log(`   Type of Raw: ${typeof s.assigned_problem_ids}`);
        
        try {
          const parsed = JSON.parse(s.assigned_problem_ids);
          console.log(`   Parsed:`, parsed);
          console.log(`   Is Array: ${Array.isArray(parsed)}`);
          
          if (Array.isArray(parsed) && parsed.length > 0) {
             console.log(`   Target Problem ID: ${parsed[0]}`);
             checkProblem(parsed[0]);
          } else {
             console.log('   ❌ Parsed value is not a populated array');
          }
        } catch (e) {
          console.log(`   ❌ JSON Parse Error: ${e.message}`);
        }
      });
    }

    // 2. Helper to check problem
    async function checkProblem(id) {
        console.log(`\n   Checking Problem ID ${id}...`);
        const [probs] = await pool.query('SELECT id, title, is_active FROM problems WHERE id = ?', [id]);
        if (probs.length === 0) {
            console.log(`   ❌ Problem ${id} DOES NOT EXIST in problems table`);
        } else {
            console.log(`   ✅ Problem found: "${probs[0].title}" (Active: ${probs[0].is_active})`);
        }
    }
    
    // 3. List all active 3A problems
    console.log('\n3. All Active Level 3A Problems:');
    const [allProbs] = await pool.query("SELECT id, title FROM problems WHERE level = '3A' AND is_active = 1");
    allProbs.forEach(p => console.log(`   - ID ${p.id}: ${p.title}`));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    setTimeout(() => pool.end(), 1000); // Give time for async checks
  }
}

debugState();
