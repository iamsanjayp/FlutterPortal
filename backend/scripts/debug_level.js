import pool from "../src/config/db.js";
import { getCurrentLevel } from "../src/utils/level.js";
import fs from 'fs';

async function debugLevel() {
  try {
    const logObj = {};

    const [[lastUser]] = await pool.query("SELECT * FROM users ORDER BY created_at DESC LIMIT 1");
    
    if (!lastUser) {
        fs.writeFileSync('debug_level_output.txt', "No users found.");
        return;
    }
    
    logObj.lastUser = { id: lastUser.id, email: lastUser.email, dbLevel: lastUser.current_level };
    
    const computedLevel = await getCurrentLevel(lastUser.id);
    logObj.lastUserComputed = computedLevel;
    
    // Check for a user that really should be 1A
    const rand = Date.now();
    const [res] = await pool.query(
        "INSERT INTO users (full_name, email, password_hash, enrollment_no, roll_no, current_level, role_id, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, 1, NOW())",
        [`Debug User ${rand}`, `debug_${rand}@example.com`, 'hash', `EN${rand}`, `R${rand}`, '1A']
    );
    const newId = res.insertId;
    
    const [[newUser]] = await pool.query("SELECT current_level FROM users WHERE id = ?", [newId]);
    logObj.debugUser = { id: newId, dbLevel: newUser.current_level };
    
    const newComputed = await getCurrentLevel(newId);
    logObj.debugUserComputed = newComputed;
    
    fs.writeFileSync('debug_level_output.txt', JSON.stringify(logObj, null, 2));
    
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('debug_level_output.txt', "Error: " + err.message);
    process.exit(1);
  }
}

debugLevel();
