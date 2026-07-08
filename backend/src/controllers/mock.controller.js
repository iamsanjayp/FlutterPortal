import pool from "../config/db.js";

export const handleMockApi = async (req, res) => {
  try {
    const { problemId } = req.params;
    const subRoute = req.params[0] ? `/${req.params[0].replace(/^\/+/, "")}` : "";

    if (!problemId) {
      return res.status(400).json({ error: "Problem ID is required" });
    }

    const [rows] = await pool.query(
      "SELECT mock_api_route, mock_api_response, mock_db_seed FROM problems WHERE id = ?",
      [problemId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: `Problem ${problemId} not found` });
    }

    const problem = rows[0];

    // Check if requesting DB seed data specifically
    if (subRoute === "/seed" || subRoute === "/db_seed") {
      let seedData = null;
      try {
        seedData = problem.mock_db_seed ? JSON.parse(problem.mock_db_seed) : {};
      } catch (e) {
        seedData = { raw: problem.mock_db_seed };
      }
      return res.status(200).json(seedData);
    }

    // Default to mock_api_response
    let responsePayload = null;
    try {
      responsePayload = problem.mock_api_response ? JSON.parse(problem.mock_api_response) : { message: "Mock API active, but no JSON response defined." };
    } catch (e) {
      responsePayload = { data: problem.mock_api_response };
    }

    // Optional route matching check if route was specified by teacher
    if (problem.mock_api_route && problem.mock_api_route.trim() !== "" && problem.mock_api_route !== "*") {
      const targetRoute = problem.mock_api_route.startsWith("/") ? problem.mock_api_route : `/${problem.mock_api_route}`;
      if (subRoute !== targetRoute && subRoute !== "") {
        console.warn(`[MockAPI] Route mismatch for problem ${problemId}: requested ${subRoute}, expected ${targetRoute}`);
      }
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("[MockAPI] Error serving mock data:", error);
    return res.status(500).json({ error: "Internal server error serving mock data" });
  }
};
