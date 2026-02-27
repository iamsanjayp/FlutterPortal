import pool from '../src/config/db.js';

async function checkFinalData() {
  try {
    console.log('📊 Checking Submissions Table Data...\n');
    const [rows] = await pool.query(`
        SELECT id, user_id, problem_id, session_id, status, submitted_at 
        FROM submissions 
        ORDER BY id DESC 
        LIMIT 5
    `);
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkFinalData();
