import pool from "../config/db.js";
import { getCurrentLevel, getLevelConfig, getNextLevel } from "../utils/level.js";
import { getActiveSchedule, getScheduleForTime } from "../utils/schedule.js";

export async function startTest(req, res) {
  const userId = req.user.id;
  const level = await getCurrentLevel(userId);
  const { questionCount, durationMinutes: defaultDuration } = getLevelConfig(level);
  const schedule = await getActiveSchedule();

  if (!schedule) {
    return res.status(403).json({ error: "Test portal is not scheduled" });
  }

  const durationMinutes = schedule.duration_minutes || defaultDuration;

  const [[existingSession]] = await pool.query(
    `
    SELECT id, level, status, started_at, ended_at, duration_minutes
    FROM test_sessions
    WHERE user_id = ? AND status = 'IN_PROGRESS'
    ORDER BY started_at DESC, id DESC
    LIMIT 1
    `,
    [userId]
  );

  if (existingSession) {
    return res.json({
      sessionId: existingSession.id,
      level: existingSession.level,
      durationMinutes: existingSession.duration_minutes || schedule.duration_minutes || defaultDuration,
      questionCount,
      message: "Test already in progress",
    });
  }

  const [[recentSession]] = await pool.query(
    `
    SELECT id, level, status, started_at
    FROM test_sessions
    WHERE user_id = ?
    ORDER BY started_at DESC, id DESC
    LIMIT 1
    `,
    [userId]
  );

  if (recentSession && schedule?.start_at && schedule?.end_at && recentSession.started_at) {
    const startedAt = new Date(recentSession.started_at).getTime();
    const startWindow = new Date(schedule.start_at).getTime();
    const endWindow = new Date(schedule.end_at).getTime();
    if (startedAt >= startWindow && startedAt <= endWindow && recentSession.status !== "IN_PROGRESS") {
      return res.status(403).json({ error: "Test already submitted" });
    }
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [sessionResult] = await conn.query(
      `
      INSERT INTO test_sessions (user_id, level, status, started_at, level_cleared, duration_minutes)
      VALUES (?, ?, 'IN_PROGRESS', NOW(), 0, ?)
      `,
      [userId, level, durationMinutes]
    );

    const sessionId = sessionResult.insertId;

    const [problems] = await conn.query(
      `
      SELECT id FROM problems
      WHERE level = ? AND is_active = true
      ORDER BY RAND()
      LIMIT ?
      `,
      [level, questionCount]
    );

    if (problems.length < questionCount) {
      throw new Error("Not enough problems configured");
    }

    for (let i = 0; i < problems.length; i++) {
      await conn.query(
        `
        INSERT INTO test_session_questions
        (test_session_id, problem_id, order_no)
        VALUES (?, ?, ?)
        `,
        [sessionId, problems[i].id, i + 1]
      );
    }

    await conn.commit();

    res.json({
      sessionId,
      level,
      durationMinutes,
      questionCount,
      message: "Test session started",
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
}

export async function getTestData(req, res) {
  const sessionId = req.params.sessionId;

  const [[session]] = await pool.query(
    `
    SELECT duration_minutes, started_at
    FROM test_sessions
    WHERE id = ?
    `,
    [sessionId]
  );

  const schedule = session?.started_at ? await getScheduleForTime(session.started_at) : null;

  const [questions] = await pool.query(
    `
    SELECT p.id, p.title, p.description, p.starter_code, tsq.order_no
    FROM test_session_questions tsq
    JOIN problems p ON p.id = tsq.problem_id
    WHERE tsq.test_session_id = ?
    ORDER BY tsq.order_no
    `,
    [sessionId]
  );

  for (const q of questions) {
    const [cases] = await pool.query(
      `
      SELECT id, input, expected_output, is_hidden, order_no
      FROM test_cases
      WHERE problem_id = ?
      ORDER BY order_no
      `,
      [q.id]
    );

    q.testCases = cases.map(tc => ({
      id: tc.id,
      input: tc.is_hidden ? null : tc.input,
      expectedOutput: tc.is_hidden ? null : tc.expected_output,
      isHidden: tc.is_hidden,
      order: tc.order_no,
      status: "NOT_TESTED",
    }));
  }

  res.json({
    questions,
    session: {
      durationMinutes: session?.duration_minutes || null,
      startedAt: session?.started_at || null,
      scheduleEndAt: schedule?.end_at || null,
    },
    serverNow: new Date().toISOString(),
  });
}

export async function getTestMeta(req, res) {
  try {
    const sessionId = req.params.sessionId;
    const [[session]] = await pool.query(
      `
      SELECT duration_minutes, started_at, status, ignore_schedule_end
      FROM test_sessions
      WHERE id = ?
      `,
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const schedule = session?.started_at ? await getScheduleForTime(session.started_at) : null;

    const now = new Date();
    const scheduleEnd = schedule?.end_at ? new Date(schedule.end_at) : null;
    const durationEnd = session?.started_at && session?.duration_minutes
      ? new Date(new Date(session.started_at).getTime() + session.duration_minutes * 60 * 1000)
      : null;

    const shouldEndBySchedule = !session?.ignore_schedule_end && scheduleEnd && now >= scheduleEnd;
    const shouldEndByDuration = durationEnd && now >= durationEnd;

    if (session.status === "IN_PROGRESS" && (shouldEndBySchedule || shouldEndByDuration)) {
      await pool.query(
        `
        UPDATE test_sessions
        SET status = 'FAIL', ended_at = NOW(), level_cleared = 0
        WHERE id = ?
        `,
        [sessionId]
      );
      session.status = "FAIL";
    }

    res.json({
      session: {
        durationMinutes: session?.duration_minutes || null,
        startedAt: session?.started_at || null,
        status: session?.status || null,
        scheduleEndAt: schedule?.end_at || null,
      },
      serverNow: now.toISOString(),
    });
  } catch (err) {
    console.error("Meta fetch error:", err);
    res.status(500).json({ error: "Failed to load session meta" });
  }
}

export async function finishTest(req, res) {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const [[session]] = await pool.query(
      `
      SELECT id, level
      FROM test_sessions
      WHERE id = ? AND user_id = ?
      `,
      [sessionId, userId]
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const [[totalRow]] = await pool.query(
      `
      SELECT COUNT(*) AS totalCount
      FROM test_session_questions tsq
      JOIN test_cases tc ON tc.problem_id = tsq.problem_id
      WHERE tsq.test_session_id = ?
      `,
      [sessionId]
    );

    const totalCount = totalRow?.totalCount || 0;

    const [latestRows] = await pool.query(
      `
      SELECT t.test_case_id, t.status
      FROM test_case_results t
      JOIN (
        SELECT test_case_id, MAX(id) AS max_id
        FROM test_case_results
        WHERE test_session_id = ?
        GROUP BY test_case_id
      ) latest ON latest.max_id = t.id
      `,
      [sessionId]
    );

    const passedCount = latestRows.filter(r => r.status === "PASS").length;
    const levelCleared = totalCount > 0 && passedCount === totalCount;
    const status = levelCleared ? "PASS" : "FAIL";

    await pool.query(
      `
      UPDATE test_sessions
      SET status = ?, ended_at = NOW(), feedback = ?, level_cleared = ?
      WHERE id = ?
      `,
      [status, null, levelCleared ? 1 : 0, sessionId]
    );

    if (status === "PASS" && levelCleared) {
      const nextLevel = getNextLevel(session.level);
      await pool.query(
        "UPDATE users SET current_level = ? WHERE id = ?",
        [nextLevel, userId]
      );
    }

    res.json({
      status,
      totalPassed: passedCount,
      totalCount,
      levelCleared,
      feedback: null,
      level: session.level,
      nextLevel: levelCleared ? getNextLevel(session.level) : session.level,
    });
  } catch (err) {
    console.error("Finish test error:", err);
    res.status(500).json({ error: "Failed to finish test" });
  }
}

export async function submitFeedback(req, res) {
  try {
    const userId = req.user.id;
    const { sessionId, feedback } = req.body;

    if (!sessionId || typeof feedback !== "string") {
      return res.status(400).json({ error: "Missing feedback" });
    }

    const [[session]] = await pool.query(
      `
      SELECT id
      FROM test_sessions
      WHERE id = ? AND user_id = ?
      `,
      [sessionId, userId]
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await pool.query(
      `
      UPDATE test_sessions
      SET feedback = ?
      WHERE id = ?
      `,
      [feedback, sessionId]
    );

    res.json({ message: "Feedback saved" });
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ error: "Failed to save feedback" });
  }
}