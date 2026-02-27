import fs from 'fs';
import path from 'path';
import pool from '../src/config/db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../sql/migrations/update_session_progress.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Running migration: update_session_progress.sql');
    
    // Split commands by semicolon, but ignore those inside quotes/procedures if possible.
    // However, the SQL script uses PREPARE/EXECUTE which requires delimiter handling.
    // For simplicity with node-mysql2, we can't easily run complex scripts with delimiters.
    // So we will split by simple semicolons and hope it works, OR just use the specific ALTER commands directly in JS code which is safer.
    
    // Better approach: Run specific ALTER statements directly here to avoid parsing issues
    
    console.log('📊 Checking user_session table columns...');
    const [columns] = await pool.query('DESCRIBE user_session');
    const columnNames = columns.map(c => c.Field);
    
    if (!columnNames.includes('progress_data')) {
        console.log('➕ Adding progress_data column...');
        await pool.query('ALTER TABLE user_session ADD COLUMN progress_data JSON DEFAULT NULL AFTER assigned_problem_ids');
    } else {
        console.log('✅ progress_data column already exists');
    }

    if (!columnNames.includes('current_problem_id')) {
        console.log('➕ Adding current_problem_id column...');
        await pool.query('ALTER TABLE user_session ADD COLUMN current_problem_id BIGINT DEFAULT NULL AFTER progress_data');
    } else {
        console.log('✅ current_problem_id column already exists');
    }

    console.log('✅ Migration completed successfully');
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    pool.end();
  }
}

runMigration();
