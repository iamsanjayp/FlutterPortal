import pool from '../src/config/db.js';

async function resetSessions() {
  try {
    console.log('🔄 Resetting all Level 3A sessions...\n');
    
    // Delete all Level 3A sessions
    const [result] = await pool.query("DELETE FROM user_session WHERE level = '3A'");
    console.log(`✅ Deleted ${result.affectedRows} session(s)`);
    
    console.log('\n✅ Sessions cleared! New sessions will be created automatically on login.');
    console.log('\n📝 Next steps:');
    console.log('   1. Refresh browser at http://localhost:5173');
    console.log('   2. Login as: student@mobiledev.local / Pass@123');
    console.log('   3. Session will be created with proper JSON array format');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetSessions();
