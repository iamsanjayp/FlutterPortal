import pool from '../config/db.js';

async function createTestSchedulesTable() {

  try {

    console.log('Creating test_schedules table if missing...\n');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_schedules (
        id bigint NOT NULL AUTO_INCREMENT,
        level varchar(10) NOT NULL,
        start_at datetime NOT NULL,
        end_at datetime NOT NULL,
        created_by bigint DEFAULT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY start_at (start_at),
        KEY end_at (end_at),
        KEY created_by (created_by),
        CONSTRAINT test_schedules_ibfk_1 FOREIGN KEY (created_by) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    console.log('✅ Table test_schedules created successfully\n');
    
    const [tables] = await pool.query("SHOW TABLES LIKE 'test_schedules'");
    if (tables.length > 0) {
      console.log('✅ Verified: test_schedules table exists');
    }
    
    process.exit(0);
  } catch (error) {
    
    console.error('❌ Error:', error.message);
    
    process.exit(1);
  }
}

createTestSchedulesTable();
