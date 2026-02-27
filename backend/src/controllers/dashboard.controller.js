import pool from "../config/db.js";
import { getLevelConfig, getNextLevel } from "../utils/level.js";
import { getLatestSchedules } from "../utils/schedule.js";
import { evaluateCodeProblem } from "../services/codeEvaluator.js";

// ... (existing functions remain unchanged)

// ===== Dashboard & User Management APIs =====

export async function getDashboardMetrics(req, res) {
  try {
    // Total levels
    const [[levelsRow]] = await pool.query(
      "SELECT COUNT(DISTINCT level) as total_levels FROM problems WHERE is_active = 1"
    );

    // Total sub-levels (count distinct level combinations)
    const [[subLevelsRow]] = await pool.query(
      "SELECT COUNT(DISTINCT level) as total_sub_levels FROM problems WHERE is_active = 1"
    );

    // Total questions
    const [[questionsRow]] = await pool.query(
      "SELECT COUNT(*) as total_questions FROM problems WHERE is_active = 1"
    );

    // Active students (role_id = 1 for students and is_active = 1)
    const [[activeStudentsRow]] = await pool.query(
      "SELECT COUNT(*) as active_students FROM users WHERE role_id = 1 AND is_active = 1"
    );

    // Total students (role_id = 1)
    const [[totalStudentsRow]] = await pool.query(
      "SELECT COUNT(*) as total_students FROM users WHERE role_id = 1"
    );

    // Avg completion rate (from submissions)
    const [[completionRow]] = await pool.query(`
      SELECT AVG(completion_rate) as avg_completion_rate
      FROM (
        SELECT user_id, 
          COALESCE(COUNT(CASE WHEN status = 'PASS' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 0) as completion_rate
        FROM submissions
        GROUP BY user_id
      ) user_stats
    `);

    res.json({
      total_levels: levelsRow?.total_levels || 0,
      total_sub_levels: subLevelsRow?.total_sub_levels || 0,
      total_questions: questionsRow?.total_questions || 0,
      active_students: activeStudentsRow?.active_students || 0,
      total_students: totalStudentsRow?.total_students || 0,
      avg_completion_rate: parseFloat(completionRow?.avg_completion_rate || 0).toFixed(1)
    });
  } catch (err) {
    console.error("Dashboard metrics error:", err);
    res.status(500).json({ error: "Failed to load dashboard metrics" });
  }
}

export async function getPerformanceData(req, res) {
  try {
    const { level, period } = req.query;

    let query = `
      SELECT 
        p.level,
        CONCAT('Level ', SUBSTRING(p.level, 1, 1)) as name,
        COUNT(DISTINCT s.user_id) as students,
        COALESCE(AVG(CASE WHEN s.status = 'PASS' THEN 100 ELSE 0 END), 0) as completion,
        COALESCE(AVG(s.score), 0) as avg_score
      FROM problems p
      LEFT JOIN submissions s ON s.problem_id = p.id
    `;

    const params = [];

    if (level && level !== 'all') {
      query += ` WHERE p.level LIKE ?`;
      params.push(`${level}%`);
    }

    query += ` GROUP BY p.level ORDER BY p.level`;

    const [rows] = await pool.query(query, params);

    res.json({
      performance: rows.map(row => ({
        name: row.name,
        level_number: parseInt(row.level),
        completion: Math.round(row.completion),
        students: row.students,
        avg_score: Math.round(row.avg_score)
      }))
    });
  } catch (err) {
    console.error("Performance data error:", err);
    res.status(500).json({ error: "Failed to load performance data" });
  }
}

