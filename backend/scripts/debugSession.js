import pool from '../src/config/db.js';

async function checkSession() {
  try {
    const [rows] = await pool.query(`SELECT * FROM user_session WHERE user_id = 1003`);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkSession();
