import pool from "../config/db.js";

// Ensure table exists
async function ensurePoolConfigTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pool_configs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      skill VARCHAR(50) NOT NULL,
      level_number INT NOT NULL,
      sub_level VARCHAR(1) NOT NULL,
      questions_per_student INT DEFAULT 5,
      randomization_mode ENUM('FIXED', 'DYNAMIC') DEFAULT 'FIXED',
      is_active BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_config (skill, level_number, sub_level)
    )
  `);
}

// Ensure table exists on module load (simplified for this context)
ensurePoolConfigTable().catch(console.error);

export async function getPoolConfig(req, res) {
  try {
    const { skill, levelNumber, subLevel } = req.query;

    if (!skill || !levelNumber || !subLevel) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const [rows] = await pool.query(`
      SELECT * FROM pool_configs 
      WHERE skill = ? AND level_number = ? AND sub_level = ?
    `, [skill, levelNumber, subLevel]);

    if (rows.length === 0) {
      // Return default if not configured
      return res.json({
        config: {
          skill,
          level_number: parseInt(levelNumber),
          sub_level: subLevel,
          questions_per_student: 5,
          randomization_mode: 'FIXED',
          is_active: true
        }
      });
    }

    res.json({ config: rows[0] });
  } catch (err) {
    console.error("Get pool config error:", err);
    res.status(500).json({ error: "Failed to load pool config" });
  }
}

export async function updatePoolConfig(req, res) {
  try {
    const { skill, levelNumber, subLevel, questionsPerStudent, randomizationMode, isActive } = req.body;

    if (!skill || !levelNumber || !subLevel) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await pool.query(`
      INSERT INTO pool_configs (skill, level_number, sub_level, questions_per_student, randomization_mode, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        questions_per_student = VALUES(questions_per_student),
        randomization_mode = VALUES(randomization_mode),
        is_active = VALUES(is_active)
    `, [
      skill, 
      levelNumber, 
      subLevel, 
      questionsPerStudent || 5, 
      randomizationMode || 'FIXED', 
      isActive
    ]);

    res.json({ message: "Pool configuration updated successfully" });
  } catch (err) {
    console.error("Update pool config error:", err);
    res.status(500).json({ error: "Failed to update pool config" });
  }
}

export async function previewPool(req, res) {
  try {
    const { skill, levelNumber, subLevel, count } = req.query;

    if (!skill || !levelNumber || !subLevel) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const limit = parseInt(count) || 5;

    // Map skill to language
    const languageMap = { 'react-native': 'REACT_NATIVE', 'React Native': 'REACT_NATIVE', 'flutter': 'FLUTTER', 'python': 'PYTHON' };
    const language = languageMap[skill] || skill.toUpperCase().replace('-', '_');

    // Fetch eligible questions (active only)
    const [questions] = await pool.query(`
      SELECT id, title, level, problem_type 
      FROM problems
      WHERE language = ? 
        AND SUBSTRING(level, 1, 1) = ? 
        AND SUBSTRING(level, 2, 1) = ?
        AND is_active = 1
      ORDER BY RAND()
      LIMIT ?
    `, [language, levelNumber, subLevel, limit]);

    res.json({ questions });
  } catch (err) {
    console.error("Preview pool error:", err);
    res.status(500).json({ error: "Failed to generate preview" });
  }
}
