export async function executeFlutter({ problemId, code }) {
  const response = await fetch(
    "http://localhost:5000/api/execute/flutter",
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
