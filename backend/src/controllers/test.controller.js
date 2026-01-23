import pool from "../config/db.js";
import { getCurrentLevel, getLevelConfig, getNextLevel } from "../utils/level.js";

export async function startTest(req, res) {
  const userId = req.user.id;
  const level = await getCurrentLevel(userId);
  const { questionCount, durationMinutes } = getLevelConfig(level);

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Create test session
    const [sessionResult] = await conn.query(
      `
      INSERT INTO test_sessions (user_id, level, status, started_at, level_cleared)
      VALUES (?, ?, 'IN_PROGRESS', NOW(), 0)
      `,
      [userId, level]
    );

    const sessionId = sessionResult.insertId;

    // 2. Pick random problems
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

  res.json({ questions });
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

    res.json({
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
