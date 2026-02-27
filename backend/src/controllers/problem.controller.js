import pool from "../config/db.js";

export async function getProblemById(req, res) {
  const { id } = req.params;

  try {
    // 1️⃣ Fetch problem (including sample_image)
    const [problems] = await pool.query(
      `SELECT id, title, description, starter_code, sample_image, problem_type 
       FROM problems 
       WHERE id = ? AND is_active = true`,
      [id]
    );

    if (problems.length === 0) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const problem = problems[0];
    
    // Convert BLOB image to base64 if it exists
    let sampleImageBase64 = null;
    if (problem.sample_image) {
      // Convert Buffer to base64 data URL
      const base64Image = Buffer.from(problem.sample_image).toString('base64');
      // Assume PNG format, but you could detect the format from magic bytes if needed
      sampleImageBase64 = `data:image/png;base64,${base64Image}`;
    }

    // 2️⃣ Fetch test cases
    const [testCases] = await pool.query(
      `SELECT id, input_data, expected_output, is_hidden 
       FROM test_cases 
       WHERE problem_id = ?`,
      [id]
    );

    const sampleTests = testCases
      .filter(tc => !tc.is_hidden)
      .map(tc => ({
        input: tc.input_data,
        expected: tc.expected_output
      }));

    const hiddenTestCount = testCases.filter(tc => tc.is_hidden).length;

    // 3️⃣ Send clean response
    res.json({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      starterCode: problem.starter_code,
      problemType: problem.problem_type,
      sampleImage: sampleImageBase64,
      sampleTests,
      hiddenTestCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
