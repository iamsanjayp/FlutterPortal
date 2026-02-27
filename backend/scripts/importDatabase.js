import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true
};

async function importDatabase() {
  console.log('🚀 Starting database import...\n');
  
  let connection;
  try {
    // Connect to MySQL server
    console.log('📡 Connecting to MySQL server...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to MySQL server\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'schema.sql');
    console.log(`📖 Reading SQL file: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found at: ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL file loaded successfully\n');

    // Execute SQL statements
    console.log('⚙️  Executing SQL statements...');
    await connection.query(sqlContent);
    console.log('✅ Database schema created successfully\n');

    // Verify tables were created
    console.log('🔍 Verifying created tables...');
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'mobiledev_portal'}' 
       ORDER BY TABLE_NAME`
    );
    
    console.log('\n📊 Created tables:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
    });
    
    console.log(`\n✨ Database import completed successfully!`);
    console.log(`   Total tables: ${tables.length}`);
    
  } catch (error) {
    console.error('\n❌ Error during database import:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the import
importDatabase();
