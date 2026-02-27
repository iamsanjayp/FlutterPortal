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

export function fetchAdminMetrics() {
  return request(`${API_BASE}/api/admin/metrics`);
}

export function fetchSchedules() {
  return request(`${API_BASE}/api/admin/schedules`);
}

export function createSchedule(payload) {
  return request(`${API_BASE}/api/admin/schedules`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSchedule(id, payload) {
  return request(`${API_BASE}/api/admin/schedules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function resetQuestions(payload) {
  return request(`${API_BASE}/api/admin/sessions/reset-questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchSessions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`${API_BASE}/api/admin/sessions${query ? `?${query}` : ""}`);
}

export function resetSessionLogin(sessionId) {
  return request(`${API_BASE}/api/admin/sessions/${sessionId}/reset-login`, {
    method: "POST",
  });
}

export function forceLogoutSession(sessionId) {
  return request(`${API_BASE}/api/admin/sessions/${sessionId}/force-logout`, {
    method: "POST",
  });
}

export function updateSessionDuration(id, payload) {
  return request(`${API_BASE}/api/admin/sessions/${id}/duration`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateSessionResult(id, payload) {
  return request(`${API_BASE}/api/admin/sessions/${id}/result`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function reinstateSession(sessionId) {
  return request(`${API_BASE}/api/admin/sessions/${sessionId}/reinstate`, {
    method: "POST",
  });
}

export function fetchSubmissions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`${API_BASE}/api/admin/submissions${query ? `?${query}` : ""}`);
}

export function updateSubmissionStatus(id, payload) {
  return request(`${API_BASE}/api/admin/submissions/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// React Native submissions (admin)
export function fetchRNSubmissions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`${API_BASE}/api/admin/rn-submissions${query ? `?${query}` : ""}`);
}

export function runRNSubmission(id) {
  return request(`${API_BASE}/api/admin/rn-submissions/${id}/run`, {
    method: "POST",
  });
}

export function updateRNSubmissionStatus(id, payload) {
  return request(`${API_BASE}/api/admin/rn-submissions/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function gradeSubmission(id, payload) {
  return request(`${API_BASE}/api/admin/rn-submissions/${id}/grade`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchStudents(query) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  return request(`${API_BASE}/api/admin/students?${params.toString()}`);
}

export function createStudent(payload) {
  return request(`${API_BASE}/api/admin/students`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudentStatus(id, payload) {
  return request(`${API_BASE}/api/admin/students/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateStudentLevel(id, payload) {
  return request(`${API_BASE}/api/admin/students/${id}/level`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchStudentSessions(id) {
  return request(`${API_BASE}/api/admin/students/${id}/sessions`);
}

export function fetchProblems(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`${API_BASE}/api/admin/problems${query ? `?${query}` : ""}`);
}

export function createProblem(payload) {
  return request(`${API_BASE}/api/admin/problems`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProblem(id, payload) {
  return request(`${API_BASE}/api/admin/problems/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteProblem(id) {
  return request(`${API_BASE}/api/admin/problems/${id}`, {
    method: "DELETE",
  });
}

export function fetchTestCases(problemId) {
  return request(`${API_BASE}/api/admin/problems/${problemId}/test-cases`);
}

export function createTestCase(problemId, payload) {
  return request(`${API_BASE}/api/admin/problems/${problemId}/test-cases`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTestCase(id, payload) {
  return request(`${API_BASE}/api/admin/test-cases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTestCase(id) {
  return request(`${API_BASE}/api/admin/test-cases/${id}`, {
    method: "DELETE",
  });
}

// Staff Assignment
export function assignStaffToSchedule(scheduleId, payload) {
  return request(`${API_BASE}/api/admin/schedules/${scheduleId}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getScheduleAssignments(scheduleId) {
  return request(`${API_BASE}/api/admin/schedules/${scheduleId}/assignments`);
}

export function removeStaffAssignment(scheduleId, userIdAndQuery) {
  return request(`${API_BASE}/api/admin/schedules/${scheduleId}/assign/${userIdAndQuery}`, {
    method: "DELETE",
  });
}

export function fetchAllUsers() {
  return request(`${API_BASE}/api/admin/users`);
}

// Staff Management
export function fetchStaffList() {
  return request(`${API_BASE}/api/admin/staff`);
}

export function createStaff(payload) {
  return request(`${API_BASE}/api/admin/staff`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function setStaffPermissions(userId, payload) {
  return request(`${API_BASE}/api/admin/staff/${userId}/permissions`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
