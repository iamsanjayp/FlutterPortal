import pool from "../config/db.js";

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

export function getLevelConfig(level) {
  const isLowerLevel = level.startsWith("1") || level.startsWith("2");
  return {
    questionCount: isLowerLevel ? 2 : 1,
    durationMinutes: isLowerLevel ? 60 : 90,
  };
}

export async function getCurrentLevel(userId) {
  const [[userRow]] = await pool.query(
    "SELECT current_level FROM users WHERE id = ?",
    [userId]
  );

  if (userRow?.current_level) {
    return userRow.current_level;
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

export function getNextLevel(level) {
  const currentIndex = LEVELS.indexOf(level);
  if (currentIndex === -1 || currentIndex === LEVELS.length - 1) {
    return level;
  }
  return LEVELS[currentIndex + 1];
}
