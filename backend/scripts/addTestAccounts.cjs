/**
 * Add Admin and Staff test accounts
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addAccounts() {
  let connection;
  
  try {
    console.log('📊 Adding Admin and Staff accounts...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mobiledev_portal'
    });

    console.log('✅ Connected to database\n');

    // Insert Admin account (use INSERT IGNORE to skip if exists)
    await connection.query(`
      INSERT IGNORE INTO users (
        full_name, email, staff_id, auth_provider, 
        password_hash, role_id, is_active
      ) VALUES (
        'Admin User',
        'admin@mobiledev.com',
        'STAFF001',
        'LOCAL',
        '$2b$10$YwJX5qK1OZvGxJ8P6B/xjO/nqtXfsf3U.TRQfW2xzP1matPjkU02C',
        3,
        1
      )
    `);

    console.log('✅ Admin account added/verified');

    // Insert Staff account (use INSERT IGNORE to skip if exists)
    await connection.query(`
      INSERT IGNORE INTO users (
        full_name, email, staff_id, auth_provider, 
        password_hash, role_id, is_active
      ) VALUES (
        'Staff Coordinator',
        'staff@mobiledev.com',
        'STAFF002',
        'LOCAL',
        '$2b$10$/hxdALA5wNeNtzjKwy3Mquh3WIXcqRUISAo7vf6d8MCdAN2GY6MES',
        2,
        1
      )
    `);

    console.log('✅ Staff account added/verified\n');

    // Check all test accounts
    const [users] = await connection.query(`
      SELECT id, full_name, email, role_id 
      FROM users 
      WHERE email IN ('admin@mobiledev.com', 'staff@mobiledev.com', 'student@mobiledev.com')
      ORDER BY role_id DESC
    `);

    console.log('📈 Test Accounts Status:');
    console.log('========================');
    users.forEach(u => {
      const role = u.role_id === 3 ? 'ADMIN' : u.role_id === 2 ? 'STAFF' : 'STUDENT';
      console.log(`${role.padEnd(8)} | ${u.full_name.padEnd(20)} | ${u.email}`);
    });

    console.log('\n✅ All accounts ready!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addAccounts();
