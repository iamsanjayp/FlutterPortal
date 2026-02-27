import pool from "../config/db.js";

// ===== Skill/Level/Sub-level APIs =====

export async function getSkills(req, res) {
  try {
    // Get unique skills (languages) from problems table
    const [rows] = await pool.query(`
      SELECT DISTINCT language as name, language as slug
      FROM problems
      WHERE is_active = 1
      ORDER BY language
    `);

    const skills = rows.map((row, index) => ({
      id: index + 1,
      name: row.name === 'REACT_NATIVE' ? 'React Native' : row.name,
      slug: row.name.toLowerCase().replace('_', '-')
    }));

    res.json({ skills });
  } catch (err) {
    console.error("Get skills error:", err);
    res.status(500).json({ error: "Failed to load skills" });
  }
}

export async function getLevels(req, res) {
  try {
    const { skill } = req.query;

    let query = `
      SELECT DISTINCT 
        CAST(SUBSTRING(level, 1, 1) AS UNSIGNED) as level_number
      FROM problems
      WHERE is_active = 1
    `;
    const params = [];

    if (skill && skill !== 'all') {
      const languageMap = { 'react-native': 'REACT_NATIVE', 'flutter': 'FLUTTER', 'python': 'PYTHON' };
      query += ` AND language = ?`;
      params.push(languageMap[skill] || 'REACT_NATIVE');
    }

    query += ` ORDER BY level_number`;

    const [rows] = await pool.query(query, params);

    const levels = rows.map(row => ({
      level_number: row.level_number,
      name: `Level ${row.level_number}`
    }));

    res.json({ levels });
  } catch (err) {
    console.error("Get levels error:", err);
    res.status(500).json({ error: "Failed to load levels" });
  }
}

export async function getSubLevels(req, res) {
  try {
    const { skill, level } = req.query;

    let query = `
      SELECT 
        SUBSTRING(level, 2, 1) as sub_level,
        COUNT(*) as question_count
      FROM problems
      WHERE is_active = 1
    `;
    const params = [];

    if (skill && skill !== 'all') {
      const languageMap = { 'react-native': 'REACT_NATIVE', 'flutter': 'FLUTTER', 'python': 'PYTHON' };
      query += ` AND language = ?`;
      params.push(languageMap[skill] || 'REACT_NATIVE');
    }

    if (level) {
      query += ` AND SUBSTRING(level, 1, 1) = ?`;
      params.push(level);
    }

    query += ` GROUP BY sub_level ORDER BY sub_level`;

    const [rows] = await pool.query(query, params);

    const subLevels = rows.map(row => ({
      sub_level: row.sub_level,
      name: `${level}${row.sub_level}`,
      question_count: row.question_count
    }));

    res.json({ sub_levels: subLevels });
  } catch (err) {
    console.error("Get sub-levels error:", err);
    res.status(500).json({ error: "Failed to load sub-levels" });
  }
}

// ===== Question Management APIs =====

