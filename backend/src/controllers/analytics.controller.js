import pool from "../config/db.js";

export async function getStudentAnalytics(req, res) {
  try {
    const { skill, level, subLevel } = req.query;

    let whereClause = "WHERE u.role_id = 1"; // Students only
    let params = [];
    let problemFilter = "WHERE is_active = 1";
    let problemParams = [];

    // Filter problems first to get total count based on filters
    if (skill && skill !== 'all') {
      const languageMap = { 'react-native': 'REACT_NATIVE', 'flutter': 'FLUTTER', 'python': 'PYTHON' };
      const lang = languageMap[skill] || skill.toUpperCase().replace('-', '_');
      problemFilter += " AND language = ?";
      problemParams.push(lang);
    }

    if (level && level !== 'all') {
      problemFilter += " AND SUBSTRING(level, 1, 1) = ?";
      problemParams.push(level);
    }

    if (subLevel && subLevel !== 'all') {
      problemFilter += " AND SUBSTRING(level, 2, 1) = ?";
      problemParams.push(subLevel);
    }

    // Get total questions matching filter
    const [[totalProblemsRow]] = await pool.query(`
      SELECT COUNT(*) as total FROM problems ${problemFilter}
    `, problemParams);
    const totalQuestions = totalProblemsRow?.total || 0;

    // Fetch student data with aggregated stats
    // Note: This query might need optimization for large datasets
    const [students] = await pool.query(`
      SELECT 
        u.id, u.full_name, u.roll_no, u.current_level, u.last_login,
        COUNT(DISTINCT s.problem_id) as solved_count,
        AVG(s.score) as avg_score,
        MAX(s.created_at) as last_submission
      FROM users u
      LEFT JOIN submissions s ON u.id = s.user_id AND s.status = 'PASS'
      LEFT JOIN problems p ON s.problem_id = p.id
      ${whereClause}
      ${skill || level || subLevel ? `
        AND (p.id IS NULL OR (
          1=1
          ${skill && skill !== 'all' ? `AND p.language = '${problemParams[0]}'` : ''}
          ${level && level !== 'all' ? `AND SUBSTRING(p.level, 1, 1) = '${level}'` : ''}
          ${subLevel && subLevel !== 'all' ? `AND SUBSTRING(p.level, 2, 1) = '${subLevel}'` : ''}
        ))
      ` : ''}
      GROUP BY u.id
      ORDER BY u.full_name
    `, params);

    // Calculate aggregated stats
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.last_login && new Date(s.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length; // Active in last 7 days
    const globalAvgScore = students.reduce((acc, s) => acc + (parseFloat(s.avg_score) || 0), 0) / (totalStudents || 1);
    
    // Format response
    const studentData = students.map(s => {
      const solved = s.solved_count || 0;
      const completionRate = totalQuestions > 0 ? (solved / totalQuestions) * 100 : 0;
      
      return {
        id: s.id,
        name: s.full_name,
        roll_no: s.roll_no,
        current_level: s.current_level,
        solved_count: solved,
        total_questions: totalQuestions,
        completion_rate: Math.round(completionRate),
        avg_score: Math.round(s.avg_score || 0),
        last_active: s.last_submission || s.last_login
      };
    });

    res.json({
      stats: {
        total_students: totalStudents,
        active_students: activeStudents,
        avg_score: Math.round(globalAvgScore),
        avg_completion: Math.round(studentData.reduce((acc, s) => acc + s.completion_rate, 0) / (totalStudents || 1))
      },
      students: studentData
    });

  } catch (err) {
    console.error("Get analytics error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
}
