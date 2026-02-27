/**
 * Simple script to seed just test users
 * Run: node scripts/seedUsersSimple.cjs
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedUsers() {
  let connection;
  
  try {
    console.log('📊 Adding test users...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mobiledev_portal',
      multipleStatements: true
    });

    console.log('✅ Connected to database\n');

    const sqlFilePath = path.join(__dirname, '..', 'sql', 'seed_users_simple.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📝 Inserting users...\n');
    const [results] = await connection.query(sqlContent);

    console.log('✅ Users added successfully!\n');

    // Show results
    if (Array.isArray(results)) {
      const metrics = results.slice(-3);
      console.log('📈 Database Status:');
      console.log('==================');
      metrics.forEach(result => {
        if (result && result[0]) {
          console.log(`${result[0].metric}: ${result[0].value}`);
        }
      });
    }

    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedUsers();
