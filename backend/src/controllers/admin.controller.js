import pool from "../config/db.js";
import { getLevelConfig, getNextLevel } from "../utils/level.js";
import { getLatestSchedules } from "../utils/schedule.js";

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
      "SELECT COUNT(*) AS submissionsCount FROM test_session_submissions"
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
      FROM test_session_submissions s
      JOIN problems p ON p.id = s.problem_id
      JOIN users u ON u.id = s.user_id
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
    const schedules = await getLatestSchedules(25);
    res.json({ schedules });
  } catch (err) {
    console.error("Schedule list error:", err);
    res.status(500).json({ error: "Failed to load schedules" });
  }
}

export async function createSchedule(req, res) {
  try {
    const { name, startAt, endAt, durationMinutes, isActive } = req.body;

    if (!startAt || !endAt) {
      return res.status(400).json({ error: "Missing schedule time" });
    }

    const [result] = await pool.query(
      `
      INSERT INTO test_schedules (name, start_at, end_at, duration_minutes, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [name || "Scheduled Test", startAt, endAt, durationMinutes || null, isActive ? 1 : 0]
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
    const { name, startAt, endAt, durationMinutes, isActive } = req.body;

    const [result] = await pool.query(
      `
      UPDATE test_schedules
      SET
        name = COALESCE(?, name),
        start_at = COALESCE(?, start_at),
        end_at = COALESCE(?, end_at),
        duration_minutes = COALESCE(?, duration_minutes),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        name ?? null,
        startAt ?? null,
        endAt ?? null,
        durationMinutes ?? null,
        typeof isActive === "boolean" ? (isActive ? 1 : 0) : null,
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

      const { questionCount } = getLevelConfig(session.level);
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

    const { status, id, email, rollNo, date } = req.query;
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

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const [rows] = await pool.query(
      `
            SELECT ts.id, ts.user_id, ts.level, ts.status, ts.started_at, ts.duration_minutes,
              u.full_name, u.email, u.roll_no
      FROM test_sessions ts
      JOIN users u ON u.id = ts.user_id
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
    res.json({ message: "User logged out" });
  } catch (err) {
    console.error("Force logout error:", err);
    res.status(500).json({ error: "Failed to force logout" });
  }
}

export async function updateSessionDuration(req, res) {
  try {
    const { id } = req.params;
    const { durationMinutes } = req.body;

    if (!durationMinutes) {
      return res.status(400).json({ error: "Missing duration" });
    }

    const [result] = await pool.query(
      `
      UPDATE test_sessions
      SET duration_minutes = ?, ignore_schedule_end = 1
      WHERE id = ?
      `,
      [durationMinutes, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ message: "Duration updated" });
  } catch (err) {
    console.error("Update duration error:", err);
    res.status(500).json({ error: "Failed to update duration" });
  }
}

export async function getSubmissions(req, res) {
  try {
    const { sessionId, studentId, scheduleId } = req.query;

    const conditions = [];
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

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `
      SELECT s.id, s.test_session_id, s.user_id, s.problem_id, s.status, s.created_at, s.code,
             p.title AS problem_title, u.full_name AS student_name,
             sch.id AS schedule_id, sch.name AS schedule_name
      FROM test_session_submissions s
      JOIN test_sessions ts ON ts.id = s.test_session_id
      JOIN test_schedules sch ON ts.started_at BETWEEN sch.start_at AND sch.end_at
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
      "UPDATE test_session_submissions SET status = ? WHERE id = ?",
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
    SELECT s.problem_id, s.status
    FROM test_session_submissions s
    JOIN (
      SELECT problem_id, MAX(id) AS max_id
      FROM test_session_submissions
      WHERE test_session_id = ?
      GROUP BY problem_id
    ) latest ON latest.max_id = s.id
    `,
    [sessionId]
  );

  const passCount = latestRows.filter(r => r.status === "PASS").length;
  const failCount = latestRows.filter(r => r.status === "FAIL").length;

  let status = "IN_PROGRESS";
  let levelCleared = 0;

  if (totalCount > 0 && passCount === totalCount) {
    status = "PASS";
    levelCleared = 1;
  } else if (failCount > 0) {
    status = "FAIL";
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
    await pool.query(
      "UPDATE users SET current_level = ? WHERE id = ?",
      [nextLevel, session.user_id]
    );
  } else {
    await pool.query(
      "UPDATE users SET current_level = ? WHERE id = ?",
      [session.level, session.user_id]
    );
  }

  return { status, levelCleared };
}

export async function getStudents(req, res) {
  try {
    const { query } = req.query;
    const search = query ? `%${query}%` : "%";

    const [rows] = await pool.query(
      `
      SELECT id, full_name, email, enrollment_no, roll_no, is_active, current_level
      FROM users
      WHERE role_id != 3
        AND (full_name LIKE ? OR email LIKE ? OR enrollment_no LIKE ? OR roll_no LIKE ?)
      ORDER BY full_name
      LIMIT 50
      `,
      [search, search, search, search]
    );

    res.json({ students: rows });
  } catch (err) {
    console.error("Student list error:", err);
    res.status(500).json({ error: "Failed to load students" });
  }
}

export async function updateStudentLevel(req, res) {
  try {
    const { id } = req.params;
    const { level } = req.body;

    if (!level) {
      return res.status(400).json({ error: "Missing level" });
    }

    const [result] = await pool.query(
      "UPDATE users SET current_level = ? WHERE id = ?",
      [level, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Student not found" });
    }

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
      await pool.query(
        "UPDATE users SET current_level = ? WHERE id = ?",
        [nextLevel, session.user_id]
      );
    } else {
      await pool.query(
        "UPDATE users SET current_level = ? WHERE id = ?",
        [session.level, session.user_id]
      );
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

    await pool.query(
      "UPDATE users SET current_level = ? WHERE id = ?",
      [session.level, session.user_id]
    );

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
      SELECT id, level, title, description, starter_code, is_active
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
    const { level, title, description, starterCode, isActive } = req.body;
    if (!level || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [result] = await pool.query(
      `
      INSERT INTO problems (level, title, description, starter_code, is_active)
      VALUES (?, ?, ?, ?, ?)
      `,
      [level, title, description || "", starterCode || "", isActive ? 1 : 0]
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
    const { level, title, description, starterCode, isActive } = req.body;

    const [result] = await pool.query(
      `
      UPDATE problems
      SET
        level = COALESCE(?, level),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        starter_code = COALESCE(?, starter_code),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
      `,
      [
        level ?? null,
        title ?? null,
        description ?? null,
        starterCode ?? null,
        typeof isActive === "boolean" ? (isActive ? 1 : 0) : null,
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
