import pool from "../config/db.js";
import { getCurrentLevel, getLevelConfig, getNextLevel, setCurrentLevel } from "../utils/level.js";
import { getActiveSchedule, getScheduleForTime } from "../utils/schedule.js";

export async function startTest(req, res) {
  const userId = req.user.id;
  const level = await getCurrentLevel(userId);
  const { questionCount, durationMinutes: defaultDuration, assessmentType, passThreshold } = await getLevelConfig(level);
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
      assessmentType,
      passThreshold,
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

    // 1. Create test session
    const [sessionResult] = await conn.query(
      `
      INSERT INTO test_sessions (user_id, level, status, started_at, level_cleared, duration_minutes)
      VALUES (?, ?, 'IN_PROGRESS', NOW(), 0, ?)
      `,
      [userId, level, durationMinutes]
    );

    const sessionId = sessionResult.insertId;

    // 2. Pick random problems (avoid recent repeats for the same student)
    const recentLimit = 30;
    const [recentRows] = await conn.query(
      `
      SELECT tsq.problem_id
      FROM test_session_questions tsq
      JOIN test_sessions ts ON ts.id = tsq.test_session_id
      WHERE ts.user_id = ?
      ORDER BY ts.started_at DESC, ts.id DESC
      LIMIT ?
      `,
      [userId, recentLimit]
    );

    const recentIds = Array.from(new Set(recentRows.map(r => r.problem_id)));
    const recentPlaceholders = recentIds.map(() => "?").join(", ");

    const [freshProblems] = await conn.query(
      `
      SELECT id FROM problems
      WHERE level = ? AND is_active = true
      ${recentIds.length ? `AND id NOT IN (${recentPlaceholders})` : ""}
      ORDER BY RAND()
      LIMIT ?
      `,
      recentIds.length
        ? [level, ...recentIds, questionCount]
        : [level, questionCount]
    );

    let problems = freshProblems;

    if (problems.length < questionCount) {
      const remaining = questionCount - problems.length;
      const excludeIds = Array.from(
        new Set([...recentIds, ...problems.map(p => p.id)])
      );
      const excludePlaceholders = excludeIds.map(() => "?").join(", ");
      const [fallback] = await conn.query(
        `
        SELECT id FROM problems
        WHERE level = ? AND is_active = true
        ${excludeIds.length ? `AND id NOT IN (${excludePlaceholders})` : ""}
        ORDER BY RAND()
        LIMIT ?
        `,
        excludeIds.length
          ? [level, ...excludeIds, remaining]
          : [level, remaining]
      );
      problems = problems.concat(fallback);
    }

    if (problems.length < questionCount) {
      throw new Error("Not enough problems configured");
    }

    // 3. Lock problems to session
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
      assessmentType,
      passThreshold,
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

  const schedule = session?.started_at
    ? await getScheduleForTime(session.started_at)
    : null;

  const [[levelRow]] = await pool.query(
    "SELECT level FROM test_sessions WHERE id = ?",
    [sessionId]
  );
  const level = levelRow?.level || "1A";
  const { assessmentType } = await getLevelConfig(level);

  const [questions] = await pool.query(
    `
    SELECT p.id, p.title, p.description, p.starter_code, p.ui_required_widgets, tsq.order_no
    FROM test_session_questions tsq
    JOIN problems p ON p.id = tsq.problem_id
    WHERE tsq.test_session_id = ?
    ORDER BY tsq.order_no
    `,
    [sessionId]
  );

  for (const q of questions) {
    const isTestCase = assessmentType === "TEST_CASE";
    q.uiRequiredWidgets = isTestCase ? [] : parseJsonArray(q.ui_required_widgets);
    delete q.ui_required_widgets;

    if (assessmentType === "TEST_CASE") {
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
    } else {
      const [[problemRow]] = await pool.query(
        "SELECT reference_image_url FROM problems WHERE id = ?",
        [q.id]
      );
      q.referenceImageUrl = problemRow?.reference_image_url || null;
    }
  }

  res.json({
    questions,
    assessmentType,
    session: {
      durationMinutes: session?.duration_minutes || null,
      startedAt: session?.started_at || null,
      scheduleEndAt: schedule?.end_at || null,
    },
    serverNow: new Date().toISOString(),
  });
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(v => String(v || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(v => String(v || "").trim()).filter(Boolean);
      }
    } catch {}

    return raw
      .split(/\r?\n|,/)
      .map(v => v.trim())
      .filter(Boolean);
  }

  return [];
}

