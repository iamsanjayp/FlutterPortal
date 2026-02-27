import pool from "../config/db.js";
import { getLevelConfig, getNextLevel } from "../utils/level.js";
import { getLatestSchedules } from "../utils/schedule.js";
import { evaluateCodeProblem } from "../services/codeEvaluator.js";

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

// ... existing imports

// Helper to get assigned schedule IDs for a staff member
async function getAssignedScheduleIds(userId) {
  const [rows] = await pool.query(
    "SELECT schedule_id FROM test_schedule_assignments WHERE user_id = ?",
    [userId]
  );
  return rows.map(r => r.schedule_id);
}

export async function getSessions(req, res) {
  try {
    // ... (existing update logic for timeout/fail) ...
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

    // STAFF RESTRICTION LOGIN
    if (req.user.role_id === 2) {
       const assignedIds = await getAssignedScheduleIds(req.user.id);
       if (assignedIds.length === 0) {
           return res.json({ sessions: [] }); // Staff with no assignments sees nothing
       }
       // Filter sessions that started within the assigned schedules
       // This requires joining with test_schedules to check time ranges
       // OR simpler: check if the session start time matches any active schedule assigned
       // Let's do a JOIN with test_schedules in the main query
       // But wait, the main query joins users. We need to join test_schedules conceptually.
       // A session belongs to a schedule if started_at BETWEEN start_at AND end_at.
       
       // Query:
       // JOIN test_schedules sch ON ts.started_at BETWEEN sch.start_at AND sch.end_at
       // WHERE sch.id IN (?)
       
       // Note: This assumes strict schedule adherence. 
       // If a student started outside a schedule (e.g. dev testing), Staff might not see it.
       // This is acceptable for "Live Tests" in a controlled environment.
    }

    let query = `
      SELECT DISTINCT ts.id, ts.user_id, ts.level, ts.status, ts.started_at, ts.duration_minutes,
             u.full_name, u.email, u.roll_no
      FROM test_sessions ts
      JOIN users u ON u.id = ts.user_id
    `;
    
    // Join schedule if staff
    if (req.user.role_id === 2) {
        query += `
        JOIN test_schedules sch ON ts.started_at BETWEEN sch.start_at AND sch.end_at
        `;
        const assignedIds = await getAssignedScheduleIds(req.user.id);
        if (assignedIds.length > 0) {
             conditions.push(`sch.id IN (${assignedIds.join(',')})`);
        } else {
             return res.json({ sessions: [] });
        }
    }


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

    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY ts.started_at DESC LIMIT 50`;

    const [rows] = await pool.query(query, params);

    res.json({ sessions: rows });
  } catch (err) {
    console.error("Session list error:", err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
}

// ... existing helper functions ...

export async function getSubmissions(req, res) {
  try {
    const { sessionId, studentId, scheduleId } = req.query;

    const conditions = [];
    const params = [];
    
    // STAFF FILTER
    if (req.user.role_id === 2) {
       const assignedIds = await getAssignedScheduleIds(req.user.id);
       if (assignedIds.length === 0) return res.json({ submissions: [] });
       conditions.push(`sch.id IN (${assignedIds.join(',')})`);
    }

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

// ... existing updateSubmissionStatus ...

// STAFF ASSIGNMENT FUNCTIONS

export async function assignStaffToSchedule(req, res) {
  try {
    const { id } = req.params; // scheduleId
    const { userIds, taskType = 'SLOT_SUPERVISOR' } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "No users provided" });
    }
    if (!['GRADER', 'SLOT_SUPERVISOR'].includes(taskType)) {
      return res.status(400).json({ error: "Invalid task type" });
    }

    const values = userIds.map(uid => [id, uid, taskType]);
    
    await pool.query(
      `INSERT IGNORE INTO test_schedule_assignments (schedule_id, user_id, task_type) VALUES ?`,
      [values]
    );

    res.json({ message: "Staff assigned successfully" });
  } catch (err) {
    console.error("Assign staff error:", err);
    res.status(500).json({ error: "Failed to assign staff" });
  }
}

export async function getScheduleAssignments(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `
      SELECT u.id, u.full_name, u.email, u.staff_id, tsa.task_type, tsa.assigned_at
      FROM test_schedule_assignments tsa
      JOIN users u ON u.id = tsa.user_id
      WHERE tsa.schedule_id = ?
      ORDER BY tsa.task_type, u.full_name
      `,
      [id]
    );
    res.json({ assignments: rows });
  } catch (err) {
    console.error("Get assignments error:", err);
    res.status(500).json({ error: "Failed to get assignments" });
  }
}

export async function removeStaffAssignment(req, res) {
  try {
    const { id, userId } = req.params;
    const { taskType } = req.query;
    let sql = "DELETE FROM test_schedule_assignments WHERE schedule_id = ? AND user_id = ?";
    const params = [id, userId];
    if (taskType) {
      sql += " AND task_type = ?";
      params.push(taskType);
    }
    await pool.query(sql, params);
    res.json({ message: "Assignment removed" });
  } catch (err) {
    console.error("Remove assignment error:", err);
    res.status(500).json({ error: "Failed to remove assignment" });
  }
}

// ─── Staff List (all users with role=TEACHER) ───
export async function getStaffList(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.staff_id, u.age, u.department, u.experience_years, u.is_active,
             sp.can_manage_questions,
             (SELECT COUNT(*) FROM test_schedule_assignments tsa WHERE tsa.user_id = u.id) AS assignment_count
      FROM users u
      LEFT JOIN staff_permissions sp ON sp.user_id = u.id
      WHERE u.role_id = 2
      ORDER BY u.full_name
    `);
    res.json({ staff: rows });
  } catch (err) {
    console.error("Get staff list error:", err);
    res.status(500).json({ error: "Failed to get staff list" });
  }
}

