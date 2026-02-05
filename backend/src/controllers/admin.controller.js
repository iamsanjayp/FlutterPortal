import pool from "../config/db.js";
import path from "path";
import fs from "fs";
import { getLevelConfig, getNextLevel, setCurrentLevel } from "../utils/level.js";
import { getLatestSchedules } from "../utils/schedule.js";
import bcrypt from "bcrypt";
import xlsx from "xlsx";

export async function getMetrics(req, res) {
  try {
    const [[questionRow]] = await pool.query(
      "SELECT COUNT(*) AS questionCount FROM problems WHERE is_active = true"
    );
    const [[userRow]] = await pool.query(
      "SELECT COUNT(*) AS userCount FROM users WHERE role_id != 3"
    );
    const [[blockedRow]] = await pool.query(
      "SELECT COUNT(*) AS blockedCount FROM users WHERE role_id != 3 AND is_active = 0"
    );
    const [[activeSessionsRow]] = await pool.query(
      "SELECT COUNT(*) AS activeSessions FROM test_sessions WHERE status = 'IN_PROGRESS'"
    );
    const [[submissionsRow]] = await pool.query(
      `
      SELECT COUNT(*) AS submissionsCount
      FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY test_session_id, problem_id, user_id
          ORDER BY created_at DESC, id DESC
        ) AS rn
        FROM test_session_submissions
      ) ranked
      WHERE rn = 1
      `
    );
    const [[testsRow]] = await pool.query(
      "SELECT COUNT(*) AS testsToday FROM test_sessions WHERE DATE(started_at) = CURDATE()"
    );
    const [levelRows] = await pool.query(
      `
      SELECT level, COUNT(DISTINCT user_id) AS studentCount
      FROM test_sessions
      WHERE status = 'PASS' AND level_cleared = 1
      GROUP BY level
      ORDER BY level
      `
    );

    const [statusRows] = await pool.query(
      `
      SELECT status, COUNT(*) AS total
      FROM test_sessions
      WHERE status IN ('PASS', 'FAIL')
      GROUP BY status
      `
    );
    const statusMap = statusRows.reduce((acc, row) => {
      acc[row.status] = row.total;
      return acc;
    }, {});

    const [recentSubmissions] = await pool.query(
      `
      SELECT s.id, s.test_session_id, s.user_id, s.problem_id, s.status, s.created_at,
             p.title AS problem_title, u.full_name AS student_name, u.roll_no
      FROM (
        SELECT s.*, ROW_NUMBER() OVER (
          PARTITION BY s.test_session_id, s.problem_id, s.user_id
          ORDER BY s.created_at DESC, s.id DESC
        ) AS rn
        FROM test_session_submissions s
      ) s
      JOIN problems p ON p.id = s.problem_id
      JOIN users u ON u.id = s.user_id
      WHERE s.rn = 1
      ORDER BY s.created_at DESC
      LIMIT 10
      `
    );

    res.json({
      questionCount: questionRow?.questionCount || 0,
      userCount: userRow?.userCount || 0,
      blockedCount: blockedRow?.blockedCount || 0,
      activeSessions: activeSessionsRow?.activeSessions || 0,
      submissionsCount: submissionsRow?.submissionsCount || 0,
      testsToday: testsRow?.testsToday || 0,
      passCount: statusMap.PASS || 0,
      failCount: statusMap.FAIL || 0,
      levelCompletions: levelRows,
      recentSubmissions,
    });
  } catch (err) {
    console.error("Metrics error:", err);
    res.status(500).json({ error: "Failed to load metrics" });
  }
}

export async function getSchedules(req, res) {
  try {
    const params = [];
    let whereClause = "";
    if (req.user?.roleId === 2) {
      whereClause = "WHERE sch.live_teacher_id = ? OR sch.code_reviewer_id = ? OR sch.ui_reviewer_id = ?";
      params.push(req.user.id, req.user.id, req.user.id);
    }

    const [rows] = await pool.query(
      `
      SELECT sch.*, 
             live.full_name AS live_teacher_name,
             code.full_name AS code_reviewer_name,
             ui.full_name AS ui_reviewer_name
      FROM test_schedules sch
      LEFT JOIN users live ON live.id = sch.live_teacher_id
      LEFT JOIN users code ON code.id = sch.code_reviewer_id
      LEFT JOIN users ui ON ui.id = sch.ui_reviewer_id
      ${whereClause}
      ORDER BY sch.start_at DESC
      LIMIT 25
      `,
      params
    );
    res.json({ schedules: rows });
  } catch (err) {
    console.error("Schedule list error:", err);
    res.status(500).json({ error: "Failed to load schedules" });
  }
}

