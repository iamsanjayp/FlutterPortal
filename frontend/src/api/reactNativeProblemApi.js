const API_BASE = "http://localhost:5000";

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    let payload = null;
    try {
      payload = await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      throw new Error(text || `API error (${res.status})`);
    }
    throw new Error(payload.error || payload.message || `API error (${res.status})`);
  }

  return res.json();
}

// Fetch React Native problem by ID
export function fetchRNProblem(id) {
  return request(`${API_BASE}/api/react-native/problems/${id}`);
}

// Submit CODE-type problem solution
export function submitCodeSolution(problemId, code) {
  return request(`${API_BASE}/api/react-native/problems/${problemId}/submit-code`, {
    method: 'POST',
    body: JSON.stringify({ code })
  });
}

// Submit UI-type problem solution
export function submitUISolution(problemId, codeOrFiles) {
  const payload = typeof codeOrFiles === 'object' ? { files: codeOrFiles } : { code: codeOrFiles };
  return request(`${API_BASE}/api/react-native/problems/${problemId}/submit-ui`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Run tests for CODE-type problem (sample tests only)
export function runCodeTests(problemId, code) {
  return request(`${API_BASE}/api/react-native/problems/${problemId}/run-tests`, {
    method: 'POST',
    body: JSON.stringify({ code })
  });
}

// Get or create assessment session (random question assignment)
export function getAssessmentSession(level = '3A') {
  return request(`${API_BASE}/api/session?level=${level}`);
}

// Get current assigned problem (or specific problem by ID)
export function getCurrentProblem(level = '3A', problemId = null) {
  let url = `${API_BASE}/api/session/current-problem?level=${level}`;
  if (problemId) {
      url += `&problemId=${problemId}`;
  }
  return request(url);
}

// Update progress for a specific problem
export function updateProgress(problemId, status, level = '3A') {
    return request(`${API_BASE}/api/session/progress`, {
        method: 'POST',
        body: JSON.stringify({ problemId, status, level })
    });
}

// Clear session (for testing)
export function clearSession(userId, level) {
  return request(`${API_BASE}/api/session/clear`, {
    method: 'POST',
    body: JSON.stringify({ userId, level })
  });
}

// End test (deletes user session)
export function endTest(level = '3A') {
  return request(`${API_BASE}/api/session/end-test`, {
    method: 'POST',
    body: JSON.stringify({ level })
  });
}

export default {
  fetchRNProblem,
  submitCodeSolution,
  submitUISolution,
  runCodeTests,
  getAssessmentSession,
  getCurrentProblem,
  updateProgress,
  clearSession,
  endTest
};
