import pool from "../config/db.js";
import { getActiveSchedule } from "../utils/schedule.js";
import { getLevelConfig } from "../utils/level.js";

/**
 * Fisher-Yates shuffle algorithm for true randomization
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get or create a session with randomly assigned problems for a user and level
 * Ensures the same problems are returned on subsequent calls
 */
export async function getOrCreateSession(req, res) {
  try {
    const userId = req.user?.id;
    const { level = '3A' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // 0. Check for active test slot
    const activeSchedule = await getActiveSchedule();
    if (!activeSchedule) {
      return res.status(403).json({
        success: false,
        message: 'Assessment is currently closed. Please check the schedule.'
      });
    }

    // Check for existing session
    const [existingSessions] = await pool.query(
      `SELECT id, assigned_problem_ids, started_at, expires_at, progress_data, current_problem_id 
       FROM user_session 
       WHERE user_id = ? AND level = ?`,
      [userId, level]
    );

    if (existingSessions.length > 0) {
      const session = existingSessions[0];
      let assignedIds = [];
      try {
        if (typeof session.assigned_problem_ids === 'string') {
            assignedIds = JSON.parse(session.assigned_problem_ids);
        } else if (Array.isArray(session.assigned_problem_ids)) {
            assignedIds = session.assigned_problem_ids;
        }
      } catch (e) {
        assignedIds = [];
      }
      
      if (!Array.isArray(assignedIds)) assignedIds = [];

      // Fetch problem details for the sidebar
      const [problems] = await pool.query(
        `SELECT id, title, problem_type, level FROM problems WHERE id IN (?) ORDER BY FIELD(id, ?)`,
        [assignedIds, assignedIds]
      );

      return res.json({
        success: true,
        sessionId: session.id,
        problemIds: assignedIds,
        problems: problems, // Return brief details
        progress: session.progress_data || {},
        currentProblemId: session.current_problem_id,
        startedAt: session.started_at,
        expiresAt: session.expires_at,
        isNewSession: false
      });
    }

    // No existing session - Delete any old session and create fresh one
    // This ensures users get different random questions on each new test
    await pool.query(
      `DELETE FROM user_session WHERE user_id = ? AND level = ?`,
      [userId, level]
    );

    // Fetch all active problems for this level
    const [availableProblems] = await pool.query(
      `SELECT id, title, problem_type, level FROM problems 
       WHERE level = ? AND is_active = 1`,
      [level]
    );

    if (availableProblems.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No active problems found for level ${level}`
      });
    }

    // Randomize order using Fisher-Yates shuffle
    const shuffled = shuffleArray(availableProblems);
    
    // Limit number of questions based on configuration
    const config = getLevelConfig(level); 
    const count = config.questionCount || 1;
    const selectedProblems = shuffled.slice(0, count);
    
    const problemIds = selectedProblems.map(p => p.id);
    const initialProgress = {};
    problemIds.forEach(id => initialProgress[id] = 'NOT_VISITED');

    // Calculate expiration (90 minutes from now)
    const expiresAt = new Date(Date.now() + 90 * 60 * 1000);

    // Create new session
    const [result] = await pool.query(
      `INSERT INTO user_session (user_id, level, assigned_problem_ids, progress_data, current_problem_id, started_at, expires_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [userId, level, JSON.stringify(problemIds), JSON.stringify(initialProgress), problemIds[0], expiresAt]
    );

    return res.json({
      success: true,
      sessionId: result.insertId,
      problemIds: problemIds,
      problems: shuffled, // Return details for sidebar
      progress: initialProgress,
      currentProblemId: problemIds[0],
      startedAt: new Date(),
      expiresAt: expiresAt,
      isNewSession: true
    });

  } catch (error) {
    console.error('Error in getOrCreateSession:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get or create session',
      error: error.message
    });
  }
}

/**
 * Get details for a specific problem in the session
 */
export async function getCurrentProblem(req, res) {
  try {
    const userId = req.user?.id;
    const { level = '3A', problemId } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get session
    const [sessions] = await pool.query(
      `SELECT id, assigned_problem_ids, current_problem_id FROM user_session WHERE user_id = ? AND level = ?`,
      [userId, level]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'No active session found' });
    }

    const session = sessions[0];
    let assignedIds = [];
    
    // Handle both string and pre-parsed array from MySQL driver
    if (typeof session.assigned_problem_ids === 'string') {
        try {
            assignedIds = JSON.parse(session.assigned_problem_ids);
        } catch(e) { 
            assignedIds = [];
        }
    } else if (Array.isArray(session.assigned_problem_ids)) {
        assignedIds = session.assigned_problem_ids;
    }
    
    // Ensure it's an array
    if (!Array.isArray(assignedIds)) {
        assignedIds = [];
    }

    // Determine target problem ID
    let targetId = problemId;
    
    // If no specific ID requested, use current_problem_id from DB, or first assigned
    if (!targetId) {
        targetId = session.current_problem_id || assignedIds[0];
    }
    
    // Validate targetId is in assignedIds
    // Note: targetId from query is string, assignedIds depends on DB (ints)
    if (assignedIds.length > 0 && !assignedIds.includes(parseInt(targetId)) && !assignedIds.includes(targetId)) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied: Problem not assigned to this session' 
        });
    }

    // Fetch problem details
    const [problems] = await pool.query(
      `SELECT id, title, description, starter_code, sample_image, problem_type, level 
       FROM problems WHERE id = ?`,
      [targetId]
    );

    if (problems.length === 0) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const problem = problems[0];
    
    // Convert BLOB sample image to base64 if present
    let sampleImageBase64 = null;
    if (problem.sample_image) {
      const base64Image = Buffer.from(problem.sample_image).toString('base64');
      sampleImageBase64 = `data:image/png;base64,${base64Image}`;
    }

    return res.json({
      success: true,
      id: problem.id,
      title: problem.title,
      description: problem.description,
      starterCode: problem.starter_code,
      problemType: problem.problem_type,
      level: problem.level,
      sampleImage: sampleImageBase64,
      sampleTests: [],
      hiddenTestCount: 0,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Error in getCurrentProblem:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Update progress for a specific problem
 */
export async function updateProgress(req, res) {
    try {
        const userId = req.user?.id;
        const { problemId, status, level = '3A' } = req.body;

        if (!userId || !problemId || !status) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const [sessions] = await pool.query(
            `SELECT id, progress_data, assigned_problem_ids FROM user_session WHERE user_id = ? AND level = ?`,
            [userId, level]
        );

        if (sessions.length === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const session = sessions[0];
        let progress = session.progress_data || {};
        
        // Update status
        progress[problemId] = status;
        
        // Update DB: set progress_data AND current_problem_id
        await pool.query(
            `UPDATE user_session SET progress_data = ?, current_problem_id = ? WHERE id = ?`,
            [JSON.stringify(progress), problemId, session.id]
        );

        return res.json({ success: true, message: 'Progress updated', progress });

    } catch (error) {
        console.error('Error updating progress:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Clear a user's session for a specific level (admin/teacher utility)
 */
export async function clearSession(req, res) {
  try {
    const { userId, level } = req.body;

    if (!userId || !level) {
      return res.status(400).json({
        success: false,
        message: 'userId and level are required'
      });
    }

    const [result] = await pool.query(
      `DELETE FROM user_session WHERE user_id = ? AND level = ?`,
      [userId, level]
    );

    return res.json({
      success: true,
      message: `Session cleared for user ${userId}, level ${level}`,
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error('Error in clearSession:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear session',
      error: error.message
    });
  }
}

/**
 * End test for authenticated user - deletes their session
 */
export async function endTest(req, res) {
  try {
    const userId = req.user?.id;
    const { level = '3A' } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Delete the user's session for this level
    const [result] = await pool.query(
      `DELETE FROM user_session WHERE user_id = ? AND level = ?`,
      [userId, level]
    );

    return res.json({
      success: true,
      message: 'Test ended successfully',
      deletedSessions: result.affectedRows
    });

  } catch (error) {
    console.error('Error in endTest:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to end test',
      error: error.message
    });
  }
}