export async function createSchedule(req, res) {
  try {
    const { name, startAt, endAt, durationMinutes, isActive, liveTeacherId, codeReviewerId, uiReviewerId } = req.body;

    if (!startAt || !endAt) {
      return res.status(400).json({ error: "Missing schedule time" });
    }

    const [result] = await pool.query(
      `
      INSERT INTO test_schedules (name, start_at, end_at, duration_minutes, is_active, live_teacher_id, code_reviewer_id, ui_reviewer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        name || "Scheduled Test",
        startAt,
        endAt,
        durationMinutes || null,
        isActive ? 1 : 0,
        liveTeacherId || null,
        codeReviewerId || null,
        uiReviewerId || null,
      ]
    );

    res.json({ id: result.insertId, message: "Schedule created" });
  } catch (err) {
    console.error("Create schedule error:", err);
    res.status(500).json({ error: "Failed to create schedule" });
  }
}

export async function updateSchedule(req, res) {
  try {
    const { id } = req.params;
    const { name, startAt, endAt, durationMinutes, isActive, liveTeacherId, codeReviewerId, uiReviewerId } = req.body;

    const [result] = await pool.query(
      `
      UPDATE test_schedules
      SET
        name = COALESCE(?, name),
        start_at = COALESCE(?, start_at),
        end_at = COALESCE(?, end_at),
        duration_minutes = COALESCE(?, duration_minutes),
        is_active = COALESCE(?, is_active),
        live_teacher_id = COALESCE(?, live_teacher_id),
        code_reviewer_id = COALESCE(?, code_reviewer_id),
        ui_reviewer_id = COALESCE(?, ui_reviewer_id),
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        name ?? null,
        startAt ?? null,
        endAt ?? null,
        durationMinutes ?? null,
        typeof isActive === "boolean" ? (isActive ? 1 : 0) : null,
        liveTeacherId ?? null,
        codeReviewerId ?? null,
        uiReviewerId ?? null,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json({ message: "Schedule updated" });
  } catch (err) {
    console.error("Update schedule error:", err);
    res.status(500).json({ error: "Failed to update schedule" });
  }
}

export async function resetQuestions(req, res) {
  const { sessionIds, userIds } = req.body;
  const targetSessionIds = new Set(
    Array.isArray(sessionIds) ? sessionIds.map(Number).filter(Boolean) : []
  );

  if (Array.isArray(userIds) && userIds.length) {
    const [sessions] = await pool.query(
      `
      SELECT id
      FROM test_sessions
      WHERE user_id IN (?) AND status = 'IN_PROGRESS'
      `,
      [userIds]
    );
    sessions.forEach(s => targetSessionIds.add(s.id));
  }

  const finalSessions = Array.from(targetSessionIds);
  if (!finalSessions.length) {
    return res.status(400).json({ error: "No sessions found" });
  }

  const conn = await pool.getConnection();
  const updated = [];
  try {
    for (const sessionId of finalSessions) {
      await conn.beginTransaction();

      const [[session]] = await conn.query(
        "SELECT id, level FROM test_sessions WHERE id = ?",
        [sessionId]
      );

      if (!session) {
        await conn.rollback();
        continue;
      }

      const { questionCount } = await getLevelConfig(session.level);
      const [currentRows] = await conn.query(
        "SELECT problem_id FROM test_session_questions WHERE test_session_id = ?",
        [sessionId]
      );
      const currentIds = currentRows.map(row => row.problem_id).filter(Boolean);

      let problems = [];
      if (currentIds.length) {
        const [fresh] = await conn.query(
          `
          SELECT id FROM problems
          WHERE level = ? AND is_active = true AND id NOT IN (?)
          ORDER BY RAND()
          LIMIT ?
          `,
          [session.level, currentIds, questionCount]
        );
        problems = fresh;
      }

      if (problems.length < questionCount) {
        const remaining = questionCount - problems.length;
        const [fallback] = await conn.query(
          `
          SELECT id FROM problems
          WHERE level = ? AND is_active = true
          ORDER BY RAND()
          LIMIT ?
          `,
          [session.level, remaining]
        );
        const seen = new Set(problems.map(p => p.id));
        fallback.forEach(row => {
          if (!seen.has(row.id)) {
            problems.push(row);
            seen.add(row.id);
          }
        });
      }

      if (problems.length < questionCount) {
        await conn.rollback();
        throw new Error("Not enough problems configured for level");
      }

      await conn.query(
        "DELETE FROM test_session_questions WHERE test_session_id = ?",
        [sessionId]
      );
      await conn.query(
        "DELETE FROM test_case_results WHERE test_session_id = ?",
        [sessionId]
      );
      await conn.query(
        "DELETE FROM test_session_submissions WHERE test_session_id = ?",
        [sessionId]
      );

      for (let i = 0; i < problems.length; i++) {
        await conn.query(
          `
          INSERT INTO test_session_questions (test_session_id, problem_id, order_no)
          VALUES (?, ?, ?)
          `,
          [sessionId, problems[i].id, i + 1]
        );
      }

      await conn.commit();
      updated.push(sessionId);
    }

    res.json({ message: "Questions reset", sessions: updated });
  } catch (err) {
    await conn.rollback();
    console.error("Reset questions error:", err);
    res.status(500).json({ error: err.message || "Failed to reset questions" });
  } finally {
    conn.release();
  }
}

export async function getSessions(req, res) {
  try {
    await pool.query(
      `
      UPDATE test_sessions
      SET status = 'FAIL', ended_at = COALESCE(ended_at, NOW()), level_cleared = 0
      WHERE status = 'IN_PROGRESS'
        AND duration_minutes IS NOT NULL
        AND started_at IS NOT NULL
        AND DATE_ADD(started_at, INTERVAL duration_minutes MINUTE) <= NOW()
      `
    );

    await pool.query(
      `
      UPDATE test_sessions ts
      JOIN test_schedules sch
        ON ts.started_at BETWEEN sch.start_at AND sch.end_at
      SET ts.status = 'FAIL', ts.ended_at = COALESCE(ts.ended_at, NOW()), ts.level_cleared = 0
      WHERE ts.status = 'IN_PROGRESS'
        AND IFNULL(ts.ignore_schedule_end, 0) = 0
        AND NOW() > sch.end_at
      `
    );

    const { status, id, email, rollNo, date, scheduleId } = req.query;
    const conditions = [];
    const params = [];

    if (id) {
      conditions.push("ts.id = ?");
      params.push(id);
    }

    if (status) {
      conditions.push("ts.status = ?");
      params.push(status);
    }

    if (email) {
      conditions.push("u.email LIKE ?");
      params.push(`%${email}%`);
    }

    if (rollNo) {
      conditions.push("u.roll_no LIKE ?");
      params.push(`%${rollNo}%`);
    }

    if (date) {
      conditions.push("DATE(ts.started_at) = ?");
      params.push(date);
    }

    if (scheduleId && scheduleId !== "undefined") {
      conditions.push("sch.id = ?");
      params.push(scheduleId);
    }

    if (req.user?.roleId === 2) {
      conditions.push("sch.live_teacher_id = ?");
      params.push(req.user.id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const [rows] = await pool.query(
          `
          SELECT ts.id, ts.user_id, ts.level, ts.status, ts.started_at, ts.duration_minutes,
                 u.full_name, u.email, u.roll_no,
                 sch.id AS schedule_id, sch.name AS schedule_name
          FROM test_sessions ts
          JOIN users u ON u.id = ts.user_id
          JOIN test_schedules sch ON ts.started_at BETWEEN sch.start_at AND sch.end_at
          ${whereClause}
          ORDER BY ts.started_at DESC
          LIMIT 50
          `,
          params
        );

    res.json({ sessions: rows });
  } catch (err) {
    console.error("Session list error:", err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
}

async function clearSessionLogin(sessionId) {
  const [[session]] = await pool.query(
    "SELECT user_id FROM test_sessions WHERE id = ?",
    [sessionId]
  );

  if (!session) {
    return { ok: false, error: "Session not found" };
  }

  await pool.query(
    "UPDATE users SET active_session_id = NULL WHERE id = ?",
    [session.user_id]
  );

  return { ok: true };
}

export async function resetSessionLogin(req, res) {
  try {
    const { id } = req.params;
    const result = await clearSessionLogin(id);
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }
    res.json({ message: "Login reset" });
  } catch (err) {
    console.error("Reset login error:", err);
    res.status(500).json({ error: "Failed to reset login" });
  }
}

export async function forceLogoutSession(req, res) {
  try {
    const { id } = req.params;
    const result = await clearSessionLogin(id);
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }
    await pool.query(
      `
      UPDATE test_sessions
      SET status = 'FAIL', ended_at = COALESCE(ended_at, NOW()), level_cleared = 0
      WHERE id = ? AND status = 'IN_PROGRESS'
      `,
      [id]
    );
    res.json({ message: "User logged out" });
  } catch (err) {
    console.error("Force logout error:", err);
    res.status(500).json({ error: "Failed to force logout" });
  }
}

export async function resetUserLogin(req, res) {
  try {
    const { id } = req.params;
    const [[user]] = await pool.query(
      "SELECT id, active_session_id FROM users WHERE id = ?",
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.active_session_id) {
      return res.status(404).json({ error: "No active session found" });
    }

    await pool.query(
      "UPDATE users SET active_session_id = NULL WHERE id = ?",
      [id]
    );

    res.json({ message: "Login reset" });
  } catch (err) {
    console.error("Reset user login error:", err);
    res.status(500).json({ error: "Failed to reset login" });
  }
}

export async function forceLogoutUser(req, res) {
  try {
    const { id } = req.params;
    const [[user]] = await pool.query(
      "SELECT id, active_session_id FROM users WHERE id = ?",
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.active_session_id) {
      return res.status(404).json({ error: "No active session found" });
    }

    await pool.query(
      "UPDATE users SET active_session_id = NULL WHERE id = ?",
      [id]
    );

    res.json({ message: "User logged out" });
  } catch (err) {
    console.error("Force logout user error:", err);
    res.status(500).json({ error: "Failed to force logout" });
  }
}

export async function updateSessionDuration(req, res) {
  try {
    const { id } = req.params;
    const { durationMinutes, extendMinutes } = req.body;

    if (!durationMinutes && !extendMinutes) {
      return res.status(400).json({ error: "Missing duration" });
    }

    let result;
    if (extendMinutes) {
      [result] = await pool.query(
        `
        UPDATE test_sessions
        SET duration_minutes = COALESCE(duration_minutes, 0) + ?, ignore_schedule_end = 1,
            status = 'IN_PROGRESS', ended_at = NULL, level_cleared = 0
        WHERE id = ?
        `,
        [Number(extendMinutes), id]
      );
    } else {
      [result] = await pool.query(
        `
        UPDATE test_sessions
        SET duration_minutes = ?, ignore_schedule_end = 1,
            status = 'IN_PROGRESS', ended_at = NULL, level_cleared = 0
        WHERE id = ?
        `,
        [durationMinutes, id]
      );
    }

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ message: "Duration updated" });
  } catch (err) {
    console.error("Update duration error:", err);
    res.status(500).json({ error: "Failed to update duration" });
  }
}

export async function extendScheduleDuration(req, res) {
  try {
    const { id } = req.params;
    const { extendMinutes } = req.body;

    if (!extendMinutes) {
      return res.status(400).json({ error: "Missing extendMinutes" });
    }

    if (req.user?.roleId === 2) {
      const [[schedule]] = await pool.query(
        "SELECT id FROM test_schedules WHERE id = ? AND live_teacher_id = ?",
        [id, req.user.id]
      );
      if (!schedule) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const [result] = await pool.query(
      `
      UPDATE test_sessions ts
      JOIN test_schedules sch ON ts.started_at BETWEEN sch.start_at AND sch.end_at
      SET ts.duration_minutes = COALESCE(ts.duration_minutes, 0) + ?,
          ts.ignore_schedule_end = 1,
          ts.status = 'IN_PROGRESS',
          ts.ended_at = NULL,
          ts.level_cleared = 0
      WHERE sch.id = ?
      `,
      [Number(extendMinutes), id]
    );

    res.json({ message: "Duration updated", affected: result.affectedRows || 0 });
  } catch (err) {
    console.error("Extend schedule duration error:", err);
    res.status(500).json({ error: "Failed to extend duration" });
  }
}

export async function getSubmissions(req, res) {
  try {
    const { sessionId, studentId, scheduleId, assessmentType } = req.query;

    const conditions = ["s.rn = 1"];
    const params = [];

    if (sessionId) {
      conditions.push("s.test_session_id = ?");
      params.push(sessionId);
    }

    if (studentId) {
      conditions.push("s.user_id = ?");
      params.push(studentId);
    }

    if (scheduleId) {
      conditions.push("sch.id = ?");
      params.push(scheduleId);
    }

    if (assessmentType) {
      conditions.push("l.assessment_type = ?");
      params.push(assessmentType);
    }

    if (req.user?.roleId === 2) {
      conditions.push("sch.code_reviewer_id = ?");
      params.push(req.user.id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `
      SELECT s.id, s.test_session_id, s.user_id, s.problem_id, s.status, s.created_at, s.code,
             s.preview_image_url, s.score, s.match_percent,
             p.title AS problem_title, p.reference_image_url,
             u.full_name AS student_name,
             sch.id AS schedule_id, sch.name AS schedule_name
      FROM (
        SELECT s.*, ROW_NUMBER() OVER (
          PARTITION BY s.test_session_id, s.problem_id, s.user_id
          ORDER BY s.created_at DESC, s.id DESC
        ) AS rn
        FROM test_session_submissions s
      ) s
      JOIN test_sessions ts ON ts.id = s.test_session_id
      JOIN test_schedules sch ON ts.started_at BETWEEN sch.start_at AND sch.end_at
      LEFT JOIN levels l ON l.level_code = ts.level
      JOIN problems p ON p.id = s.problem_id
      JOIN users u ON u.id = s.user_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT 200
      `,
      params
    );

    res.json({ submissions: rows });
  } catch (err) {
    console.error("Submission list error:", err);
    res.status(500).json({ error: "Failed to load submissions" });
  }
}

export async function updateSubmissionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Missing status" });
    }

    const [[submission]] = await pool.query(
      "SELECT id, test_session_id FROM test_session_submissions WHERE id = ?",
      [id]
    );

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const [result] = await pool.query(
      "UPDATE test_session_submissions SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Submission not found" });
    }

    await recomputeSessionStatus(submission.test_session_id);

    res.json({ message: "Submission updated" });
  } catch (err) {
    console.error("Submission update error:", err);
    res.status(500).json({ error: "Failed to update submission" });
  }
}

