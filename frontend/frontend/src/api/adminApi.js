import { API_BASE_ROOT } from "./apiBase.js";

const API_BASE = API_BASE_ROOT;

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

export function extendScheduleDuration(scheduleId, payload) {
  return request(`${API_BASE}/api/admin/schedules/${scheduleId}/extend-duration`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export function resetUserLogin(userId) {
  return request(`${API_BASE}/api/admin/users/${userId}/reset-login`, {
    method: "POST",
  });
}

export function forceLogoutUser(userId) {
  return request(`${API_BASE}/api/admin/users/${userId}/force-logout`, {
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

export function fetchUiSubmissions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`${API_BASE}/api/admin/submissions/ui${query ? `?${query}` : ""}`);
}

export function updateSubmissionStatus(id, payload) {
  return request(`${API_BASE}/api/admin/submissions/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteSubmission(id) {
  return request(`${API_BASE}/api/admin/submissions/${id}`, {
    method: "DELETE",
  });
}

export function fetchStudents(query, options = {}) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);

  const roles = options.roles || null;
  const role = options.role ?? "STUDENT";

  if (roles && roles.length) {
    params.set("roles", Array.isArray(roles) ? roles.join(",") : String(roles));
  } else if (role) {
    params.set("role", role);
  }

  return request(`${API_BASE}/api/admin/students?${params.toString()}`);
}

export function fetchStaff(query) {
  return fetchStudents(query, { roles: ["TEACHER", "ADMIN"] });
}

export function fetchTeachers(query) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  params.set("role", "TEACHER");
  return request(`${API_BASE}/api/admin/students?${params.toString()}`);
}

export function createUser(payload) {
  return request(`${API_BASE}/api/admin/users`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(id, payload) {
  return request(`${API_BASE}/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function bulkImportUsers(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/admin/users/bulk`, {
    method: "POST",
    credentials: "include",
    body: formData,
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

export function fetchProblems() {
  return request(`${API_BASE}/api/admin/problems`);
}

export async function bulkImportProblems(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/admin/problems/bulk`, {
    method: "POST",
    credentials: "include",
    body: formData,
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

export function fetchLevels() {
  return request(`${API_BASE}/api/admin/levels`);
}

export function createLevel(payload) {
  return request(`${API_BASE}/api/admin/levels`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLevel(code, payload) {
  return request(`${API_BASE}/api/admin/levels/${code}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
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

export async function uploadProblemReferenceImage(problemId, file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE}/api/admin/problems/${problemId}/reference-image`, {
    method: "POST",
    credentials: "include",
    body: formData,
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
