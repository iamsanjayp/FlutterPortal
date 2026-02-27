import pool from '../src/config/db.js';

async function checkSchema() {
  try {
    const [rows] = await pool.query('DESCRIBE submissions');
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkSchema();
