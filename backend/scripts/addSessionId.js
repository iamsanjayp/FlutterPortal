import pool from '../src/config/db.js';

async function migrate() {
  try {
    console.log('🔄 Adding session_id to submissions table...');
    
    // Add column
    try {
      await pool.query('ALTER TABLE submissions ADD COLUMN session_id INT NULL DEFAULT NULL AFTER user_id');
      console.log('✅ Added session_id column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Column session_id already exists');
      } else {
        throw e;
      }
    }

    // Add index
    try {
      await pool.query('ALTER TABLE submissions ADD INDEX idx_session_id (session_id)');
      console.log('✅ Added index on session_id');
    } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') {
            console.log('ℹ️  Index idx_session_id already exists');
        } else {
            throw e;
        }
    }

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
