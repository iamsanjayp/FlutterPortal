import fetch from 'node-fetch';

const API_BASE = "http://localhost:5002";

async function verifyApiMe() {
  try {
      // 1. Login as the debug user (or admin, but I want to check a specific user)
      // Actually, I can use the debug user I created in debug_level.js if I knew the password.
      // But passing the hash was 'hash', which is not a valid bcrypt hash for a known password.
      
      // So I will create a NEW user with known password via createStudent (admin) API first.
      // 1. Login Admin
      console.log("Logging in as admin...");
      const loginRes = await fetch(`${API_BASE}/auth/dev-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@mobiledev.com' })
      });
      
      const adminCookie = loginRes.headers.get('set-cookie');
      
      // 2. Create a test student
      const rand = Date.now();
      const newStudent = {
          fullName: `API Me Test ${rand}`,
          email: `apime_${rand}@example.com`,
          password: "password123",
          enrollmentNo: `EN${rand}`,
          rollNo: `R${rand}`,
          level: "1A"
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
      
      if (!createRes.ok) throw new Error("Failed to create student");
      
      // 3. Login as the new student
      console.log("Logging in as new student...");
      const studentLoginRes = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: newStudent.email, password: newStudent.password })
      });
      
      if (!studentLoginRes.ok) throw new Error("Failed to login as student");
      const studentCookie = studentLoginRes.headers.get('set-cookie');
      
      // 4. Call /api/me
      console.log("Calling /api/me...");
      const meRes = await fetch(`${API_BASE}/api/me`, {
           headers: { 'Cookie': studentCookie }
      });
      
      const meData = await meRes.json();
      console.log("/api/me Response:", JSON.stringify(meData, null, 2));
      
      if (meData.level === '1A') {
          console.log("SUCCESS: Level is 1A");
      } else {
          console.log("FAILURE: Level is " + meData.level);
      }

  } catch (err) {
      console.error("Verification failed:", err);
  }
}

verifyApiMe();
