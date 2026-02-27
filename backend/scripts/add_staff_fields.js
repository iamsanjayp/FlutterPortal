import 'dotenv/config';
import pool from '../src/config/db.js';

async function run() {
    try {
        console.log("Adding columns to users table...");
        await pool.query('ALTER TABLE users ADD COLUMN age INT DEFAULT NULL');
        await pool.query('ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT NULL');
        await pool.query('ALTER TABLE users ADD COLUMN experience_years INT DEFAULT NULL');
        console.log("Columns added successfully.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist.");
        } else {
            console.error(e);
        }
    } finally {
        process.exit(0);
    }
}
run();
