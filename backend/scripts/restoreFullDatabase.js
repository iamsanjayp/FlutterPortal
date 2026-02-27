import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
};

const FILES_IN_ORDER = [
  'mobiledev_portal_roles.sql',
  'mobiledev_portal_users.sql',
  'mobiledev_portal_oauth_accounts.sql',
  'mobiledev_portal_problems.sql',
  'mobiledev_portal_test_cases.sql',
  'mobiledev_portal_test_schedules.sql',
  'mobiledev_portal_test_sessions.sql',
  'mobiledev_portal_test_session_questions.sql',
  'mobiledev_portal_test_session_submissions.sql',
  'mobiledev_portal_test_case_results.sql',
  'mobiledev_portal_routines.sql'
];

async function restoreDatabase() {
  console.log('🚀 Starting full database restoration...\n');
  
  let connection;
  try {
    // 1. Get MySQL Path
    const mysqlPath = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe';
    
    // 2. Import each file using mysql CLI (better for dumps than mysql2)
    for (const file of FILES_IN_ORDER) {
      const filePath = path.join(ROOT_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Warning: File not found: ${file}`);
        continue;
      }

      console.log(`📖 Importing ${file}...`);
      
      const cmd = `"${mysqlPath}" -u ${DB_CONFIG.user} -p${DB_CONFIG.password} ${DB_CONFIG.database} < "${filePath}"`;
      
      try {
        await execPromise(cmd);
        console.log(`✅ Imported ${file}`);
      } catch (err) {
        console.error(`❌ Error importing ${file}: ${err.message}`);
        // Continue to verify other tables? Or stop?
        // Dumps might have dependencies, so error in one might cascade.
        // But usually dumps have drop table if exists.
      }
    }

    console.log('\n📊 Verifying tables...');
    connection = await mysql.createConnection(DB_CONFIG);
    const [tables] = await connection.query(
      `SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = '${DB_CONFIG.database}'`
    );
    
    console.table(tables);
    
    console.log(`\n✨ Database restoration completed!`);
    
  } catch (error) {
    console.error('\n❌ Error during restoration:', error);
  } finally {
    if (connection) await connection.end();
  }
}

restoreDatabase();