// ─── Create Staff User ───
export async function createStaffUser(req, res) {
  try {
    const { fullName, email, password, age, department, experienceYears, staffId } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields: Name, Email, Password" });
    }

    // Check availability
    const [[existing]] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR staff_id = ?",
      [email, staffId || 'NON_EXISTENT_STAFF_ID']
    );

    if (existing) {
      return res.status(409).json({ error: "User with this email or staff ID already exists" });
    }

    // Hash password
    const bcrypt = (await import("bcrypt")).default;
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `
      INSERT INTO users (full_name, email, password_hash, auth_provider, role_id, is_active, age, department, experience_years, staff_id)
      VALUES (?, ?, ?, 'LOCAL', 2, 1, ?, ?, ?, ?)
      `,
      [fullName, email, passwordHash, age || null, department || null, experienceYears || null, staffId || null]
    );

    const newUserId = result.insertId;

    // Automatic Question Manager Assignment if Experience > 2
    if (experienceYears && parseInt(experienceYears) > 2) {
      await pool.query(
        "INSERT INTO staff_permissions (user_id, can_manage_questions) VALUES (?, 1)",
        [newUserId]
      );
    }

    res.status(201).json({ message: "Staff user created successfully", userId: newUserId });
  } catch (err) {
    console.error("Create staff user error:", err);
    res.status(500).json({ error: "Failed to create staff user" });
  }
}

// ─── Staff Permissions (global) ───
export async function setStaffPermissions(req, res) {
  try {
    const { userId } = req.params;
    const { canManageQuestions } = req.body;
    await pool.query(`
      INSERT INTO staff_permissions (user_id, can_manage_questions) VALUES (?, ?)
      ON DUPLICATE KEY UPDATE can_manage_questions = VALUES(can_manage_questions)
    `, [userId, canManageQuestions ? 1 : 0]);
    res.json({ message: "Permissions updated" });
  } catch (err) {
    console.error("Set permissions error:", err);
    res.status(500).json({ error: "Failed to set permissions" });
  }
}