export async function deleteSubmission(req, res) {
  try {
    const { id } = req.params;

    const [[submission]] = await pool.query(
      "SELECT id, test_session_id FROM test_session_submissions WHERE id = ?",
      [id]
    );

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    await pool.query(
      "DELETE FROM test_session_submissions WHERE id = ?",
      [id]
    );

    const [[countRow]] = await pool.query(
      "SELECT COUNT(*) AS totalCount FROM test_session_submissions WHERE test_session_id = ?",
      [submission.test_session_id]
    );

    if (!countRow?.totalCount) {
      await pool.query(
        `
        UPDATE test_sessions
        SET status = 'IN_PROGRESS', ended_at = NULL, level_cleared = 0
        WHERE id = ?
        `,
        [submission.test_session_id]
      );
    } else {
      await recomputeSessionStatus(submission.test_session_id);
    }

    res.json({ message: "Submission deleted" });
  } catch (err) {
    console.error("Delete submission error:", err);
    res.status(500).json({ error: "Failed to delete submission" });
  }
}

async function recomputeSessionStatus(sessionId) {
  const [[session]] = await pool.query(
    "SELECT id, user_id, level FROM test_sessions WHERE id = ?",
    [sessionId]
  );

  if (!session) {
    return null;
  }

  const [[totalRow]] = await pool.query(
    "SELECT COUNT(*) AS totalCount FROM test_session_questions WHERE test_session_id = ?",
    [sessionId]
  );

  const totalCount = totalRow?.totalCount || 0;

  const [latestRows] = await pool.query(
    `
    SELECT problem_id, status
    FROM (
      SELECT problem_id, status,
             ROW_NUMBER() OVER (PARTITION BY problem_id ORDER BY updated_at DESC, id DESC) AS rn
      FROM test_session_submissions
      WHERE test_session_id = ?
    ) ranked
    WHERE rn = 1
    `,
    [sessionId]
  );

  const passCount = latestRows.filter(r => r.status === "PASS").length;
  const failCount = latestRows.filter(r => r.status === "FAIL").length;
  const awaitingCount = latestRows.filter(r => r.status === "AWAITING_MANUAL" || r.status === "PENDING").length;

  let status = "IN_PROGRESS";
  let levelCleared = 0;

  if (totalCount > 0 && passCount === totalCount) {
    status = "PASS";
    levelCleared = 1;
  } else if (failCount > 0) {
    status = "FAIL";
    levelCleared = 0;
  } else if (awaitingCount > 0 && latestRows.length >= totalCount) {
    status = "AWAITING_MANUAL";
    levelCleared = 0;
  }

  await pool.query(
    `
    UPDATE test_sessions
    SET status = ?, level_cleared = ?, ended_at = CASE WHEN ? = 'IN_PROGRESS' THEN NULL ELSE COALESCE(ended_at, NOW()) END
    WHERE id = ?
    `,
    [status, levelCleared, status, sessionId]
  );

  if (status === "PASS" && levelCleared) {
    const nextLevel = getNextLevel(session.level);
    await setCurrentLevel(session.user_id, nextLevel);
  } else {
    await setCurrentLevel(session.user_id, session.level);
  }

  return { status, levelCleared };
}

