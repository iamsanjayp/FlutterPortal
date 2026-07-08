import pool from "../config/db.js";

function parseMultilineEntries(value) {
  if (!value) return [];

  const raw = String(value).trim();
  if (!raw) return [];

  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function parseResourceEntries(value) {
  return parseMultilineEntries(value).map((line) => {
    const [labelPart, urlPart] = line.split(/\s*[|,-]\s*/, 2);
    const label = (labelPart || "").trim();
    const url = (urlPart || labelPart || "").trim();
    return {
      label: label || url,
      url,
    };
  });
}

const LEVELS = [
  "1A",
  "1B",
  "1C",
  "2A",
  "2B",
  "2C",
  "3A",
  "3B",
  "3C",
  "4A",
  "4B",
  "4C",
  "5A",
  "5B",
  "5C",
];

export async function getLevelConfig(level) {
  try {
    const [rows] = await pool.query(
      `
            SELECT question_count, duration_minutes, assessment_type, pass_threshold, is_active,
              student_overview, portions_text, resource_links_text
      FROM levels
      WHERE level_code = ?
      LIMIT 1
      `,
      [level]
    );

    if (rows.length > 0) {
      const row = rows[0];
      const rawType = row.assessment_type || "TEST_CASE";
      const assessmentType = (rawType === "UI_COMPARE" || rawType === "FLUTTER_UI") ? "FLUTTER_UI" : "TEST_CASE";
      return {
        questionCount: row.question_count ?? 2,
        durationMinutes: row.duration_minutes ?? 60,
        assessmentType,
        passThreshold: row.pass_threshold ?? 85,
        isActive: row.is_active === 1,
        studentOverview: row.student_overview || "",
        portionsText: row.portions_text || "",
        resourceLinksText: row.resource_links_text || "",
        portions: parseMultilineEntries(row.portions_text),
        resources: parseResourceEntries(row.resource_links_text),
      };
    }
  } catch {
    // fallback to defaults if levels table is not available yet
  }

  const isLowerLevel = level.startsWith("1") || level.startsWith("2");
  return {
    questionCount: isLowerLevel ? 2 : 1,
    durationMinutes: isLowerLevel ? 60 : 90,
    assessmentType: level === "1A" ? "TEST_CASE" : "FLUTTER_UI",
    passThreshold: 85,
    isActive: true,
    studentOverview: "",
    portionsText: "",
    resourceLinksText: "",
    portions: [],
    resources: [],
  };
}

export function isUiAssessment(type) {
  return type === "FLUTTER_UI" || type === "UI_COMPARE";
}

export async function getCurrentLevel(userId) {
  const [[levelRow]] = await pool.query(
    "SELECT current_level FROM student_levels WHERE user_id = ?",
    [userId]
  );

  if (levelRow?.current_level) {
    return levelRow.current_level;
  }

  const [sessions] = await pool.query(
    `
    SELECT level, status, level_cleared
    FROM test_sessions
    WHERE user_id = ?
    ORDER BY started_at DESC, id DESC
    LIMIT 1
    `,
    [userId]
  );

  if (sessions.length === 0) {
    return "1A";
  }

  const lastLevel = sessions[0].level;
  const lastStatus = sessions[0].status;
  const lastCleared = sessions[0].level_cleared === 1;

  if (lastStatus !== "PASS" || !lastCleared) {
    return lastLevel;
  }

  const currentIndex = LEVELS.indexOf(lastLevel);
  if (currentIndex === -1 || currentIndex === LEVELS.length - 1) {
    return lastLevel;
  }

  return LEVELS[currentIndex + 1];
}

export async function setCurrentLevel(userId, level) {
  await pool.query(
    `
    INSERT INTO student_levels (user_id, current_level)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE current_level = ?, updated_at = CURRENT_TIMESTAMP
    `,
    [userId, level, level]
  );
}

export function getNextLevel(level) {
  const currentIndex = LEVELS.indexOf(level);
  if (currentIndex === -1 || currentIndex === LEVELS.length - 1) {
    return level;
  }
  return LEVELS[currentIndex + 1];
}

export { parseMultilineEntries, parseResourceEntries };
