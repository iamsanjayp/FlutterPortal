
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function testAdminAPI() {
    try {
        // 1. Login as Admin
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@mobiledev.local',
            password: 'Pass@123'
        });
        
        const cookies = loginRes.headers['set-cookie'];
        console.log("Logged in, cookies:", cookies);

        // 2. Fetch submissions
        const res = await axios.get(`${API_URL}/admin/rn-submissions`, {
            headers: {
                Cookie: cookies
            }
        });

        console.log("Response Status:", res.status);
        console.log("Submissions Data:", JSON.stringify(res.data.submissions, null, 2));

    } catch (error) {
        console.error("API Error:", error.response ? error.response.data : error.message);
    }
}

testAdminAPI();