export async function getStudents(req, res) {
  try {
    const { query, role, roles } = req.query;
    const search = query ? `%${query}%` : "%";

    const conditions = [];
    const params = [];

    const roleList = roles
      ? String(roles)
          .split(",")
          .map(value => value.trim())
          .filter(Boolean)
      : role
        ? [String(role).trim()]
        : [];

    if (roleList.length) {
      conditions.push(`r.name IN (${roleList.map(() => "?").join(", ")})`);
      params.push(...roleList);
    }

    conditions.push("(u.full_name LIKE ? OR u.email LIKE ? OR u.enrollment_no LIKE ? OR u.roll_no LIKE ?)");
    params.push(search, search, search, search);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `
      SELECT u.id, u.full_name, u.email, u.enrollment_no, u.roll_no, u.staff_id,
             u.is_active, sl.current_level, u.role_id, r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN student_levels sl ON sl.user_id = u.id
      ${whereClause}
      ORDER BY u.full_name
      LIMIT 50
      `,
      params
    );

    res.json({ students: rows });
  } catch (err) {
    console.error("Student list error:", err);
    res.status(500).json({ error: "Failed to load students" });
  }
}

export async function createUser(req, res) {
  try {
    const {
      fullName,
      email,
      roleId,
      authProvider,
      password,
      enrollmentNo,
      rollNo,
      staffId,
    } = req.body;

    if (!fullName || !email || !roleId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const provider = authProvider === "LOCAL" ? "LOCAL" : "GOOGLE";
    const normalizedEnrollment = enrollmentNo?.trim() ? enrollmentNo.trim() : null;
    const normalizedRoll = rollNo?.trim() ? rollNo.trim() : null;
    const normalizedStaff = staffId?.trim() ? staffId.trim() : null;

    let passwordHash = null;
    if (provider === "LOCAL") {
      if (!password) {
        return res.status(400).json({ error: "Password required for local users" });
      }
      passwordHash = await bcrypt.hash(password, 10);
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const [result] = await pool.query(
      `
      INSERT INTO users
      (full_name, email, enrollment_no, roll_no, staff_id, auth_provider, password_hash, role_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        fullName,
        email,
        normalizedEnrollment,
        normalizedRoll,
        normalizedStaff,
        provider,
        passwordHash,
        roleId,
      ]
    );

    if (Number(roleId) === 1) {
      await setCurrentLevel(result.insertId, "1A");
    }

    res.json({ id: result.insertId, message: "User created" });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      roleId,
      authProvider,
      password,
      enrollmentNo,
      rollNo,
      staffId,
      isActive,
    } = req.body;

    const normalizedEnrollment = enrollmentNo?.trim() ? enrollmentNo.trim() : null;
    const normalizedRoll = rollNo?.trim() ? rollNo.trim() : null;
    const normalizedStaff = staffId?.trim() ? staffId.trim() : null;

    const [[existingUser]] = await pool.query(
      "SELECT role_id FROM users WHERE id = ?",
      [id]
    );

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (email) {
      const [existing] = await pool.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id]
      );
      if (existing.length) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }

    let passwordHash = null;
    if (authProvider === "LOCAL" && password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const [result] = await pool.query(
      `
      UPDATE users
      SET
        full_name = COALESCE(?, full_name),
        email = COALESCE(?, email),
        enrollment_no = COALESCE(?, enrollment_no),
        roll_no = COALESCE(?, roll_no),
        staff_id = COALESCE(?, staff_id),
        role_id = COALESCE(?, role_id),
        auth_provider = COALESCE(?, auth_provider),
        password_hash = COALESCE(?, password_hash),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
      `,
      [
        fullName ?? null,
        email ?? null,
        normalizedEnrollment,
        normalizedRoll,
        normalizedStaff,
        roleId ?? null,
        authProvider ?? null,
        passwordHash ?? null,
        typeof isActive === "boolean" ? (isActive ? 1 : 0) : null,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "User not found" });
    }

    if (roleId !== undefined && roleId !== null) {
      const newRoleId = Number(roleId);
      if (newRoleId === 1) {
        await setCurrentLevel(id, "1A");
      } else if (existingUser.role_id === 1) {
        await pool.query(
          "DELETE FROM student_levels WHERE user_id = ?",
          [id]
        );
      }
    }

    res.json({ message: "User updated" });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
}

export async function bulkCreateUsers(req, res) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "File is required" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ error: "No sheet found in file" });
    }

    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    if (!rows.length) {
      return res.status(400).json({ error: "No rows found in file" });
    }

    const roleMap = { STUDENT: 1, TEACHER: 2, ADMIN: 3 };
    const results = [];

    for (const row of rows) {
      const email = String(row.email || row.Email || row.EMAIL || "").trim();
      const fullName = String(row.full_name || row.FullName || row.name || row.Name || "").trim();
      const enrollmentNo = String(row.enrollment_no || row.Enrollment || row.enrollment || "").trim() || null;
      const rollNo = String(row.roll_no || row.Roll || row.roll || "").trim() || null;
      const staffId = String(row.staff_id || row.StaffID || row.staff || "").trim() || null;
      const roleRaw = String(row.role || row.Role || row.role_id || row.RoleId || "").trim().toUpperCase();
      const authProviderRaw = String(row.auth_provider || row.AuthProvider || "GOOGLE").trim().toUpperCase();
      const password = String(row.password || row.Password || "").trim();

      if (!email || !fullName) {
        results.push({ email, status: "SKIPPED", reason: "Missing name or email" });
        continue;
      }

      const roleId = roleMap[roleRaw] || (Number(roleRaw) || 1);
      const authProvider = authProviderRaw === "LOCAL" ? "LOCAL" : "GOOGLE";

      const [existing] = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      if (existing.length) {
        results.push({ email, status: "SKIPPED", reason: "Email exists" });
        continue;
      }

      let passwordHash = null;
      if (authProvider === "LOCAL") {
        if (!password) {
          results.push({ email, status: "SKIPPED", reason: "Missing password for LOCAL" });
          continue;
        }
        passwordHash = await bcrypt.hash(password, 10);
      }

      const [insertResult] = await pool.query(
        `
        INSERT INTO users
        (full_name, email, enrollment_no, roll_no, staff_id, auth_provider, password_hash, role_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [fullName, email, enrollmentNo || null, rollNo || null, staffId || null, authProvider, passwordHash, roleId]
      );

      if (roleId === 1) {
        await setCurrentLevel(insertResult.insertId, "1A");
      }

      results.push({ email, status: "CREATED" });
    }

    res.json({ message: "Bulk import complete", results });
  } catch (err) {
    console.error("Bulk create users error:", err);
    res.status(500).json({ error: "Failed to import users" });
  }
}

export async function updateStudentLevel(req, res) {
  try {
    const { id } = req.params;
    const { level } = req.body;

    if (!level) {
      return res.status(400).json({ error: "Missing level" });
    }

    const [[student]] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND role_id = 1",
      [id]
    );

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    await setCurrentLevel(id, level);

    res.json({ message: "Student level updated" });
  } catch (err) {
    console.error("Student level error:", err);
    res.status(500).json({ error: "Failed to update student level" });
  }
}

export async function updateStudentStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const [result] = await pool.query(
      "UPDATE users SET is_active = ? WHERE id = ?",
      [isActive ? 1 : 0, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ message: "Student status updated" });
  } catch (err) {
    console.error("Student status error:", err);
    res.status(500).json({ error: "Failed to update student" });
  }
}

