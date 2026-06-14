import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";
import pool from "../config/db.js";
import { getCurrentLevel, getLevelConfig, parseMultilineEntries, parseResourceEntries } from "../utils/level.js";
import { getActiveScheduleForUser } from "../utils/schedule.js";

const router = express.Router();

// Any logged-in user
router.get("/me", authenticate, async (req, res) => {
  const [[user]] = await pool.query(
    `
    SELECT id, full_name, email, enrollment_no, roll_no, staff_id, role_id
    FROM users
    WHERE id = ?
    `,
    [req.user.id]
  );

  const level = await getCurrentLevel(req.user.id);
  const { durationMinutes, questionCount, assessmentType } = await getLevelConfig(level);

  res.json({
    message: "Authenticated",
    user,
    level,
    durationMinutes,
    questionCount,
    assessmentType,
  });
});

router.get("/me/dashboard", authenticate, authorizeRoles(1), async (req, res) => {
  try {
    const userId = req.user.id;

    const [[user]] = await pool.query(
      `
      SELECT id, full_name, email, enrollment_no, roll_no, staff_id, role_id, is_active
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const level = await getCurrentLevel(userId);
    const levelConfig = await getLevelConfig(level);
    const activeSchedule = await getActiveScheduleForUser(userId);

    const [[nextSchedule]] = await pool.query(
      `
      SELECT sch.id, sch.name, sch.start_at, sch.end_at, sch.duration_minutes, sch.is_active
      FROM test_schedule_registrations reg
      JOIN test_schedules sch ON sch.id = reg.schedule_id
      WHERE reg.user_id = ? AND sch.start_at > NOW()
      ORDER BY sch.start_at ASC
      LIMIT 1
      `,
      [userId]
    );

    const [[statsRow]] = await pool.query(
      `
      SELECT
        COUNT(*) AS totalAttempts,
        SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) AS passCount,
        SUM(CASE WHEN status = 'FAIL' THEN 1 ELSE 0 END) AS failCount,
        SUM(CASE WHEN status = 'AWAITING_MANUAL' THEN 1 ELSE 0 END) AS awaitingManualCount,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS inProgressCount,
        MAX(started_at) AS lastAttemptAt
      FROM test_sessions
      WHERE user_id = ?
      `,
      [userId]
    );

    const [recentSessions] = await pool.query(
      `
      SELECT id, level, status, level_cleared, started_at, ended_at, duration_minutes
      FROM test_sessions
      WHERE user_id = ?
      ORDER BY started_at DESC, id DESC
      LIMIT 6
      `,
      [userId]
    );

    const [levels] = await pool.query(
      `
      SELECT level_code, assessment_type, question_count, duration_minutes, pass_threshold, is_active,
             student_overview, portions_text, resource_links_text
      FROM levels
      ORDER BY level_code
      `
    );

    const normalizedLevels = levels.map((row) => ({
      levelCode: row.level_code,
      assessmentType: row.assessment_type,
      questionCount: row.question_count,
      durationMinutes: row.duration_minutes,
      passThreshold: row.pass_threshold,
      isActive: row.is_active === 1,
      studentOverview: row.student_overview || "",
      portionsText: row.portions_text || "",
      resourceLinksText: row.resource_links_text || "",
      portions: parseMultilineEntries(row.portions_text),
      resources: parseResourceEntries(row.resource_links_text),
    }));

    const currentLevelDetails = normalizedLevels.find((row) => row.levelCode === level) || null;
    const currentIndex = normalizedLevels.findIndex((row) => row.levelCode === level);
    const levelProgress = normalizedLevels.length > 1 && currentIndex >= 0
      ? Math.round((currentIndex / (normalizedLevels.length - 1)) * 100)
      : 0;

    res.json({
      user,
      level,
      levelConfig,
      dashboard: {
        stats: {
          totalAttempts: Number(statsRow?.totalAttempts || 0),
          passCount: Number(statsRow?.passCount || 0),
          failCount: Number(statsRow?.failCount || 0),
          awaitingManualCount: Number(statsRow?.awaitingManualCount || 0),
          inProgressCount: Number(statsRow?.inProgressCount || 0),
          lastAttemptAt: statsRow?.lastAttemptAt || null,
          passRate: Number(statsRow?.totalAttempts || 0)
            ? Math.round((Number(statsRow?.passCount || 0) / Number(statsRow?.totalAttempts || 0)) * 100)
            : 0,
        },
        currentLevelDetails,
        levelProgress,
        activeSchedule: activeSchedule || null,
        nextSchedule: nextSchedule || null,
        canLaunchTest: Boolean(activeSchedule),
        recentSessions,
        levels: normalizedLevels,
      },
    });
  } catch (err) {
    console.error("Dashboard load error:", err);
    res.status(500).json({ error: "Failed to load student dashboard" });
  }
});

// Admin-only route (role_id = ADMIN)
router.get(
  "/admin",
  authenticate,
  authorizeRoles(3), // ADMIN role id
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  }
);

export default router;
