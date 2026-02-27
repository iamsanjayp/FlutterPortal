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

// My assignments & permissions
export function fetchMyAssignments() {
  return request(`${API_BASE}/api/staff/my-assignments`);
}

// RN Submissions (GRADER)
export function fetchRNSubmissions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`${API_BASE}/api/staff/rn-submissions${query ? `?${query}` : ""}`);
}

export function runRNSubmission(id) {
  return request(`${API_BASE}/api/staff/rn-submissions/${id}/run`, {
    method: "POST",
  });
}

export function updateRNSubmissionStatus(id, payload) {
  return request(`${API_BASE}/api/staff/rn-submissions/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function gradeSubmission(id, payload) {
  return request(`${API_BASE}/api/staff/rn-submissions/${id}/grade`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Slot monitoring (SLOT_SUPERVISOR)
export function fetchSlotStudents(scheduleId) {
  return request(`${API_BASE}/api/staff/slot/${scheduleId}/students`);
}

export function revokeStudent(scheduleId, sessionId) {
  return request(`${API_BASE}/api/staff/slot/${scheduleId}/revoke/${sessionId}`, {
    method: "POST",
  });
}

export function extendStudentTime(scheduleId, sessionId, extraMinutes = 15) {
  return request(`${API_BASE}/api/staff/slot/${scheduleId}/extend/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({ extraMinutes }),
  });
}

export default {
  fetchMyAssignments,
  fetchRNSubmissions,
  runRNSubmission,
  updateRNSubmissionStatus,
  gradeSubmission,
  fetchSlotStudents,
  revokeStudent,
  extendStudentTime,
};