export async function getStudentSessions(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT id, level, status, level_cleared, started_at, ended_at, duration_minutes
      FROM test_sessions
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT 50
      `,
      [id]
    );

    res.json({ sessions: rows });
  } catch (err) {
    console.error("Student sessions error:", err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
}

export async function updateSessionResult(req, res) {
  try {
    const { id } = req.params;
    const { status, levelCleared } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Missing status" });
    }

    const [[session]] = await pool.query(
      "SELECT id, user_id, level FROM test_sessions WHERE id = ?",
      [id]
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const [result] = await pool.query(
      `
      UPDATE test_sessions
      SET status = ?, level_cleared = ?, ended_at = COALESCE(ended_at, NOW())
      WHERE id = ?
      `,
      [status, levelCleared ? 1 : 0, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (status === "PASS" && levelCleared) {
      const nextLevel = getNextLevel(session.level);
      await setCurrentLevel(session.user_id, nextLevel);
    } else {
      await setCurrentLevel(session.user_id, session.level);
    }

    res.json({ message: "Session updated" });
  } catch (err) {
    console.error("Update session result error:", err);
    res.status(500).json({ error: "Failed to update session" });
  }
}

export async function reinstateSession(req, res) {
  try {
    const { id } = req.params;

    const [[session]] = await pool.query(
      "SELECT id, user_id, level FROM test_sessions WHERE id = ?",
      [id]
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await pool.query(
      "DELETE FROM test_case_results WHERE test_session_id = ?",
      [id]
    );
    await pool.query(
      "DELETE FROM test_session_submissions WHERE test_session_id = ?",
      [id]
    );

    await pool.query(
      `
      UPDATE test_sessions
      SET status = 'IN_PROGRESS', ended_at = NULL, feedback = NULL, level_cleared = 0
      WHERE id = ?
      `,
      [id]
    );

    await setCurrentLevel(session.user_id, session.level);

    res.json({ message: "Session reinstated" });
  } catch (err) {
    console.error("Reinstate session error:", err);
    res.status(500).json({ error: "Failed to reinstate session" });
  }
}

export async function getProblems(req, res) {
  try {
    const [rows] = await pool.query(
      `
      SELECT id, level, title, description, starter_code, is_active, reference_image_url, ui_required_widgets
      FROM problems
      ORDER BY level, id
      `
    );
    res.json({ problems: rows });
  } catch (err) {
    console.error("Problem list error:", err);
    res.status(500).json({ error: "Failed to load problems" });
  }
}

export async function createProblem(req, res) {
  try {
    const { level, title, description, starterCode, isActive, referenceImageUrl, uiRequiredWidgets } = req.body;
    if (!level || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const uiWidgetsValue = normalizeUiWidgets(uiRequiredWidgets);
    const resolvedActive = req.user?.roleId === 2 ? 0 : (isActive ? 1 : 0);

    const [result] = await pool.query(
      `
      INSERT INTO problems (level, title, description, starter_code, is_active, reference_image_url, ui_required_widgets)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [level, title, description || "", starterCode || "", resolvedActive, referenceImageUrl || null, uiWidgetsValue]
    );

    res.json({ id: result.insertId, message: "Problem created" });
  } catch (err) {
    console.error("Create problem error:", err);
    res.status(500).json({ error: "Failed to create problem" });
  }
}

