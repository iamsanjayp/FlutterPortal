import pool from '../config/db.js';

async function checkAndFixSchedulesTable() {
  try {
    console.log('🔍 Checking test_schedules table structure...\n');

    // Check current columns
    const [columns] = await pool.query("DESCRIBE test_schedules");
    
    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    const columnNames = columns.map(c => c.Field);
    const missingColumns = [];

    // Check for required columns
    if (!columnNames.includes('title')) {
      missingColumns.push('title');
      console.log('\n❌ Missing column: title');
      await pool.query(`
        ALTER TABLE test_schedules 
        ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Test Schedule' 
        AFTER id
      `);
      console.log('✅ Added title column');
    }

    if (!columnNames.includes('description')) {
      missingColumns.push('description');
      console.log('\n❌ Missing column: description');
      await pool.query(`
        ALTER TABLE test_schedules 
        ADD COLUMN description TEXT 
        AFTER title
      `);
      console.log('✅ Added description column');
    }

    if (!columnNames.includes('scheduled_by')) {
      missingColumns.push('scheduled_by');
      console.log('\n❌ Missing column: scheduled_by');
      await pool.query(`
        ALTER TABLE test_schedules 
        ADD COLUMN scheduled_by BIGINT 
        AFTER description
      `);
      console.log('✅ Added scheduled_by column');
    }

    if (missingColumns.length === 0) {
      console.log('\n✅ All required columns exist!');
    } else {
      console.log(`\n✅ Fixed ${missingColumns.length} missing columns`);
    }

    // Verify final structure
    const [finalColumns] = await pool.query("DESCRIBE test_schedules");
    console.log('\n📋 Final table structure:');
    finalColumns.forEach(col => {
      console.log(`  ${col.Field.padEnd(20)} ${col.Type}`);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndFixSchedulesTable();
