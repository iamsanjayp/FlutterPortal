import pool from '../config/db.js';

async function checkAccounts() {
  try {
    const [accounts] = await pool.query(
      `SELECT u.id, u.full_name, u.email, r.name as role, u.is_active, u.auth_provider
       FROM users u 
       JOIN roles r ON u.role_id = r.id
       WHERE u.email IN (?, ?)`,
      ['admin@mobiledev.com', 'student@mobiledev.com']
    );

    console.log('\n📋 Test Accounts Status:\n');
    
    if (accounts.length === 0) {
      console.log('❌ No test accounts found in database!');
    } else {
      accounts.forEach(acc => {
        console.log(`✅ ${acc.role} Account`);
        console.log(`   ID: ${acc.id}`);
        console.log(`   Name: ${acc.full_name}`);
        console.log(`   Email: ${acc.email}`);
        console.log(`   Active: ${acc.is_active ? 'Yes' : 'No'}`);
        console.log(`   Auth: ${acc.auth_provider}`);
        console.log('');
      });
      
      console.log('🔐 Login Credentials:');
      console.log('   Admin  → admin@mobiledev.com / admin123');
      console.log('   Student → student@mobiledev.com / student123');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAccounts();
