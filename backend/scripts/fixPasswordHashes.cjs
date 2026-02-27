/**
 * Fix password hashes for test accounts
 * Run: node scripts/fixPasswordHashes.cjs
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function fixPasswords() {
  let connection;
  
  try {
    console.log('🔧 Fixing password hashes...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mobiledev_portal'
    });

    console.log('✅ Connected to database\n');

    // Generate fresh hashes
    const adminHash = await bcrypt.hash('admin123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);
    const studentHash = await bcrypt.hash('student123', 10);

    // Update admin password
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [adminHash, 'admin@mobiledev.com']
    );
    console.log('✅ Updated admin password');

    // Update staff password
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [staffHash, 'staff@mobiledev.com']
    );
    console.log('✅ Updated staff password');

    // Update student password
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [studentHash, 'student@mobiledev.com']
    );
    console.log('✅ Updated student password');

    // Verify by testing login
    console.log('\n📋 Verifying passwords...\n');
    
    const [users] = await connection.query(
      'SELECT email, password_hash FROM users WHERE email IN (?, ?, ?)',
      ['admin@mobiledev.com', 'staff@mobiledev.com', 'student@mobiledev.com']
    );

    for (const user of users) {
      const testPass = user.email.includes('admin') ? 'admin123' 
        : user.email.includes('staff') ? 'staff123' 
        : 'student123';
      
      const matches = await bcrypt.compare(testPass, user.password_hash);
      console.log(`${user.email}: ${matches ? '✅ CORRECT' : '❌ MISMATCH'}`);
    }

    console.log('\n✅ All passwords fixed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixPasswords();
