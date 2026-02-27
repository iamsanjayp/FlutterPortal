import pool from '../config/db.js';

const EXPECTED_TABLES = [
  'roles',
  'users', 
  'oauth_accounts',
  'problems',
  'test_cases',
  'test_schedules',
  'test_sessions',
  'test_session_questions',
  'test_session_submissions',
  'test_case_results'
];

async function checkAllTables() {
  try {
    console.log('🔍 Checking database tables...\n');

    // Get all existing tables
    const [tables] = await pool.query("SHOW TABLES");
    const existingTables = tables.map(row => Object.values(row)[0]);

    console.log(`Expected tables: ${EXPECTED_TABLES.length}`);
    console.log(`Existing tables: ${existingTables.length}\n`);

    // Check each expected table
    const missing = [];
    const existing = [];

    for (const tableName of EXPECTED_TABLES) {
      if (existingTables.includes(tableName)) {
        existing.push(tableName);
        console.log(`✅ ${tableName}`);
      } else {
        missing.push(tableName);
        console.log(`❌ ${tableName} - MISSING`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Existing: ${existing.length}`);
    console.log(`   ❌ Missing: ${missing.length}`);

    if (missing.length > 0) {
      console.log(`\n⚠️  Missing tables: ${missing.join(', ')}`);
      console.log`\n💡 Run the full schema.sql to create missing tables:`);
      console.log(`   mysql -u root -p admin mobiledev_portal < backend/sql/schema.sql`);
    } else {
      console.log(`\n🎉 All tables exist!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllTables();
