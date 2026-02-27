import pool from "../config/db.js";

// Ensure table exists
async function ensureSettingsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(50) PRIMARY KEY,
      setting_value VARCHAR(255),
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Insert defaults if empty
  await pool.query(`
    INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
    ('maintenance_mode', 'false', 'Enable maintenance mode to prevent non-admin access'),
    ('allow_registration', 'true', 'Allow new students to register'),
    ('default_questions_count', '5', 'Default number of questions per exam'),
    ('exam_duration_minutes', '60', 'Default duration for exams in minutes'),
    ('support_email', 'support@college.edu', 'Contact email for support')
  `);
}

// Init table
ensureSettingsTable().catch(console.error);

export async function getSettings(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM system_settings");
    
    // Convert to object
    const settings = rows.reduce((acc, row) => {
      // Parse booleans and numbers
      let value = row.setting_value;
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      if (!isNaN(value) && value.trim() !== '') value = Number(value); // simple number check

      acc[row.setting_key] = value;
      return acc;
    }, {});

    res.json({ settings });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
}

export async function updateSettings(req, res) {
  try {
    const { settings } = req.body; // Expect object { key: value }

    if (!settings) {
      return res.status(400).json({ error: "No settings provided" });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const [key, value] of Object.entries(settings)) {
        await connection.query(`
          INSERT INTO system_settings (setting_key, setting_value)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `, [key, String(value)]);
      }

      await connection.commit();
      res.json({ message: "Settings updated successfully" });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
}
