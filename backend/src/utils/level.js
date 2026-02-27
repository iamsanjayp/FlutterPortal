import pool from "../config/db.js";

const LEVELS = [
  "1A", "1B", "1C",
  "2A", "2B", "2C",
  "3A", "3B", "3C",
  "4A", "4B", "4C",
];

// Detailed configuration for each level
const LEVEL_CONFIGS = {
  // Level 1: Basic Logic (CODE type)
  '1A': { questionCount: 2, durationMinutes: 45, problemType: 'CODE', testCaseCount: { sample: 2, hidden: 5, total: 7 } },
  '1B': { questionCount: 2, durationMinutes: 45, problemType: 'CODE', testCaseCount: { sample: 2, hidden: 5, total: 7 } },
  '1C': { questionCount: 2, durationMinutes: 45, problemType: 'CODE', testCaseCount: { sample: 2, hidden: 5, total: 7 } },

  // Level 2: Intermediate Logic (CODE type)
  '2A': { questionCount: 2, durationMinutes: 60, problemType: 'CODE', testCaseCount: { sample: 2, hidden: 5, total: 7 } },
  '2B': { questionCount: 2, durationMinutes: 60, problemType: 'CODE', testCaseCount: { sample: 2, hidden: 5, total: 7 } },
  '2C': { questionCount: 2, durationMinutes: 60, problemType: 'CODE', testCaseCount: { sample: 2, hidden: 5, total: 7 } },

  // Level 3: React Native UI (UI type)
  '3A': { questionCount: 1, durationMinutes: 90, problemType: 'UI', testCaseCount: { sample: 0, hidden: 0, total: 0 } },
  '3B': { questionCount: 1, durationMinutes: 90, problemType: 'UI', testCaseCount: { sample: 0, hidden: 0, total: 0 } },
  '3C': { questionCount: 1, durationMinutes: 90, problemType: 'UI', testCaseCount: { sample: 0, hidden: 0, total: 0 } },

  // Level 4: Advanced React Native (UI type)
  '4A': { questionCount: 1, durationMinutes: 90, problemType: 'UI', testCaseCount: { sample: 0, hidden: 0, total: 0 } },
  '4B': { questionCount: 1, durationMinutes: 90, problemType: 'UI', testCaseCount: { sample: 0, hidden: 0, total: 0 } },
  '4C': { questionCount: 1, durationMinutes: 90, problemType: 'UI', testCaseCount: { sample: 0, hidden: 0, total: 0 } },
};

export function getLevelConfig(level) {
  return LEVEL_CONFIGS[level] || {
    questionCount: 1,
    durationMinutes: 90,
    problemType: 'UI',
    testCaseCount: { sample: 0, hidden: 0, total: 0 }
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
    return "3A";
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
