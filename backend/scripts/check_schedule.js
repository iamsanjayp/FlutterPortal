
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mobiledev_db'
};

async function checkSchedule() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM test_schedules WHERE is_active = 1');
        console.log('Active Schedules:', rows);
        
        const now = new Date();
        console.log('Current Server Time:', now);
        
        const activeSlot = rows.find(s => now >= s.start_at && now <= s.end_at);
        if (activeSlot) {
            console.log('Active Slot Found:', activeSlot.name);
        } else {
            console.log('NO Active Slot for current time.');
        }
        
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchedule();
