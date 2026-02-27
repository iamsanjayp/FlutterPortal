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

async function verifyTables() {
  try {
    console.log('🔍 Verifying database tables...\n');

    // Get all existing tables
    const [tables] = await pool.query("SHOW TABLES");
    const existingTables = tables.map(row => Object.values(row)[0]);

    console.log(`Expected: ${EXPECTED_TABLES.length} tables`);
    console.log(`Found: ${existingTables.length} tables\n`);

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
    console.log(`   ✅ Existing: ${existing.length}/${EXPECTED_TABLES.length}`);
    console.log(`   ❌ Missing: ${missing.length}`);

    if (missing.length > 0) {
      console.log(`\n⚠️  Missing tables: ${missing.join(', ')}`);
      console.log('\n💡 These tables need to be created from schema.sql');
    } else {
      console.log(`\n🎉 All required tables exist!`);
      
      // Get table stats
      const [stats] = await pool.query(`
        SELECT TABLE_NAME, TABLE_ROWS, 
        ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) AS Size_KB 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = 'mobiledev_portal'
        ORDER BY TABLE_NAME
      `);
      
      console.log('\n📈 Table Statistics:');
      console.log('╔════════════════════════════════╦══════════╦══════════╗');
      console.log('║ Table Name                     ║ Rows     ║ Size KB  ║');
      console.log('╠════════════════════════════════╬══════════╬══════════╣');
      stats.forEach(row => {
        const name = row.TABLE_NAME.padEnd(30);
        const rows = String(row.TABLE_ROWS || 0).padStart(8);
        const size = String(row.Size_KB || 0).padStart(8);
        console.log(`║ ${name} ║ ${rows} ║ ${size} ║`);
      });
      console.log('╚════════════════════════════════╩══════════╩══════════╝');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyTables();
