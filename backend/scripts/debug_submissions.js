
import pool from '../src/config/db.js';

async function debugSubmissions() {
  try {
    console.log("--- Debugging Submissions ---");

    const [[countTotal]] = await pool.query("SELECT COUNT(*) as count FROM submissions");
    console.log(`Total rows in 'submissions': ${countTotal.count}`);

    const [[countRN]] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM submissions s
      JOIN problems p ON s.problem_id = p.id
      WHERE p.language = 'REACT_NATIVE'
    `);
    console.log(`Rows linked to REACT_NATIVE problems via JOIN: ${countRN.count}`);

    // check for orphaned submissions
    const [orphanedUsers] = await pool.query(`
      SELECT s.id, s.user_id 
      FROM submissions s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE u.id IS NULL
    `);
    console.log(`Orphaned Submissions (User not found): ${orphanedUsers.length}`);
    if (orphanedUsers.length > 0) console.log(orphanedUsers);

    const [orphanedProblems] = await pool.query(`
      SELECT s.id, s.problem_id 
      FROM submissions s 
      LEFT JOIN problems p ON s.problem_id = p.id 
      WHERE p.id IS NULL
    `);
    console.log(`Orphaned Submissions (Problem not found): ${orphanedProblems.length}`);
    if (orphanedProblems.length > 0) console.log(orphanedProblems);

    // Check test_session_submissions
    const [[countSessionSubs]] = await pool.query("SELECT COUNT(*) as count FROM test_session_submissions");
    console.log(`Total rows in 'test_session_submissions': ${countSessionSubs.count}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugSubmissions();
