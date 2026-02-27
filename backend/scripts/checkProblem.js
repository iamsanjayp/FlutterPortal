import pool from '../src/config/db.js';

async function checkProblem() {
  try {
    const [rows] = await pool.query('SELECT * FROM problems WHERE id = 9001');
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkProblem();