// ─── Staff's own assignments ───
export async function getMyAssignments(req, res) {
  try {
    const userId = req.user.id;
    const [assignments] = await pool.query(`
      SELECT tsa.schedule_id, tsa.task_type, tsa.assigned_at,
             ts.name AS schedule_name, ts.start_at, ts.end_at, ts.is_active AS schedule_active
      FROM test_schedule_assignments tsa
      JOIN test_schedules ts ON ts.id = tsa.schedule_id
      WHERE tsa.user_id = ?
      ORDER BY ts.start_at DESC
    `, [userId]);
    const [perms] = await pool.query(`
      SELECT can_manage_questions FROM staff_permissions WHERE user_id = ?
    `, [userId]);
    res.json({
      assignments,
      permissions: perms[0] || { can_manage_questions: 0 }
    });
  } catch (err) {
    console.error("My assignments error:", err);
    res.status(500).json({ error: "Failed to get assignments" });
  }
}

// ─── Slot students (for SLOT_SUPERVISOR) ───
export async function getSlotStudents(req, res) {
  try {
    const { id } = req.params; // scheduleId
    const userId = req.user.id;

    // Verify user is assigned as SLOT_SUPERVISOR
    const [check] = await pool.query(
      `SELECT id FROM test_schedule_assignments WHERE schedule_id = ? AND user_id = ? AND task_type = 'SLOT_SUPERVISOR'`,
      [id, userId]
    );
    if (check.length === 0) {
      return res.status(403).json({ error: "Not authorized for this slot" });
    }

    const [students] = await pool.query(`
      SELECT ts.id AS session_id, ts.user_id, ts.level, ts.status, ts.started_at, ts.ended_at, ts.duration_minutes,
             u.full_name, u.email, u.roll_no, u.enrollment_no,
             (SELECT COUNT(*) FROM submissions s WHERE s.user_id = ts.user_id AND s.submitted_at >= sch.start_at AND s.submitted_at <= sch.end_at) AS submission_count
      FROM test_sessions ts
      JOIN users u ON u.id = ts.user_id
      JOIN test_schedules sch ON sch.id = ?
      WHERE ts.started_at >= sch.start_at AND ts.started_at <= sch.end_at
      ORDER BY ts.started_at DESC
    `, [id]);

    res.json({ students });
  } catch (err) {
    console.error("Slot students error:", err);
    res.status(500).json({ error: "Failed to get students" });
  }
}