export async function getTestMeta(req, res) {
  try {
    const sessionId = req.params.sessionId;
    const [[session]] = await pool.query(
      `
      SELECT duration_minutes, started_at, status, ignore_schedule_end, level
      FROM test_sessions
      WHERE id = ?
      `,
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const schedule = session?.started_at
      ? await getScheduleForTime(session.started_at)
      : null;

    const { assessmentType } = session?.level
      ? await getLevelConfig(session.level)
      : { assessmentType: null };

    const now = new Date();
    const scheduleEnd = schedule?.end_at ? new Date(schedule.end_at) : null;
    const durationEnd = session?.started_at && session?.duration_minutes
      ? new Date(new Date(session.started_at).getTime() + session.duration_minutes * 60 * 1000)
      : null;

    const shouldEndBySchedule = !session?.ignore_schedule_end && scheduleEnd && now >= scheduleEnd;
    const shouldEndByDuration = durationEnd && now >= durationEnd;

    if (session.status === "IN_PROGRESS" && (shouldEndBySchedule || shouldEndByDuration)) {
      let nextStatus = "FAIL";

      if (assessmentType === "UI_COMPARE") {
        const [[submissionRow]] = await pool.query(
          "SELECT COUNT(*) AS totalCount FROM test_session_submissions WHERE test_session_id = ?",
          [sessionId]
        );
        nextStatus = submissionRow?.totalCount ? "AWAITING_MANUAL" : "FAIL";
      }

      await pool.query(
        `
        UPDATE test_sessions
        SET status = ?, ended_at = NOW(), level_cleared = 0
        WHERE id = ?
        `,
        [nextStatus, sessionId]
      );
      session.status = nextStatus;
    }

    res.json({
      session: {
        durationMinutes: session?.duration_minutes || null,
        startedAt: session?.started_at || null,
        status: session?.status || null,
        scheduleEndAt: schedule?.end_at || null,
        ignoreScheduleEnd: Boolean(session?.ignore_schedule_end),
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
      "SELECT COUNT(*) AS totalCount FROM test_session_questions WHERE test_session_id = ?",
      [sessionId]
    );
    const totalCount = totalRow?.totalCount || 0;

    const { assessmentType } = await getLevelConfig(session.level);

    if (assessmentType === "UI_COMPARE") {
      const [[submissionRow]] = await pool.query(
        "SELECT COUNT(*) AS totalCount FROM test_session_submissions WHERE test_session_id = ?",
        [sessionId]
      );
      const hasSubmissions = (submissionRow?.totalCount || 0) > 0;
      const status = hasSubmissions ? "AWAITING_MANUAL" : "FAIL";

      await pool.query(
        `
        UPDATE test_sessions
        SET status = ?, ended_at = NOW(), feedback = ?, level_cleared = 0
        WHERE id = ?
        `,
        [status, null, sessionId]
      );

      return res.json({
        status,
        totalPassed: 0,
        totalCount,
        levelCleared: false,
        feedback: null,
        level: session.level,
        nextLevel: session.level,
      });
    }

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

    const passedCount = latestRows.filter(r => r.status === "PASS").length;
    const levelCleared = totalCount > 0 && passedCount === totalCount ? 1 : 0;
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
      await setCurrentLevel(userId, nextLevel);
    }

    res.json({
      status,
      totalPassed: passedCount,
      totalCount,
      levelCleared: Boolean(levelCleared),
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
