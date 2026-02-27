import express from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { evaluateCodeProblem, validateCodeTestCases } from "../services/codeEvaluator.js";
import { evaluateUIProblem } from "../services/uiEvaluator.js";

const router = express.Router();

// All submission endpoints require authentication
router.use(authenticate);

/**
 * Submit CODE-type problem solution (Levels 1A-2C)
 * Executes student's JavaScript function against test cases
 */
router.post("/problems/:id/submit-code", async (req, res) => {
  try {
    const { id: problemId } = req.params;
    const { code } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    // Fetch problem details
    const [[problem]] = await pool.query(
      "SELECT id, problem_type, language, level FROM problems WHERE id = ? AND language = 'REACT_NATIVE'",
      [problemId]
    );

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    if (problem.problem_type !== "CODE") {
      return res.status(400).json({ error: "This endpoint is for CODE-type problems only" });
    }

    // Get active session ID for this level
    const [sessions] = await pool.query(
      'SELECT id FROM user_session WHERE user_id = ? AND level = ?',
      [userId, problem.level || '1A']
    );
    
    let sessionId = null;
    if (sessions.length > 0) {
      sessionId = sessions[0].id;
    }

    // Fetch test cases
    const [testCases] = await pool.query(
      `SELECT id, input_data, expected_output, is_hidden, test_order 
       FROM test_cases 
       WHERE problem_id = ? 
       ORDER BY test_order ASC`,
      [problemId]
    );

    if (testCases.length === 0) {
      return res.status(400).json({ error: "No test cases found for this problem" });
    }

    // Validate test case format
    const validation = validateCodeTestCases(testCases);
    if (!validation.valid) {
      return res.status(500).json({ 
        error: "Invalid test case configuration",
        details: validation.errors 
      });
    }

    // Evaluate code
    const evaluationResults = await evaluateCodeProblem(code, testCases);

    // Save submission with session ID if available
    let submissionId;
    if (sessionId) {
      // Check for existing submission in this session
      const [existing] = await pool.query(
        'SELECT id FROM submissions WHERE session_id = ? AND problem_id = ?',
        [sessionId, problemId]
      );

      if (existing.length > 0) {
        // UPDATE existing submission
        submissionId = existing[0].id;
        await pool.query(
          `UPDATE submissions 
           SET code = ?, status = ?, score = ?, execution_time = ?, test_results = ?, submitted_at = NOW() 
           WHERE id = ?`,
          [
            code,
            evaluationResults.status,
            (evaluationResults.passed / evaluationResults.total) * 100,
            evaluationResults.executionTime,
            JSON.stringify(evaluationResults.testResults),
            submissionId
          ]
        );
      } else {
        // INSERT new submission linked to session
        const [result] = await pool.query(
          `INSERT INTO submissions (
            user_id, problem_id, session_id, code, status, score, execution_time, test_results, submitted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            problemId,
            sessionId,
            code,
            evaluationResults.status,
            (evaluationResults.passed / evaluationResults.total) * 100,
            evaluationResults.executionTime,
            JSON.stringify(evaluationResults.testResults)
          ]
        );
        submissionId = result.insertId;
      }
    } else {
      // Fallback: Insert without session
      const [submissionResult] = await pool.query(
        `INSERT INTO submissions (
          user_id, problem_id, code, status, score, execution_time, test_results, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          problemId,
          code,
          evaluationResults.status,
          (evaluationResults.passed / evaluationResults.total) * 100,
          evaluationResults.executionTime,
          JSON.stringify(evaluationResults.testResults)
        ]
      );
      submissionId = submissionResult.insertId;
    }

    // Return results (hide hidden test details)
    const publicResults = {
      submissionId: sessionId || submissionId, // Use sessionId if available, else DB ID
      actualSubmissionId: submissionId, // Internal DB ID for debugging
      status: evaluationResults.status,
      passed: evaluationResults.passed,
      failed: evaluationResults.failed,
      total: evaluationResults.total,
      score: (evaluationResults.passed / evaluationResults.total) * 100,
      executionTime: evaluationResults.executionTime,
      error: evaluationResults.error,
      testResults: evaluationResults.testResults.map(tr => ({
        testNumber: tr.testNumber,
        passed: tr.passed,
        isPublic: tr.isPublic,
        // Only show details for public tests
        ...(tr.isPublic && {
          input: tr.input,
          expectedOutput: tr.expectedOutput,
          actualOutput: tr.actualOutput,
          error: tr.error
        })
      }))
    };

    res.json(publicResults);
  } catch (err) {
    console.error("Submit code error:", err);
    res.status(500).json({ error: "Failed to evaluate code", details: err.message });
  }
});

/**
 * Submit UI-type problem solution (Levels 3A-5C)
 * For UI problems, we just save the submission for manual/automated review
 */
router.post("/problems/:id/submit-ui", async (req, res) => {
  try {
    const { id: problemId } = req.params;
    let { code, files } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!code && !files) {
      return res.status(400).json({ error: "Code or files required" });
    }

    // Normalizing: If files object is provided, stringify it to store in 'code' column
    if (files && typeof files === 'object') {
        code = JSON.stringify(files);
    } else if (typeof code === 'object') {
        // In case frontend sends object in 'code' field
        code = JSON.stringify(code);
    }

    // Fetch problem details
    const [[problem]] = await pool.query(
      "SELECT id, problem_type, language, level, ui_required_widgets FROM problems WHERE id = ? AND language = 'REACT_NATIVE'",
      [problemId]
    );

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    if (problem.problem_type !== "UI") {
      return res.status(400).json({ error: "This endpoint is for UI-type problems only" });
    }

    // 1. Get active session ID for this level
    console.log(`[DEBUG] Submit-UI: User=${userId}, Level=${problem.level}`);
    
    const [sessions] = await pool.query(
        'SELECT id FROM user_session WHERE user_id = ? AND level = ?',
        [userId, problem.level || '3A']
    );
    console.log(`[DEBUG] Found user_session: ${JSON.stringify(sessions)}`);

    let sessionId = null;
    if (sessions.length > 0) {
        sessionId = sessions[0].id;
    }

    // 3. Automated UI Scoring
    let uiRequiredWidgets = [];
    try {
        if (typeof problem.ui_required_widgets === 'string') {
            uiRequiredWidgets = JSON.parse(problem.ui_required_widgets);
        } else if (Array.isArray(problem.ui_required_widgets)) {
             uiRequiredWidgets = problem.ui_required_widgets;
        }
    } catch (e) {
        console.warn("Failed to parse ui_required_widgets", e);
    }

    const verificationResult = evaluateUIProblem(code, uiRequiredWidgets);
    const autoScore = verificationResult.score;
    const testResultsJSON = JSON.stringify(verificationResult.details);
    
    // Determine status based on automated score
    // CHANGED: Default to 'PENDING' for manual review, regardless of auto score
    const status = 'PENDING';
    let submissionId;

    if (sessionId) {
        // 2. Check for existing submission in this session
        const [existing] = await pool.query(
            'SELECT id FROM submissions WHERE session_id = ? AND problem_id = ?',
            [sessionId, problemId]
        );
        console.log(`[DEBUG] Existing submission for Session ${sessionId}, Problem ${problemId}: ${JSON.stringify(existing)}`);

        if (existing.length > 0) {
            // UPDATE existing submission
            console.log(`[DEBUG] Updating existing submission ${existing[0].id}`);
            submissionId = existing[0].id;
// ... (rest of update)
            await pool.query(
                `UPDATE submissions 
                 SET code = ?, status = ?, score = ?, test_results = ?, submitted_at = NOW() 
                 WHERE id = ?`,
                [code, status, autoScore, testResultsJSON, submissionId]
            );
        } else {
            // INSERT new submission for this session
            console.log(`[DEBUG] Inserting NEW submission for Session ${sessionId}`);
             const [result] = await pool.query(
                `INSERT INTO submissions (session_id, user_id, problem_id, code, status, score, test_results, submitted_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [sessionId, userId, problemId, code, status, autoScore, testResultsJSON]
            );
            submissionId = result.insertId;
        }

        // SYNC: Also write to test_session_submissions for progress tracking
        // Check if exists
        const [sessionSubExists] = await pool.query(
            'SELECT id FROM test_session_submissions WHERE test_session_id = ? AND problem_id = ?',
            [sessionId, problemId]
        );

        if (sessionSubExists.length > 0) {
             await pool.query(
                `UPDATE test_session_submissions 
                 SET code = ?, status = ?, created_at = NOW() 
                 WHERE id = ?`,
                [code, status, sessionSubExists[0].id]
             );
        } else {
             await pool.query(
                `INSERT INTO test_session_submissions (test_session_id, user_id, problem_id, code, status, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [sessionId, userId, problemId, code, status]
             );
        }

    } else {
        // Fallback: Just insert without session
        const [result] = await pool.query(
            `INSERT INTO submissions (
              user_id, problem_id, code, status, score, test_results, submitted_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [userId, problemId, code, status, autoScore, testResultsJSON]
        );
        submissionId = result.insertId;
    }

    // Return sessionId as the "Submission ID" as requested by user
    // "submition id should be secission id"
    res.json({
      submissionId: sessionId || submissionId, // Use sessionId if available, else DB ID
      actualSubmissionId: submissionId, // Internal ID for debugging
      status: status,
      message: 'UI problem submitted for manual review.',
      problemId: problemId,
      debugInfo: {
          userId: userId,
          levelLookup: problem.level || '3A',
          sessionsFound: sessions
      }
    });
  } catch (err) {
    console.error("Submit UI error:", err);
    res.status(500).json({ error: "Failed to submit code", details: err.message });
  }
});

/**
 * Run CODE-type problem tests (without saving submission)
 * For testing purposes before final submission
 */
router.post("/problems/:id/run-tests", async (req, res) => {
  try {
    const { id: problemId } = req.params;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    // Fetch problem and test cases
    const [[problem]] = await pool.query(
      "SELECT problem_type FROM problems WHERE id = ? AND language = 'REACT_NATIVE'",
      [problemId]
    );

    if (!problem || problem.problem_type !== "CODE") {
      return res.status(400).json({ error: "Invalid problem for test execution" });
    }

    // Fetch only sample (public) test cases
    const [testCases] = await pool.query(
      `SELECT id, input_data, expected_output, is_hidden, test_order 
       FROM test_cases 
       WHERE problem_id = ? AND is_hidden = 0
       ORDER BY test_order ASC`,
      [problemId]
    );

    if (testCases.length === 0) {
      return res.status(400).json({ error: "No sample test cases found" });
    }

    // Evaluate only sample tests
    const evaluationResults = await evaluateCodeProblem(code, testCases);

    // Return results
    res.json({
      passed: evaluationResults.passed,
      failed: evaluationResults.failed,
      total: evaluationResults.total,
      executionTime: evaluationResults.executionTime,
      error: evaluationResults.error,
      testResults: evaluationResults.testResults.map(tr => ({
        testNumber: tr.testNumber,
        input: tr.input,
        expectedOutput: tr.expectedOutput,
        actualOutput: tr.actualOutput,
        passed: tr.passed,
        error: tr.error,
        executionTime: tr.executionTime
      }))
    });
  } catch (err) {
    console.error("Run tests error:", err);
    res.status(500).json({ error: "Failed to run tests", details: err.message });
  }
});

export default router;