// ─── Revoke student from slot (for SLOT_SUPERVISOR) ───
export async function revokeSlotStudent(req, res) {
  try {
    const { id, sessionId } = req.params;
    const userId = req.user.id;

    // Verify supervisor
    const [check] = await pool.query(
      `SELECT id FROM test_schedule_assignments WHERE schedule_id = ? AND user_id = ? AND task_type = 'SLOT_SUPERVISOR'`,
      [id, userId]
    );
    if (check.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await pool.query(
      `UPDATE test_sessions SET status = 'FAIL', ended_at = NOW() WHERE id = ? AND status = 'IN_PROGRESS'`,
      [sessionId]
    );
    // Clear active session
    await pool.query(
      `UPDATE users SET active_session_id = NULL WHERE id = (SELECT user_id FROM test_sessions WHERE id = ?)`,
      [sessionId]
    );

    res.json({ message: "Student revoked" });
  } catch (err) {
    console.error("Revoke student error:", err);
    res.status(500).json({ error: "Failed to revoke student" });
  }
}

// ─── Extend student time (for SLOT_SUPERVISOR) ───
export async function extendStudentTime(req, res) {
  try {
    const { id, sessionId } = req.params;
    const { extraMinutes = 15 } = req.body;
    const userId = req.user.id;

    const [check] = await pool.query(
      `SELECT id FROM test_schedule_assignments WHERE schedule_id = ? AND user_id = ? AND task_type = 'SLOT_SUPERVISOR'`,
      [id, userId]
    );
    if (check.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await pool.query(
      `UPDATE test_sessions SET duration_minutes = COALESCE(duration_minutes, 60) + ? WHERE id = ?`,
      [extraMinutes, sessionId]
    );

    res.json({ message: `Extended by ${extraMinutes} minutes` });
  } catch (err) {
    console.error("Extend time error:", err);
    res.status(500).json({ error: "Failed to extend time" });
  }
}

// Need to update RNSubmissions as well if used
// Need to update RNSubmissions as well if used
export async function getRNSubmissions(req, res) {
  try {
    const { date, status, problemId } = req.query;
    const conditions = [];
    const params = [];

    // STAFF FILTER
    let staffJoin = "";
    if (req.user.role_id === 2) {
       const assignedIds = await getAssignedScheduleIds(req.user.id);
       if (assignedIds.length === 0) return res.json({ submissions: [] });
       
       staffJoin = "JOIN test_schedules sch ON s.submitted_at BETWEEN sch.start_at AND sch.end_at";
       conditions.push(`sch.id IN (${assignedIds.join(',')})`);
    }

    if (date) {
      conditions.push("DATE(s.submitted_at) = ?");
      params.push(date);
    }
    if (status) {
      conditions.push("s.status = ?");
      params.push(status);
    }
    if (problemId) {
      conditions.push("s.problem_id = ?");
      params.push(problemId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")} AND p.language = 'REACT_NATIVE'` : "WHERE p.language = 'REACT_NATIVE'";

    const [rows] = await pool.query(
      `
      SELECT DISTINCT s.id, s.user_id, s.problem_id, s.status, s.score, s.submitted_at, s.code, s.test_results, s.manual_score, s.manual_feedback, s.final_score,
             u.full_name AS student_name, u.email AS student_email,
             p.title AS problem_title, p.level, p.description AS problem_description, p.problem_type, p.starter_code, p.sample_image
      FROM submissions s
      JOIN users u ON u.id = s.user_id
      JOIN problems p ON p.id = s.problem_id
      ${staffJoin}
      ${whereClause}
      ORDER BY s.submitted_at DESC
      LIMIT 100
      `,
      params
    );

    // Convert sample_image BLOB to base64 for frontend
    const submissions = rows.map(row => ({
      ...row,
      sample_image_base64: row.sample_image ? row.sample_image.toString('base64') : null,
      sample_image: undefined // Don't send raw BLOB
    }));
    
    res.json({ submissions });
  } catch (err) {
    console.error("RN submission list error:", err);
    res.status(500).json({ error: "Failed to load RN submissions" });
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


async function recomputeSessionStatus(sessionId, userId, level) {
  const [[session]] = await pool.query(
    "SELECT id, user_id, level FROM test_sessions WHERE id = ?",
    [sessionId]
  );

  if (!session) {
    // FALLBACK: If standard session not found, check submissions directly for promotion
    if (userId && level) {
      try {
        const { questionCount } = getLevelConfig(level);
        
        // Count passed unique problems for this user at this level
        const [[passedRow]] = await pool.query(`
            SELECT COUNT(DISTINCT problem_id) as passedCount 
            FROM submissions s
            JOIN problems p ON p.id = s.problem_id
            WHERE s.user_id = ? AND p.level = ? AND s.status = 'PASS'
        `, [userId, level]);
        
        const passedCount = passedRow?.passedCount || 0;
        
        // Promote if enough passed
        if (passedCount >= questionCount) {
            const nextLevel = getNextLevel(level);
            // Only update if not already at higher level? 
            // Simplified: Just update to next level.
            await pool.query(
              "UPDATE users SET current_level = ? WHERE id = ?",
              [nextLevel, userId]
            );
            console.log(`[Recompute Fallback] User ${userId} promoted to ${nextLevel}`);
        }
      } catch (err) {
          console.error("[Recompute Fallback] Error:", err);
      }
    }
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

export async function createStudent(req, res) {
  try {
    const { fullName, email, password, enrollmentNo, rollNo, level } = req.body;

    if (!fullName || !email || !password || !enrollmentNo || !rollNo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check availability
    const [[existing]] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR enrollment_no = ? OR roll_no = ?",
      [email, enrollmentNo, rollNo]
    );

    if (existing) {
      return res.status(409).json({ error: "User with this email, enrollment, or roll number already exists" });
    }

    // Hash password
    // Import bcrypt dynamically if not at top level, or ensure it is imported
    const bcrypt = (await import("bcrypt")).default;
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `
      INSERT INTO users (full_name, email, password_hash, enrollment_no, roll_no, current_level, role_id, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, 1, NOW())
      `,
      [fullName, email, passwordHash, enrollmentNo, rollNo, level || '1A']
    );

    res.status(201).json({ 
      id: result.insertId, 
      message: "Student created successfully" 
    });

  } catch (err) {
    console.error("Create student error:", err);
    res.status(500).json({ error: "Failed to create student" });
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
    const { language } = req.query;
    let query = `
      SELECT id, level, title, description, starter_code, is_active, language, problem_type, sample_image, ui_required_widgets
      FROM problems
    `;
    const params = [];
    
    if (language) {
      query += ` WHERE language = ?`;
      params.push(language);
    }
    
    query += ` ORDER BY level, id`;
    
    const [rows] = await pool.query(query, params);

    const serialized = rows.map(row => ({
      ...row,
      sample_image_base64: row.sample_image ? row.sample_image.toString("base64") : null,
    }));

    res.json({ problems: serialized });
  } catch (err) {
    console.error("Problem list error:", err);
    res.status(500).json({ error: "Failed to load problems" });
  }
}

export async function createProblem(req, res) {
  try {
    const { level, title, description, starterCode, isActive, language, problemType, sampleImageBase64, uiRequiredWidgets } = req.body;
    if (!level || !title || !language) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sampleImageBuffer = sampleImageBase64 ? Buffer.from(sampleImageBase64, "base64") : null;

    const [result] = await pool.query(
      `
      INSERT INTO problems (level, title, description, starter_code, is_active, language, problem_type, sample_image, created_by, ui_required_widgets)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        level,
        title,
        description || "",
        starterCode || "",
        isActive ? 1 : 0,
        language,
        problemType || "UI",
        sampleImageBuffer,
        req.user?.id || null,
        uiRequiredWidgets ? JSON.stringify(uiRequiredWidgets) : null
      ]
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
    const { level, title, description, starterCode, isActive, language, problemType, sampleImageBase64, uiRequiredWidgets } = req.body;

    const sampleImageBuffer = sampleImageBase64 === undefined
      ? undefined
      : sampleImageBase64
        ? Buffer.from(sampleImageBase64, "base64")
        : null;

    let query = `
      UPDATE problems
      SET
        level = COALESCE(?, level),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        starter_code = COALESCE(?, starter_code),
        is_active = COALESCE(?, is_active),
        language = COALESCE(?, language),
        problem_type = COALESCE(?, problem_type),
        ui_required_widgets = COALESCE(?, ui_required_widgets)
    `;

    const params = [
      level ?? null,
      title ?? null,
      description ?? null,
      starterCode ?? null,
      typeof isActive === "boolean" ? (isActive ? 1 : 0) : null,
      language ?? null,
      problemType ?? null,
      uiRequiredWidgets ? JSON.stringify(uiRequiredWidgets) : null,
    ];

    if (sampleImageBase64 !== undefined) {
      query += `, sample_image = ?`;
      params.push(sampleImageBuffer);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    const [result] = await pool.query(query, params);

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
      SELECT id, input_data, expected_output, is_hidden, test_order
      FROM test_cases
      WHERE problem_id = ?
      ORDER BY test_order
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
      INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden, test_order)
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
        input_data = COALESCE(?, input_data),
        expected_output = COALESCE(?, expected_output),
        is_hidden = COALESCE(?, is_hidden),
        test_order = COALESCE(?, test_order)
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

// React Native Submissions



export async function runRNSubmission(req, res) {
  try {
    const { id } = req.params;
    
    // Fetch code
    const [[submission]] = await pool.query(
      "SELECT code FROM submissions WHERE id = ?",
      [id]
    );

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Execute in Docker (PREVIEW mode)
    const { executeReactNativeDocker } = await import("../execution/react-native/runReactNativeDocker.js");
    
    let codeOrFiles = submission.code;
    try {
        const parsed = JSON.parse(submission.code);
        if (typeof parsed === 'object' && parsed !== null) {
            codeOrFiles = parsed;
        }
    } catch (e) {
        // Not JSON, assume legacy single file string
    }

    // Run the simulation
    const result = await executeReactNativeDocker(codeOrFiles, { mode: 'PREVIEW' });
    
    // Return HTML result
    res.json({ 
        success: result.success,
        message: result.message,
        output: result.output,
        html: result.html // Pass the HTML bundle to frontend
    });

  } catch (err) {
    console.error("Run RN submission error:", err);
    res.status(500).json({ error: "Failed to run submission" });
  }
}

export async function updateRNSubmissionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // PASS, FAIL
    
    if (!['PASS', 'FAIL'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    await pool.query(
      "UPDATE submissions SET status = ? WHERE id = ?",
      [status, id]
    );

    res.json({ message: "Status updated" });
  } catch (err) {
    console.error("Update RN status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
}

export async function gradeSubmission(req, res) {
  try {
    const { id } = req.params;
    const { manualScore, feedback } = req.body;
    const graderId = req.user.id;

    if (manualScore === undefined || manualScore < 0 || manualScore > 100) {
      return res.status(400).json({ error: "Invalid manual score (0-100)" });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Get submission and problem details
      const [[submission]] = await conn.query(
        `
        SELECT s.id, s.score AS auto_score, s.user_id, p.level,
               (SELECT test_session_id FROM test_session_submissions tss WHERE tss.problem_id = s.problem_id AND tss.test_session_id IN (SELECT id FROM test_sessions WHERE user_id = s.user_id) ORDER BY id DESC LIMIT 1) as session_id
        FROM submissions s
        JOIN problems p ON p.id = s.problem_id
        WHERE s.id = ?
        FOR UPDATE
        `,
        [id]
      );

      if (!submission) {
        await conn.rollback();
        return res.status(404).json({ error: "Submission not found" });
      }

      // 2. Calculate Final Score
      // Final = (Auto * 0.5) + (Manual * 0.5)
      // auto_score might be null if not yet graded, assume 0 for safety but meaningful auto score should be present
      const autoScore = parseFloat(submission.auto_score || 0);
      const finalScore = Math.round((autoScore * 0.5) + (manualScore * 0.5));

      // 3. Determine Pass/Fail based on Level Threshold
      const { passThreshold = 70 } = getLevelConfig(submission.level); // Default 70 if not found
      const status = finalScore >= passThreshold ? "PASS" : "FAIL";

      // 4. Update Submission
      await conn.query(
        `
        UPDATE submissions
        SET manual_score = ?, final_score = ?, manual_feedback = ?, 
            manual_graded_by = ?, manual_graded_at = NOW(), status = ?
        WHERE id = ?
        `,
        [manualScore, finalScore, feedback || null, graderId, status, id]
      );

      // SYNC: Update test_session_submissions so session status recompute works
      if (submission.session_id) {
          await conn.query(
            `UPDATE test_session_submissions 
             SET status = ? 
             WHERE test_session_id = ? AND problem_id = (SELECT problem_id FROM submissions WHERE id = ?)`,
            [status, submission.session_id, id]
          );
      }

      await conn.commit();
      
      // 5. Recompute Session Status
      await recomputeSessionStatus(submission.session_id, submission.user_id, submission.level);

      res.json({ 
        message: "Submission graded", 
        finalScore, 
        status,
        autoScore 
      });

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

  } catch (err) {
    console.error("Grade submission error:", err);
    res.status(500).json({ error: "Failed to grade submission" });
  }
}
