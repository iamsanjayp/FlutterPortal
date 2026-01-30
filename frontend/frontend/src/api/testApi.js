const API_BASE = "http://localhost:5000/api";

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "API error");
  }

  return res.json();
}

// 1. Start test
export function startTest() {
  return request(`${API_BASE}/test/start`, {
    method: "POST",
  });
}

// 2. Load test data
export function fetchTest(sessionId) {
  return request(`${API_BASE}/test/${sessionId}`);
}

// 2b. Load session meta
export function fetchTestMeta(sessionId) {
  return request(`${API_BASE}/test/${sessionId}/meta`);
}

// 3. Execute code
export function executeTest(payload) {
  return request(`${API_BASE}/execute/flutter`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 4. Execute custom input
export function executeCustom(payload) {
  return request(`${API_BASE}/execute/flutter/custom`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 5. Finish test
export function finishTest(payload) {
  return request(`${API_BASE}/test/finish`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 6. Submit feedback
export function submitFeedback(payload) {
  return request(`${API_BASE}/test/feedback`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
