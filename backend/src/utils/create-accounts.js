import pool from '../config/db.js';
import bcrypt from 'bcrypt';

async function createTestAccounts() {
  try {
    console.log('Creating test accounts...\n');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const studentPasswordHash = await bcrypt.hash('student123', 10);

    // Check if admin account exists
    const [[existingAdmin]] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@mobiledev.com']
    );

    if (!existingAdmin) {
      // Insert Admin Account
      await pool.query(
        `INSERT INTO users (
          full_name, email, staff_id, auth_provider, password_hash, role_id, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        ['Admin User', 'admin@mobiledev.com', 'STAFF001', 'LOCAL', adminPasswordHash, 3, 1]
      );
      console.log('✅ Admin account created');
      console.log('   Email: admin@mobiledev.com');
      console.log('   Password: admin123\n');
    } else {
      console.log('ℹ️  Admin account already exists\n');
    }

    // Check if student account exists
    const [[existingStudent]] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      ['student@mobiledev.com']
    );

    if (!existingStudent) {
      // Insert Student Account
      await pool.query(
        `INSERT INTO users (
          full_name, email, enrollment_no, roll_no, auth_provider, password_hash, role_id, is_active, created_at, current_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        ['Test Student', 'student@mobiledev.com', 'EN001', 'RN001', 'LOCAL', studentPasswordHash, 1, 1, '1A']
      );
      console.log('✅ Student account created');
      console.log('   Email: student@mobiledev.com');
      console.log('   Password: student123\n');
    } else {
      console.log('ℹ️  Student account already exists\n');
    }

    // Verify accounts
    const [accounts] = await pool.query(
      `SELECT u.id, u.full_name, u.email, r.name as role, u.is_active 
       FROM users u 
       JOIN roles r ON u.role_id = r.id
       WHERE u.email IN (?, ?)`,
      ['admin@mobiledev.com', 'student@mobiledev.com']
    );

    console.log('📋 Accounts in database:');
    console.table(accounts);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating accounts:', error);
    process.exit(1);
  }
}

createTestAccounts();