export async function updateProblem(req, res) {
  try {
    const { id } = req.params;
    const { level, title, description, starterCode, isActive, referenceImageUrl, uiRequiredWidgets } = req.body;

    const uiWidgetsValue = normalizeUiWidgets(uiRequiredWidgets);

    const [result] = await pool.query(
      `
      UPDATE problems
      SET
        level = COALESCE(?, level),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        starter_code = COALESCE(?, starter_code),
        is_active = COALESCE(?, is_active),
        reference_image_url = COALESCE(?, reference_image_url),
        ui_required_widgets = COALESCE(?, ui_required_widgets)
      WHERE id = ?
      `,
      [
        level ?? null,
        title ?? null,
        description ?? null,
        starterCode ?? null,
        typeof isActive === "boolean" ? (isActive ? 1 : 0) : null,
        referenceImageUrl ?? null,
        uiWidgetsValue,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json({ message: "Problem updated" });
  } catch (err) {
    console.error("Update problem error:", err);
    res.status(500).json({ error: "Failed to update problem" });
  }
}

export async function bulkCreateProblems(req, res) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "File is required" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ error: "No sheet found in file" });
    }

    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    if (!rows.length) {
      return res.status(400).json({ error: "No rows found in file" });
    }

    const results = [];

    for (const row of rows) {
      const level = String(row.level || row.Level || row.level_code || "").trim();
      const title = String(row.title || row.Title || "").trim();
      const description = String(row.description || row.Description || "").trim();
      const starterCode = String(row.starter_code || row.StarterCode || row.starterCode || "").trim();
      const referenceImageUrl = String(row.reference_image_url || row.ReferenceImageUrl || "").trim() || null;
      const uiRequiredRaw = row.ui_required_widgets || row.UiRequiredWidgets || row.uiRequiredWidgets || "";
      const isActiveRaw = String(row.is_active || row.IsActive || "").trim().toLowerCase();

      if (!level || !title) {
        results.push({ title, status: "SKIPPED", reason: "Missing level or title" });
        continue;
      }

      const uiWidgetsValue = normalizeUiWidgets(uiRequiredRaw);
      const isActive = isActiveRaw === "1" || isActiveRaw === "true" || isActiveRaw === "yes";
      const resolvedActive = req.user?.roleId === 2 ? 0 : (isActive ? 1 : 0);

      await pool.query(
        `
        INSERT INTO problems (level, title, description, starter_code, is_active, reference_image_url, ui_required_widgets)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [level, title, description, starterCode, resolvedActive, referenceImageUrl, uiWidgetsValue]
      );

      results.push({ title, status: "CREATED" });
    }

    res.json({ message: "Bulk import complete", results });
  } catch (err) {
    console.error("Bulk create problems error:", err);
    res.status(500).json({ error: "Failed to import questions" });
  }
}

function normalizeUiWidgets(input) {
  if (input === undefined) return null;
  if (input === null) return null;

  if (Array.isArray(input)) {
    const cleaned = input
      .map(v => String(v || "").trim())
      .filter(Boolean);
    return cleaned.length ? JSON.stringify(cleaned) : null;
  }

  if (typeof input === "string") {
    const raw = input.trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.map(v => String(v || "").trim()).filter(Boolean);
        return cleaned.length ? JSON.stringify(cleaned) : null;
      }
    } catch {}

    const cleaned = raw
      .split(/\r?\n|,/)
      .map(v => v.trim())
      .filter(Boolean);
    return cleaned.length ? JSON.stringify(cleaned) : null;
  }

  return null;
}


export async function deleteProblem(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "UPDATE problems SET is_active = 0 WHERE id = ?",
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json({ message: "Problem deactivated" });
  } catch (err) {
    console.error("Delete problem error:", err);
    res.status(500).json({ error: "Failed to delete problem" });
  }
}

export async function getLevels(req, res) {
  try {
    const [rows] = await pool.query(
      `
      SELECT level_code, assessment_type, question_count, duration_minutes, pass_threshold, is_active
      FROM levels
      ORDER BY level_code
      `
    );
    res.json({ levels: rows });
  } catch (err) {
    console.error("Level list error:", err);
    res.status(500).json({ error: "Failed to load levels" });
  }
}

export async function createLevel(req, res) {
  try {
    const { levelCode, assessmentType, questionCount, durationMinutes, passThreshold, isActive } = req.body;
    if (!levelCode || !assessmentType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await pool.query(
      `
      INSERT INTO levels (level_code, assessment_type, question_count, duration_minutes, pass_threshold, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        levelCode,
        assessmentType,
        questionCount ?? 1,
        durationMinutes ?? 60,
        passThreshold ?? 85,
        typeof isActive === "boolean" ? (isActive ? 1 : 0) : 1,
      ]
    );

    res.json({ message: "Level created" });
  } catch (err) {
    console.error("Create level error:", err);
    res.status(500).json({ error: "Failed to create level" });
  }
}

