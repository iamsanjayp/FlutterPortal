
import pool from '../src/config/db.js';

async function checkSessions() {
  try {
    const [rows] = await pool.query(`
      SELECT id, user_id, status, started_at, level 
      FROM test_sessions 
      ORDER BY started_at DESC 
      LIMIT 10
    `);
    console.log('Recent Sessions:', rows);

    const [count] = await pool.query(`
      SELECT COUNT(*) as count FROM test_sessions WHERE status = 'IN_PROGRESS'
    `);
    console.log('Active Sessions Count:', count[0].count);
    
    // Check timezone of DB
    const [time] = await pool.query('SELECT NOW() as db_time');
    console.log('DB Time:', time[0].db_time);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSessions();
