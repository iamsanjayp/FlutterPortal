export async function executeFlutter({ problemId, code }) {
  const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  const response = await fetch(
    `${apiBase}/api/execute/flutter`,
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
