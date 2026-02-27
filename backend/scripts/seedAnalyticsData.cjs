/**
 * Script to seed the database with test analytics data
 * Run: node scripts/seedAnalyticsData.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedDatabase() {
  let connection;
  
  try {
    console.log('📊 Starting database seeding...\n');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mobiledev_portal',
      multipleStatements: true
    });

    console.log('✅ Connected to database\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'seed_analytics_data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute SQL
    console.log('📝 Executing SQL script...\n');
    const [results] = await connection.query(sqlContent);

    console.log('✅ Database seeded successfully!\n');

    // Show verification results (last queries in the script)
    if (Array.isArray(results)) {
      const verificationResults = results.slice(-7); // Last 7 SELECT queries
      console.log('📈 Verification Results:');
      console.log('========================');
      verificationResults.forEach(result => {
        if (result && result[0]) {
          const metric = result[0].metric || 'Unknown';
          const value = result[0].value || 0;
          console.log(`${metric}: ${value}`);
        }
      });
    }

    console.log('\n✅ All done!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
