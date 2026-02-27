
import fetch from 'node-fetch';

const API_BASE = "http://localhost:5000";

async function checkSchedule() {
    try {
        console.log("Logging in as admin...");
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: 'admin@mobiledev.com', password: 'admin123' })
        });

        if (!loginRes.ok) throw new Error("Login failed");

        const setCookie = loginRes.headers.get('set-cookie');
        const token = setCookie.match(/access_token=([^;]+)/)[1];

        console.log("Fetching schedules...");
        const res = await fetch(`${API_BASE}/api/admin/schedules`, {
            headers: { 'Cookie': `access_token=${token}` }
        });
        
        const data = await res.json();
        const schedules = data.schedules || [];
        
        const now = new Date();
        const active = schedules.find(s => {
            const start = new Date(s.start_at);
            const end = new Date(s.end_at);
            return s.is_active && now >= start && now <= end;
        });

        if (active) {
            console.log("ACTIVE SCHEDULE FOUND:", active.name);
        } else {
            console.log("NO ACTIVE SCHEDULE.");
            console.log("Server Time:", now);
            console.log("Latest Schedules:", schedules.slice(0, 3));
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkSchedule();
