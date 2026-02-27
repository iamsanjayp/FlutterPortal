import pool from "../config/db.js";

export async function getActiveSchedule() {
  const [[schedule]] = await pool.query(
    `
    SELECT id, name, start_at, end_at, duration_minutes, is_active
    FROM test_schedules
    WHERE is_active = true
      AND NOW() BETWEEN start_at AND end_at
    ORDER BY id DESC
    LIMIT 1
    `
  );

  return schedule || null;
}

export async function getLatestSchedules(limit = 10) {
  const [rows] = await pool.query(
    `
    SELECT id, name, start_at, end_at, duration_minutes, is_active, created_at
    FROM test_schedules
    ORDER BY id DESC
    LIMIT ?
    `,
    [limit]
  );

  return rows;
}

export async function getScheduleForTime(timestamp) {
  if (!timestamp) return null;
  const [[schedule]] = await pool.query(
    `
    SELECT id, name, start_at, end_at, duration_minutes, is_active
    FROM test_schedules
    WHERE ? BETWEEN start_at AND end_at
    ORDER BY id DESC
    LIMIT 1
    `,
    [timestamp]
  );

  return schedule || null;
}