export async function updateLevel(req, res) {
  try {
    const { code } = req.params;
    const { assessmentType, questionCount, durationMinutes, passThreshold, isActive } = req.body;

    const [result] = await pool.query(
      `
      UPDATE levels
      SET
        assessment_type = COALESCE(?, assessment_type),
        question_count = COALESCE(?, question_count),
        duration_minutes = COALESCE(?, duration_minutes),
        pass_threshold = COALESCE(?, pass_threshold),
        is_active = COALESCE(?, is_active)
      WHERE level_code = ?
      `,
      [
        assessmentType ?? null,
        questionCount ?? null,
        durationMinutes ?? null,
        passThreshold ?? null,
        typeof isActive === "boolean" ? (isActive ? 1 : 0) : null,
        code,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Level not found" });
    }

    res.json({ message: "Level updated" });
  } catch (err) {
    console.error("Update level error:", err);
    res.status(500).json({ error: "Failed to update level" });
  }
}

export async function uploadReferenceImage(req, res) {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "Missing image file" });
    }

    const uploadsDir = path.resolve(process.cwd(), "uploads", "ui_samples");
    fs.mkdirSync(uploadsDir, { recursive: true });

    const ext = path.extname(req.file.originalname) || ".png";
    const filename = `problem-${id}-${Date.now()}${ext}`;
    const destPath = path.join(uploadsDir, filename);
    fs.writeFileSync(destPath, req.file.buffer);

    const publicUrl = `/uploads/ui_samples/${filename}`;
    await pool.query(
      "UPDATE problems SET reference_image_url = ? WHERE id = ?",
      [publicUrl, id]
    );

    res.json({ message: "Image uploaded", url: publicUrl });
  } catch (err) {
    console.error("Upload reference image error:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
}


export async function getProblemTestCases(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `
      SELECT id, input, expected_output, is_hidden, order_no
      FROM test_cases
      WHERE problem_id = ?
      ORDER BY order_no
      `,
      [id]
    );

    res.json({ testCases: rows });
  } catch (err) {
    console.error("Test case list error:", err);
    res.status(500).json({ error: "Failed to load test cases" });
  }
}

