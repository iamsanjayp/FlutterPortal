
import pool from '../src/config/db.js';

async function migrate() {
  try {
    console.log('Creating test_schedule_assignments table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_schedule_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        schedule_id INT NOT NULL,
        user_id BIGINT NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_assignment (schedule_id, user_id),
        FOREIGN KEY (schedule_id) REFERENCES test_schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table created successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
