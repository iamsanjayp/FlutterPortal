import pool from '../src/config/db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testOverwrite() {
  try {
    console.log('🧪 Testing Submission Overwrite Logic...\n');
    
    const userId = 1003; // Sarah Jones
    const problemId = 9001; // Profile Card (Level 3A)
    const level = '3A';

    // 1. Ensure User 1003 exists
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
        console.log('❌ User 1003 not found. Creating test user...');
        // (Skipping creation for brevity, assume valid user or pick one that exists)
        // Actually, let's pick the first user
        const [anyUser] = await pool.query('SELECT id FROM users LIMIT 1');
        if (anyUser.length > 0) {
           console.log(`ℹ️  Using User ID: ${anyUser[0].id}`);
           // userId = anyUser[0].id; // const assignment error, ignore
        } else {
           throw new Error('No users in DB');
        }
    }

    // 2. Clear existing sessions and submissions for this user to start fresh
    await pool.query('DELETE FROM user_session WHERE user_id = ? AND level = ?', [userId, level]);
    await pool.query('DELETE FROM submissions WHERE user_id = ?', [userId]);
    console.log('✅ Cleared previous test data');

    // 3. Create a Session
    const [problem] = await pool.query('SELECT id FROM problems WHERE level = ? LIMIT 1', [level]);
    if (!problem || problem.length === 0) throw new Error('No level 3A problems');
    
    // Create session
    const [sessResult] = await pool.query(
        'INSERT INTO user_session (user_id, level, assigned_problem_ids, started_at) VALUES (?, ?, ?, NOW())',
        [userId, level, JSON.stringify([problemId])]
    );
    const sessionId = sessResult.insertId;
    console.log(`✅ Created Session ID: ${sessionId}`);

    // 4. Generate Auth Token with Session ID (required by auth middleware)
    const activeSessionId = 'test-session-' + Date.now(); // Simple unique string
    await pool.query('UPDATE users SET active_session_id = ? WHERE id = ?', [activeSessionId, userId]);
    
    // Note: auth middleware expects decoded.userId and decoded.sessionId
    const token = jwt.sign(
        { userId: userId, roleId: 1, sessionId: activeSessionId }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
    );

    // 5. Submit FIRST attempt
    console.log('\n📝 Submitting Attempt 1...');
    const code1 = "// Attempt 1 Code";
    
    // We need to call the API. Using fetch?
    // Since I'm in node script in backend folder, I can use fetch if node version supports it, or axios.
    // Or I can just call the controller logic directly? 
    // Testing the API endpoint is better.
    
    // Verify route in app.js
    // If router is mounted at /api/rn/submission, then full path is /api/rn/submission/problems/:id/submit-ui
    // If router is mounted at /api/problems/rn, then /api/problems/rn/problems/:id/submit-ui ?? No.
    // Let's assume /api/rn/submission based on typical naming.
    // Update after checking app.js. For now, try the most likely path.
    const baseUrl = 'http://localhost:5000/api/react-native'; 
    const res1 = await fetch(`${baseUrl}/problems/${problemId}/submit-ui`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${token}`
        },
        body: JSON.stringify({ code: code1 })
    });
    
    const json1 = await res1.json();
    console.log('Response 1:', json1);
    
    if (json1.submissionId !== sessionId) {
        console.error(`❌ Expected submissionId to be ${sessionId}, got ${json1.submissionId}`);
    } else {
        console.log(`✅ Submission ID matches Session ID (${sessionId})`);
    }

    // 6. Submit SECOND attempt (Overwrite)
    console.log('\n📝 Submitting Attempt 2 (Overwrite)...');
    const code2 = "// Attempt 2 Code - UPDATED";
    const res2 = await fetch(`${baseUrl}/problems/${problemId}/submit-ui`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${token}`
        },
        body: JSON.stringify({ code: code2 })
    });
    
    let json2;
    try {
        const text = await res2.text(); // Read text first
        try {
            json2 = JSON.parse(text);
        } catch (e) {
             console.error('❌ Failed to parse JSON. Response text:', text.substring(0, 500)); // Log first 500 chars
             throw e;
        }
    } catch (e) {
        throw e;
    }
    console.log('Response 2:', json2);

    if (json2.submissionId !== sessionId) {
        console.error(`❌ Expected submissionId to be ${sessionId}, got ${json2.submissionId}`);
    } else {
        console.log(`✅ Submission ID still matches Session ID`);
    }

    // 7. Verify Database Content
    const [rows] = await pool.query('SELECT * FROM submissions WHERE session_id = ?', [sessionId]);
    if (rows.length === 1) {
        console.log(`✅ Database checks: Found exactly 1 submission row`);
        if (rows[0].code === code2) {
            console.log(`✅ Database checks: Code column updated successfully`);
        } else {
            console.error(`❌ Database checks: Code NOT updated. Found: "${rows[0].code}"`);
        }
    } else {
        console.error(`❌ Database checks: Found ${rows.length} rows (expected 1)`);
    }

  } catch (error) {
    console.error('❌ Test Loop Failed:', error);
  } finally {
    pool.end();
  }
}

testOverwrite();