export async function getAllUsers(req, res) {
  try {
    const { role, level, status, search, page = 1, limit = 20 } = req.query;

    let conditions = [];
    let params = [];

    // Role filter (map role string to role_id: student=1, staff=2, admin=3)
    if (role && role !== 'all') {
      const roleMap = { student: 1, staff: 2, admin: 3 };
      conditions.push("u.role_id = ?");
      params.push(roleMap[role] || 1);
    }

    // Level filter
    if (level && level !== 'all') {
      conditions.push("u.current_level LIKE ?");
      params.push(`${level}%`);
    }

    // Status filter
    if (status && status !== 'all') {
      conditions.push("u.is_active = ?");
      params.push(status === 'active' ? 1 : 0);
    }

    // Search filter
    if (search) {
      conditions.push("(u.full_name LIKE ? OR u.email LIKE ? OR u.roll_no LIKE ?)");
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const [[countRow]] = await pool.query(`
      SELECT COUNT(*) as total FROM users u ${whereClause}
    `, params);

    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get paginated users with completion rate
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.full_name, u.email, u.roll_no, u.role_id, 
        u.current_level, u.is_active, NULL as last_login, u.created_at,
        (SELECT COALESCE(COUNT(CASE WHEN status = 'PASS' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 0)
         FROM submissions WHERE user_id = u.id) as completion_rate
      FROM users u
      ${whereClause}
      ORDER BY u.full_name
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Format the response
    const users = rows.map(user => {
      // Map role_id to role string
      const roleMap = { 1: 'student', 2: 'staff', 3: 'admin' };
      const role = roleMap[user.role_id] || 'student';
      
      // Parse current_level to extract level number and sub-level
      const levelMatch = user.current_level?.match(/^(\d+)([A-Z])$/);
      const current_level = levelMatch ? parseInt(levelMatch[1]) : null;
      const current_sub_level = levelMatch ? levelMatch[2] : null;

      return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        roll_no: user.roll_no,
        role: role,
        current_level,
        current_sub_level,
        status: user.is_active ? 'active' : 'disabled',
        completion_rate: Math.round(user.completion_rate || 0),
        last_login: user.last_login,
        created_at: user.created_at
      };
    });

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages
    });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const [[user]] = await pool.query(`
      SELECT 
        u.id, u.full_name, u.email, u.roll_no, u.role_id, 
        u.current_level, u.is_active, NULL as last_login, u.created_at,
        (SELECT COALESCE(COUNT(CASE WHEN status = 'PASS' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 0)
         FROM submissions WHERE user_id = u.id) as completion_rate
      FROM users u
      WHERE u.id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to load user" });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'staff', 'student'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Map role string to role_id
    const roleMap = { student: 1, staff: 2, admin: 3 };
    const roleId = roleMap[role];

    // Get current user info
    const [[currentUser]] = await pool.query(
      "SELECT id, role_id, full_name FROM users WHERE id = ?",
      [id]
    );

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update role
    const [result] = await pool.query(
      "UPDATE users SET role_id = ? WHERE id = ?",
      [roleId, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log to audit_logs (if table exists)
    try {
      const oldRoleMap = { 1: 'student', 2: 'staff', 3: 'admin' };
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, action_type, details, ip_address, created_at)
        VALUES (?, 'ROLE_CHANGE', 'ROLE_CHANGE', ?, ?, NOW())
      `, [
        req.user?.id || null,
        JSON.stringify({ target_user_id: id, old_role: oldRoleMap[currentUser.role_id], new_role: role, user_name: currentUser.full_name }),
        req.ip || req.connection.remoteAddress
      ]);
    } catch (logErr) {
      console.warn("Audit log insert failed (table might not exist):", logErr.message);
    }

    res.json({ message: "Role updated successfully" });
  } catch (err) {
    console.error("Update user role error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const isActive = status === 'active' ? 1 : 0;

    // Get current user info
    const [[currentUser]] = await pool.query(
      "SELECT id, is_active, full_name FROM users WHERE id = ?",
      [id]
    );

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update status
    const [result] = await pool.query(
      "UPDATE users SET is_active = ? WHERE id = ?",
      [isActive, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log to audit_logs (if table exists)
    try {
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, action_type, details, ip_address, created_at)
        VALUES (?, 'STATUS_CHANGE', 'STATUS_CHANGE', ?, ?, NOW())
      `, [
        req.user?.id || null,
        JSON.stringify({ target_user_id: id, old_status: currentUser.is_active ? 'active' : 'disabled', new_status: status, user_name: currentUser.full_name }),
        req.ip || req.connection.remoteAddress
      ]);
    } catch (logErr) {
      console.warn("Audit log insert failed (table might not exist):", logErr.message);
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Update user status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
}
