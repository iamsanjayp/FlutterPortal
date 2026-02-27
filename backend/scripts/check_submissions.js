import pool from '../src/config/db.js';

async function checkData() {
  try {
    console.log("--- Checking Submissions ---");
    const [submissions] = await pool.query("SELECT * FROM submissions LIMIT 10");
    console.log(`Found ${submissions.length} submissions.`);
    if (submissions.length > 0) {
        console.log("Sample Submission:", submissions[0]);
    }

    console.log("\n--- Checking Problems ---");
    const [problems] = await pool.query("SELECT id, title, language, problem_type FROM problems WHERE language = 'REACT_NATIVE'");
    console.log(`Found ${problems.length} REACT_NATIVE problems.`);
    if (problems.length > 0) {
        console.log("Sample Problem:", problems[0]);
    }

    if (submissions.length > 0) {
        const sampleSub = submissions[0];
        
        console.log("\n--- Check User ---");
        const [user] = await pool.query("SELECT id, full_name, email FROM users WHERE id = ?", [sampleSub.user_id]);
        console.log("User for sample submission:", user);
        if (user && user[0]) {
             console.log("User Name:", user[0].full_name);
        }

        const [joined] = await pool.query(`
            SELECT s.id, p.language, u.email
            FROM submissions s 
            JOIN problems p ON s.problem_id = p.id 
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ?`, [sampleSub.id]);
        console.log("\n--- Check Full Join ---");
        console.log("Full Joined result for sample submission:", joined);
    }
    console.log("\n--- Check test_session_submissions ---");
    const [sessionSubmissions] = await pool.query("SELECT * FROM test_session_submissions LIMIT 5");
    console.log(`Found ${sessionSubmissions.length} session submissions.`);
    if (sessionSubmissions.length > 0) {
        console.log("Sample Session Submission:", sessionSubmissions[0]);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

checkData();
