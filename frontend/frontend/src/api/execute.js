import { API_BASE } from "./apiBase.js";

export async function executeFlutter({ problemId, code }) {
  const response = await fetch(
    `${API_BASE}/execute/flutter`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include", // VERY IMPORTANT (auth cookie)
      body: JSON.stringify({
        problemId,
        code
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Execution failed");
  }

  return response.json();
}
