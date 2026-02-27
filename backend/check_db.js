
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER, 
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log("Checking DB...");

    try {
        const [rows] = await conn.query("SELECT * FROM submissions WHERE id = 33");
        console.log("Submission 33:", rows);
    } catch (e) {
        console.log("Error checking submission 33:", e.message);
    }

    try {
        const [rows] = await conn.query("SELECT * FROM test_sessions WHERE id = 33");
        console.log("Session 33:", rows);
    } catch (e) {
        console.log("Error checking session 33:", e.message);
    }

    try {
        const [rows] = await conn.query("SHOW COLUMNS FROM submissions LIKE 'session_id'");
        console.log("Submissions session_id column:", rows);
    } catch (e) {
        console.log("Error checking session_id col:", e.message);
    }

    try {
        console.log("--- Running getRNSubmissions Query ---");
        const query = `
          SELECT s.id, s.user_id, s.problem_id, s.status, s.score, s.submitted_at, 
                 u.full_name, p.title
          FROM submissions s
          JOIN users u ON s.user_id = u.id
          JOIN problems p ON s.problem_id = p.id
          WHERE p.language = 'REACT_NATIVE'
          ORDER BY s.submitted_at DESC
          LIMIT 5
        `;
        const [rows] = await conn.query(query);
        console.log(rows);
    } catch (e) {
        console.log("Error running admin query:", e.message);
    }

    conn.end();
}

check();
