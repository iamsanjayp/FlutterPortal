
import fetch from 'node-fetch';

const API_BASE = "http://localhost:5000";

async function verifyCustomVM() {
  try {
    // 0. Health Check
    try {
        const root = await fetch(`${API_BASE}/`);
        console.log('Root / status:', root.status, await root.text());
    } catch(e) { console.log('Root / failed:', e.message); }

    // 1. Login Admin
    console.log("Logging in as admin...");
    const loginRes = await fetch(`${API_BASE}/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@mobiledev.com' })
    });
    
    if (!loginRes.ok) {
        throw new Error(`Admin login failed: ${await loginRes.text()}`);
    }
    console.log('Admin login success');
    
    const adminCookie = loginRes.headers.get('set-cookie');
    
    // Debug: Check POST debug route
    const debugRes = await fetch(`${API_BASE}/api/admin/debug-test`, {
        method: 'POST',
        headers: { 'Cookie': adminCookie }
    });
    console.log('POST /api/admin/debug-test STATUS:', debugRes.status);
    if(debugRes.status !== 200) {
        console.log('Debug route failed:', await debugRes.text());
    }

    // Debug: Check GET students
    const getStudentsRes = await fetch(`${API_BASE}/api/admin/students`, {
        headers: { 'Cookie': adminCookie }
    });
    console.log('GET /api/admin/students STATUS:', getStudentsRes.status);

    // 2. Create a test student
    const rand = Date.now();
    const newStudent = {
        fullName: `VM Test ${rand}`,
        email: `vm_${rand}@example.com`,
        password: "password123",
        enrollmentNo: `EN${rand}`,
        rollNo: `R${rand}`,
        level: "4A"
    };
    
    console.log("Creating student:", newStudent.email);
    const createRes = await fetch(`${API_BASE}/api/admin/students`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': adminCookie 
        },
        body: JSON.stringify(newStudent)
    });
    
    if (!createRes.ok) throw new Error(`Failed to create student: ${await createRes.text()}`);
    
    // 3. Login as the new student
    console.log("Logging in as new student...");
    const studentLoginRes = await fetch(`${API_BASE}/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newStudent.email })
    });
    
    if (!studentLoginRes.ok) throw new Error("Failed to login as student");
    const studentCookie = studentLoginRes.headers.get('set-cookie');
    const studentHeaders = {
        'Content-Type': 'application/json',
        'Cookie': studentCookie 
    };

    // 4. Test Multi-File Execution
    console.log('Testing execution...');
    const execRes = await fetch(`${API_BASE}/api/execute/react-native`, {
        method: 'POST',
        headers: studentHeaders,
        body: JSON.stringify({
            files: {
                'App.js': 'import React from "react"; import {Text} from "react-native"; export default () => <Text>Hello VM</Text>;',
                'Component.js': '// Extra file'
            },
            mode: 'PREVIEW'
        })
    });

    const execData = await execRes.json();
    if (!execData.success) {
        console.error('Execution Failed:', execData);
    } else {
        console.log('Execution Success:', execData.message);
    }

    // 5. Test Submission (UI Problem)
    // Using ID 2003 (Todo List UI - Level 3B, but user is 4A so it should allow? actually logic just checks session)
    // Logic in submit-ui:
    // "Get active session ID for this level" -> User is 4A. Problem 2003 is 3B.
    // If we submit to problem 2003, it checks session for problem.level (3B).
    // The user 4A might NOT have a session for 3B if they skipped?
    // But let's try. If it fails due to no session, we know at least the route was hit.
    
    const problemId = 2003; 
    console.log(`Testing submission for problem ${problemId}...`);
    
    const submitRes = await fetch(`${API_BASE}/api/react-native/problems/${problemId}/submit-ui`, {
        method: 'POST',
        headers: studentHeaders,
        body: JSON.stringify({
            files: {
                'App.js': '// Submitted Code',
                'Helper.js': '// Helper Code'
            }
        })
    });

    const submitData = await submitRes.json();
    console.log('Submission Response:', submitData);

    if (submitData.submissionId) {
        console.log('Submission Success: Saved with ID', submitData.submissionId);
    } else {
        console.warn('Submission might have failed or just returned specific message');
    }

  } catch (err) {
    console.error('Verification failed:', err);
  }
}

verifyCustomVM();
