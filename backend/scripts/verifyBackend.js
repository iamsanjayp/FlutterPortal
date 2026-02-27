import pool from '../src/config/db.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyBackend() {
  try {
    console.log('🔍 Verifying Backend API Flow...\n');

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('❌ JWT_SECRET not found in .env');
      return;
    }

    // 0. Get real user details for valid token
    const [users] = await pool.query('SELECT id, role_id, active_session_id FROM users WHERE id = 1003');
    if (users.length === 0) {
        console.error('❌ Test user 1003 not found');
        return;
    }
    const user = users[0];
    
    // If no active session, create one (hacky but needed for auth middleware)
    let sessionId = user.active_session_id;
    if (!sessionId) {
        sessionId = 'test-session-' + Date.now();
        await pool.query('UPDATE users SET active_session_id = ? WHERE id = 1003', [sessionId]);
        console.log('   Created temporary active_session_id for test');
    }

    // 1. Generate Token
    const token = jwt.sign(
      { 
        userId: user.id, 
        roleId: user.role_id, 
        sessionId: sessionId 
      }, 
      secret, 
      { expiresIn: '1h' }
    );
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('1️⃣  Testing Session Creation (GET /api/session?level=3A)');
    const sessionRes = await fetch('http://localhost:5000/api/session?level=3A', { headers });
    
    console.log(`   Status: ${sessionRes.status}`);
    const sessionData = await sessionRes.json();
    console.log(`   Response:`, JSON.stringify(sessionData, null, 2));

    if (!sessionRes.ok) {
        console.log('   ❌ Session creation failed');
        if (sessionRes.status === 401) console.log('   (Authentication failed - likely DB session check)');
        return;
    }

    console.log('\n2️⃣  Testing Current Problem Fetch (GET /api/session/current-problem?level=3A)');
    const problemRes = await fetch('http://localhost:5000/api/session/current-problem?level=3A', { headers });
    
    console.log(`   Status: ${problemRes.status}`);
    const problemData = await problemRes.json();
    
    // Truncate long fields for display
    if (problemData.sampleImage) problemData.sampleImage = '(base64 image data...)';
    
    console.log(`   Response:`, JSON.stringify(problemData, null, 2));
    
    if (problemRes.ok) {
        console.log('\n✅ BACKEND IS WORKING CORRECTLY!');
        console.log(`   Problem ID: ${problemData.id}`);
        console.log(`   Title: ${problemData.title}`);
    } else {
        console.log('\n❌ BACKEND FAILED TO FETCH PROBLEM');
    }

  } catch (error) {
    console.error('❌ Script Error:', error.message);
  } finally {
    // Close pool to allow script to exit
    await pool.end();
  }
}

verifyBackend();