export async function getQuestionsByFilter(req, res) {
  try {
    const { skill, level, subLevel, status, page = 1, limit = 20 } = req.query;

    let conditions = ["1=1"];
    let params = [];

    // Skill filter
    if (skill && skill !== 'all') {
      const languageMap = { 'react-native': 'REACT_NATIVE', 'flutter': 'FLUTTER', 'python': 'PYTHON' };
      conditions.push("language = ?");
      params.push(languageMap[skill] || skill.toUpperCase().replace('-', '_'));
    }

    // Level filter
    if (level && level !== 'all') {
      conditions.push("SUBSTRING(level, 1, 1) = ?");
      params.push(level);
    }

    // Sub-level filter
    if (subLevel && subLevel !== 'all') {
      conditions.push("SUBSTRING(level, 2, 1) = ?");
      params.push(subLevel);
    }

    // Status filter
    if (status && status !== 'all') {
      conditions.push("is_active = ?");
      params.push(status === 'active' ? 1 : 0);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // Get total count
    const [[countRow]] = await pool.query(`
      SELECT COUNT(*) as total FROM problems ${whereClause}
    `, params);

    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get paginated questions
    const [rows] = await pool.query(`
      SELECT 
        id, level, title, description, starter_code, is_active, 
        language, problem_type, sample_image, created_at
      FROM problems
      ${whereClause}
      ORDER BY level, title
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Format response
    const questions = rows.map(q => {
      const levelMatch = q.level?.match(/^(\d+)([A-Z])$/);
      return {
        id: q.id,
        skill: q.language === 'REACT_NATIVE' ? 'React Native' : q.language,
        level_number: levelMatch ? parseInt(levelMatch[1]) : null,
        sub_level: levelMatch ? levelMatch[2] : null,
        level_display: q.level,
        title: q.title,
        description: q.description,
        starter_code: q.starter_code,
        is_active: q.is_active === 1,
        problem_type: q.problem_type,
        sample_image_base64: q.sample_image ? q.sample_image.toString("base64") : null,
        created_at: q.created_at
      };
    });

    res.json({
      questions,
      total,
      page: parseInt(page),
      totalPages
    });
  } catch (err) {
    console.error("Get questions by filter error:", err);
    res.status(500).json({ error: "Failed to load questions" });
  }
}

export async function getQuestionByIdNew(req, res) {
  try {
    const { id } = req.params;

    const [[question]] = await pool.query(`
      SELECT 
        id, level, title, description, starter_code, is_active, 
        language, problem_type, sample_image, created_at
      FROM problems
      WHERE id = ?
    `, [id]);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const levelMatch = question.level?.match(/^(\d+)([A-Z])$/);

    res.json({
      question: {
        id: question.id,
        skill: question.language === 'REACT_NATIVE' ? 'React Native' : question.language,
        level_number: levelMatch ? parseInt(levelMatch[1]) : null,
        sub_level: levelMatch ? levelMatch[2] : null,
        level_display: question.level,
        title: question.title,
        description: question.description,
        starter_code: question.starter_code,
        is_active: question.is_active === 1,
        problem_type: question.problem_type,
        sample_image_base64: question.sample_image ? question.sample_image.toString("base64") : null,
        created_at: question.created_at
      }
    });
  } catch (err) {
    console.error("Get question error:", err);
    res.status(500).json({ error: "Failed to load question" });
  }
}

export async function createQuestionNew(req, res) {
  try {
    const { skill, levelNumber, subLevel, title, description, starterCode, sampleImageBase64, isActive, problemType } = req.body;

    if (!skill || !levelNumber || !subLevel || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Map skill to language
    const languageMap = { 'react-native': 'REACT_NATIVE', 'React Native': 'REACT_NATIVE', 'flutter': 'FLUTTER', 'python': 'PYTHON' };
    const language = languageMap[skill] || 'REACT_NATIVE';

    // Combine level
    const level = `${levelNumber}${subLevel}`;

    const sampleImageBuffer = sampleImageBase64 ? Buffer.from(sampleImageBase64, "base64") : null;

    const [result] = await pool.query(`
      INSERT INTO problems (level, title, description, starter_code, is_active, language, problem_type, sample_image, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      level,
      title,
      description || "",
      starterCode || "",
      isActive ? 1 : 0,
      language,
      problemType || "UI",
      sampleImageBuffer,
      req.user?.id || null
    ]);

    res.json({ id: result.insertId, message: "Question created successfully" });
  } catch (err) {
    console.error("Create question error:", err);
    res.status(500).json({ error: "Failed to create question" });
  }
}

export async function updateQuestionNew(req, res) {
  try {
    const { id } = req.params;
    const { skill, levelNumber, subLevel, title, description, starterCode, sampleImageBase64, isActive, problemType } = req.body;

    // Map skill to language
    const languageMap = { 'react-native': 'REACT_NATIVE', 'React Native': 'REACT_NATIVE', 'flutter': 'FLUTTER', 'python': 'PYTHON' };
    const language = skill ? (languageMap[skill] || skill.toUpperCase().replace('-', '_')) : null;

    // Combine level
    const level = (levelNumber && subLevel) ? `${levelNumber}${subLevel}` : null;

    const sampleImageBuffer = sampleImageBase64 === undefined
      ? undefined
      : sampleImageBase64
        ? Buffer.from(sampleImageBase64, "base64")
        : null;

    let updateFields = [];
    let params = [];

    if (level) {
      updateFields.push("level = ?");
      params.push(level);
    }
    if (title) {
      updateFields.push("title = ?");
      params.push(title);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      params.push(description);
    }
    if (starterCode !== undefined) {
      updateFields.push("starter_code = ?");
      params.push(starterCode);
    }
    if (typeof isActive === 'boolean') {
      updateFields.push("is_active = ?");
      params.push(isActive ? 1 : 0);
    }
    if (language) {
      updateFields.push("language = ?");
      params.push(language);
    }
    if (problemType) {
      updateFields.push("problem_type = ?");
      params.push(problemType);
    }
    if (sampleImageBase64 !== undefined) {
      updateFields.push("sample_image = ?");
      params.push(sampleImageBuffer);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(id);

    const [result] = await pool.query(`
      UPDATE problems
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `, params);

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Question updated successfully" });
  } catch (err) {
    console.error("Update question error:", err);
    res.status(500).json({ error: "Failed to update question" });
  }
}

export async function deleteQuestionNew(req, res) {
  try {
    const { id } = req.params;

    // Soft delete
    const [result] = await pool.query(`
      UPDATE problems SET is_active = 0 WHERE id = ?
    `, [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    console.error("Delete question error:", err);
    res.status(500).json({ error: "Failed to delete question" });
  }
}

export async function toggleQuestionStatus(req, res) {
  try {
    const { id } = req.params;

    // Get current status
    const [[question]] = await pool.query(`
      SELECT is_active FROM problems WHERE id = ?
    `, [id]);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const newStatus = question.is_active ? 0 : 1;

    // Toggle status
    await pool.query(`
      UPDATE problems SET is_active = ? WHERE id = ?
    `, [newStatus, id]);

    res.json({ 
      is_active: newStatus === 1,
      message: `Question ${newStatus ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (err) {
    console.error("Toggle question status error:", err);
    res.status(500).json({ error: "Failed to toggle status" });
  }
}
