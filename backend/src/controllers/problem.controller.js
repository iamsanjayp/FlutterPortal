import pool from "../config/db.js";

export async function getProblemById(req, res) {
  const { id } = req.params;

  try {
    // 1️⃣ Fetch problem
    const [problems] = await pool.query(
      `SELECT id, title, description, starter_code 
       FROM problems 
       WHERE id = ? AND is_active = true`,
      [id]
    );

    if (problems.length === 0) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const problem = problems[0];

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
      sampleTests,
      hiddenTestCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
