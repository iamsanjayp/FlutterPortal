
import pool from '../src/config/db.js';
import bcrypt from 'bcrypt';

const TOTAL_USERS = 150;
const LEVELS = ["1A", "1B", "1C", "2A", "2B", "2C", "3A", "3B", "3C"];

async function simulateUsers() {
    try {
        console.log(`🚀 Starting simulation for ${TOTAL_USERS} users...`);

        // 1. Get Setup Data (Role ID for Student, Problem IDs)
        const [[studentRole]] = await pool.query("SELECT id FROM roles WHERE name = 'student'");
        const [problems] = await pool.query("SELECT id, level FROM problems WHERE language = 'REACT_NATIVE'");

        if (!studentRole) {
            throw new Error("Student role not found. Run migrations first.");
        }

        const passwordHash = await bcrypt.hash('student123', 10);
        const usersValues = [];
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // 2. Prepare User Data
        for (let i = 1; i <= TOTAL_USERS; i++) {
            const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
            usersValues.push([
                `Student ${i}`,
                `student${i}@mobiledev.com`,
                `EN${1000 + i}`,
                `RN${1000 + i}`,
                'LOCAL',
                passwordHash,
                studentRole.id, // role_id
                true, // is_active
                level, // current_level
                timestamp
            ]);
        }

        // 3. Bulk Insert Users
        console.log("Creating users...");
        await pool.query(
            `INSERT INTO users (full_name, email, enrollment_no, roll_no, auth_provider, password_hash, role_id, is_active, current_level, created_at) 
             VALUES ? ON DUPLICATE KEY UPDATE is_active=VALUES(is_active)`,
            [usersValues]
        );
        console.log(`✅ created/updated ${TOTAL_USERS} users.`);

        // 4. Generate Random Submissions
        console.log("Generating random submissions...");
        const submissionValues = [];
        
        // Fetch the newly created users to get their IDs
        const [users] = await pool.query("SELECT id, current_level FROM users WHERE email LIKE 'student%@mobiledev.com'");

        for (const user of users) {
             // 50% chance to have a submission
            if (Math.random() > 0.5 && problems.length > 0) {
                 const problem = problems[Math.floor(Math.random() * problems.length)];
                 const status = Math.random() > 0.7 ? 'PASS' : (Math.random() > 0.5 ? 'FAIL' : 'PENDING');
                 const score = status === 'PASS' ? 100 : (status === 'FAIL' ? Math.floor(Math.random() * 50) : 0);
                 
                 // Create a session for them first (required for submission)
                 // Note: user_session table requires assigned_problem_ids
                 const [sessionResult] = await pool.query(
                    `INSERT INTO user_session (user_id, level, created_at, assigned_problem_ids) VALUES (?, ?, NOW(), ?)`,
                    [user.id, problem.level, JSON.stringify([problem.id])]
                 );
                 const sessionId = sessionResult.insertId;

                 submissionValues.push([
                    sessionId,
                    user.id,
                    problem.id,
                    "// Simulated submission code",
                    status,
                    score,
                    JSON.stringify({ passed: status === 'PASS' }),
                    new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().slice(0, 19).replace('T', ' ') // Random past time
                 ]);
            }
        }

        if (submissionValues.length > 0) {
            await pool.query(
                `INSERT INTO submissions (session_id, user_id, problem_id, code, status, score, test_results, submitted_at) VALUES ?`,
                [submissionValues]
            );
            console.log(`✅ Created ${submissionValues.length} submissions.`);
        }

        console.log("\nSimulation Complete! 🎉");
        console.log("Login with: student1@mobiledev.com / student123");
        process.exit(0);

    } catch (err) {
        console.error("Simulation Failed:", err);
        process.exit(1);
    }
}

simulateUsers();
