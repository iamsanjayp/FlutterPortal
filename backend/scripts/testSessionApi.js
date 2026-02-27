import pool from '../src/config/db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function testSessionApi() {
  try {
    const userId = 1003;
    const token = jwt.sign(
      { userId: userId, sessionId: 'test-session' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🧪 Testing getCurrentProblem API...');
    
    const response = await fetch('http://localhost:5000/api/session/current-problem?level=3A', {
      headers: {
        'Cookie': `access_token=${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API call successful!');
      console.log('Problem:', data.title);
      console.log('Problem ID:', data.id);
    } else {
      console.log('❌ API call failed:', data.message);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    pool.end();
  }
}

testSessionApi();
