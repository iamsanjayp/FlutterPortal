import pool from '../src/config/db.js';

async function listProblems() {
  try {
    console.log('🔍 Listing ALL Level 3A Problems:\n');
    
    const [problems] = await pool.query(`
      SELECT id, title, level, problem_type, is_active, 
        LENGTH(description) as desc_len,
        LENGTH(starter_code) as code_len
      FROM problems 
      WHERE level = '3A'
    `);

    if (problems.length === 0) {
      console.log('❌ NO PROBLEMS FOUND IN DB FOR LEVEL 3A');
    } else {
      console.table(problems);
      console.log(`\n✅ Found ${problems.length} problem(s)`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    pool.end();
  }
}

listProblems();
