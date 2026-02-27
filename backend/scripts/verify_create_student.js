import fetch from 'node-fetch';

const API_BASE = "http://localhost:5000";

async function verifyCreateStudent() {
  // First, we need to login as admin to get a token.
  // I'll try to use the dev-login if available or standard login with known credentials if I knew them.
  // Converting the frontend `request` logic to node-fetch.
  
  // Actually, I'll bypass the login for the script if I can, OR since I'm running locally, I can use the dev bypass route I saw in auth.routes.js: /auth/dev-login
  
  try {
      // 1. Login as admin
      const loginRes = await fetch(`${API_BASE}/auth/dev-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@mobiledev.com' }) // Assuming admin email is this or I need to find a valid admin email
      });
      
      // If dev-login fails (e.g. production mode or invalid email), we might need another way.
      // Let's check if we can find an admin email from DB first?
      // But let's assume standard seed data has 'admin@example.com' or 'admin'.
      
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
          throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
      }
      
      const cookie = loginRes.headers.get('set-cookie');
      console.log("Logged in. Cookie:", cookie);

      // 2. Create Student
      const newStudent = {
          fullName: "Test Student API",
          email: `teststudent_${Date.now()}@example.com`,
          password: "password123",
          enrollmentNo: `EN${Date.now()}`,
          rollNo: `R${Date.now()}`,
          level: "1A"
      };
      
      console.log("Creating student:", newStudent);
      const createRes = await fetch(`${API_BASE}/api/admin/students`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Cookie': cookie // Pass the auth cookie
          },
          body: JSON.stringify(newStudent)
      });
      
      const createData = await createRes.json();
      if (!createRes.ok) {
          throw new Error(`Create failed: ${JSON.stringify(createData)}`);
      }
      
      console.log("Student created successfully:", createData);
      
      // 3. Verify student exists
      console.log("Verifying student in list...");
      const listRes = await fetch(`${API_BASE}/api/admin/students?query=${newStudent.email}`, {
           headers: { 'Cookie': cookie }
      });
      const listData = await listRes.json();
      
      const found = listData.students.find(s => s.email === newStudent.email);
      if (found) {
          console.log("✅ Student found in list:", found);
      } else {
          console.error("❌ Student NOT found in list");
      }

  } catch (err) {
      console.error("Verification failed:", err);
  }
}

verifyCreateStudent();