export async function createTestCase(req, res) {
  try {
    const { id } = req.params;
    const { input, expectedOutput, isHidden, orderNo } = req.body;

    if (input === undefined || expectedOutput === undefined) {
      return res.status(400).json({ error: "Missing test case data" });
    }

    const [result] = await pool.query(
      `
      INSERT INTO test_cases (problem_id, input, expected_output, is_hidden, order_no)
      VALUES (?, ?, ?, ?, ?)
      `,
      [id, input, expectedOutput, isHidden ? 1 : 0, orderNo || 1]
    );

    res.json({ id: result.insertId, message: "Test case created" });
  } catch (err) {
    console.error("Create test case error:", err);
    res.status(500).json({ error: "Failed to create test case" });
  }
}

export async function updateTestCase(req, res) {
  try {
    const { id } = req.params;
    const { input, expectedOutput, isHidden, orderNo } = req.body;

    const [result] = await pool.query(
      `
      UPDATE test_cases
      SET
        input = COALESCE(?, input),
        expected_output = COALESCE(?, expected_output),
        is_hidden = COALESCE(?, is_hidden),
        order_no = COALESCE(?, order_no)
      WHERE id = ?
      `,
      [
        input ?? null,
        expectedOutput ?? null,
        typeof isHidden === "boolean" ? (isHidden ? 1 : 0) : null,
        orderNo ?? null,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Test case not found" });
    }

    res.json({ message: "Test case updated" });
  } catch (err) {
    console.error("Update test case error:", err);
    res.status(500).json({ error: "Failed to update test case" });
  }
}

export async function deleteTestCase(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM test_cases WHERE id = ?",
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Test case not found" });
    }

    res.json({ message: "Test case removed" });
  } catch (err) {
    console.error("Delete test case error:", err);
    res.status(500).json({ error: "Failed to delete test case" });
  }
}

// Manual Grading for UI Tests
export async function getUISubmissions(req, res) {
  try {
    const filter = req.query.filter || 'pending'; // pending, graded, all
    const { scheduleId } = req.query;

    let query = `
      SELECT 
        s.id, s.test_session_id, s.user_id, s.problem_id, s.code, s.status,
        s.score, s.manual_score, s.manual_graded_by, s.manual_graded_at, s.manual_feedback,
        s.final_score, s.preview_image_url, s.match_percent, s.created_at,
        u.full_name AS user_name, u.email AS user_email, u.roll_no,
        p.title AS problem_title, p.reference_image_url
      FROM (
        SELECT s.*, ROW_NUMBER() OVER (
          PARTITION BY s.test_session_id, s.problem_id, s.user_id
          ORDER BY s.created_at DESC, s.id DESC
        ) AS rn
        FROM test_session_submissions s
        WHERE s.preview_image_url IS NOT NULL
      ) s
      JOIN test_sessions ts ON ts.id = s.test_session_id
      JOIN test_schedules sch ON ts.started_at BETWEEN sch.start_at AND sch.end_at
      LEFT JOIN levels l ON l.level_code = ts.level
      JOIN users u ON u.id = s.user_id
      JOIN problems p ON p.id = s.problem_id
      WHERE s.rn = 1 AND l.assessment_type = 'UI_COMPARE'
    `;

    if (filter === 'pending') {
      query += ' AND s.manual_score IS NULL';
    } else if (filter === 'graded') {
      query += ' AND s.manual_score IS NOT NULL';
    }

    if (scheduleId) {
      query += ' AND sch.id = ?';
    }

    if (req.user?.roleId === 2) {
      query += ' AND sch.ui_reviewer_id = ?';
    }

    query += ' ORDER BY s.created_at DESC LIMIT 100';

    const params = [];
    if (scheduleId) params.push(scheduleId);
    if (req.user?.roleId === 2) params.push(req.user.id);

    const [submissions] = await pool.query(query, params);

    res.json({ submissions });
  } catch (err) {
    console.error("Get UI submissions error:", err);
    res.status(500).json({ error: "Failed to load submissions" });
  }
}

export async function submitManualGrade(req, res) {
  try {
    const submissionId = req.params.id;
    const { manualScore, feedback } = req.body;
    const graderId = req.user.id;

    if (manualScore === undefined || manualScore === null) {
      return res.status(400).json({ error: "Manual score is required" });
    }

    if (manualScore < 0 || manualScore > 100) {
      return res.status(400).json({ error: "Score must be between 0 and 100" });
    }

    // Get the submission to calculate final score
    const [[submission]] = await pool.query(
      `
      SELECT s.score, s.test_session_id, ts.user_id, ts.level
      FROM test_session_submissions s
      JOIN test_sessions ts ON ts.id = s.test_session_id
      WHERE s.id = ?
      `,
      [submissionId]
    );

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const automatedScore = submission.score || 0;
    const finalScore = (automatedScore * 0.5) + (manualScore * 0.5);
    const { passThreshold } = await getLevelConfig(submission.level);
    const status = finalScore >= (passThreshold ?? 85) ? "PASS" : "FAIL";

    await pool.query(
      `
      UPDATE test_session_submissions
      SET manual_score = ?, manual_graded_by = ?, manual_graded_at = NOW(),
          manual_feedback = ?, final_score = ?, status = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [manualScore, graderId, feedback || null, finalScore, status, submissionId]
    );

    await recomputeSessionStatus(submission.test_session_id);

    res.json({
      message: "Manual grade submitted successfully",
      finalScore: finalScore.toFixed(2),
      status,
    });
  } catch (err) {
    console.error("Submit manual grade error:", err);
    res.status(500).json({ error: "Failed to submit manual grade" });
  }
}
