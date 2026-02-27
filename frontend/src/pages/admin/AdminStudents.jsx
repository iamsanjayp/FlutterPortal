import { useState } from "react";
import { fetchStudents, updateStudentStatus, fetchStudentSessions, updateSessionResult } from "../../api/adminApi";

export default function AdminStudents() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function pushNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  }

  async function handleSearch() {
    setError("");
    try {
      const res = await fetchStudents(query);
      setStudents(res.students || []);
    } catch (err) {
      setError(err.message || "Failed to load students");
    }
  }

  async function handleSelect(student) {
    setSelectedStudent(student);
    setError("");
    try {
      const res = await fetchStudentSessions(student.id);
      setSessions(res.sessions || []);
    } catch (err) {
      setError(err.message || "Failed to load sessions");
    }
  }

  async function handleToggleStatus() {
    if (!selectedStudent) return;
    setError("");
    try {
      await updateStudentStatus(selectedStudent.id, {
        isActive: !selectedStudent.is_active,
      });
      pushNotice("Student status updated");
      await handleSearch();
      setSelectedStudent({ ...selectedStudent, is_active: !selectedStudent.is_active });
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  }

  async function handleUpdateResult(sessionId, status, levelCleared) {
    setError("");
    try {
      await updateSessionResult(sessionId, { status, levelCleared });
      pushNotice("Session updated");
      if (selectedStudent) {
        const res = await fetchStudentSessions(selectedStudent.id);
        setSessions(res.sessions || []);
      }
    } catch (err) {
      setError(err.message || "Failed to update session");
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {notice && <div className="text-sm text-emerald-600">{notice}</div>}

      <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6 space-y-4 border-l-4 border-indigo-500">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 flex-1"
            placeholder="Search by name, email, roll"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm shadow-sm"
          >
            Search
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {students.map(student => (
              <button
                key={student.id}
                onClick={() => handleSelect(student)}
                className={`w-full text-left rounded-xl border px-3 py-2 text-sm shadow-sm ${
                  selectedStudent?.id === student.id
                    ? "border-indigo-400 bg-slate-800"
                    : "border-slate-800 bg-slate-950"
                }`}
              >
                <div className="font-semibold text-slate-100">{student.full_name}</div>
                <div className="text-xs text-slate-400">{student.email}</div>
                <div className="text-xs text-slate-400">Status: {student.is_active ? "Active" : "Blocked"}</div>
              </button>
            ))}
            {!students.length && (
              <div className="text-sm text-slate-400">Search for students to begin.</div>
            )}
          </div>

          {selectedStudent && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-sm">
                <div className="font-semibold text-slate-100">{selectedStudent.full_name}</div>
                <div className="text-xs text-slate-400">{selectedStudent.email}</div>
                <div className="text-xs text-slate-400">Enrollment: {selectedStudent.enrollment_no || "-"}</div>
                <div className="text-xs text-slate-400">Roll: {selectedStudent.roll_no || "-"}</div>
                <button
                  onClick={handleToggleStatus}
                  className="mt-3 px-3 py-1 rounded-lg border border-slate-700 text-xs text-slate-100"
                >
                  {selectedStudent.is_active ? "Block" : "Unblock"}
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-100">Test Sessions</div>
                {sessions.map(session => (
                  <div key={session.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-sm text-xs">
                    <div className="font-semibold text-slate-100">Session {session.id}</div>
                    <div>Level: {session.level}</div>
                    <div>Status: {session.status}</div>
                    <div>Cleared: {session.level_cleared ? "Yes" : "No"}</div>
                    <div>Started: {new Date(session.started_at).toLocaleString()}</div>
                    <div>Ended: {session.ended_at ? new Date(session.ended_at).toLocaleString() : "-"}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleUpdateResult(session.id, "PASS", true)}
                        className="px-2 py-1 rounded-lg bg-emerald-500 text-white"
                      >
                        Mark PASS
                      </button>
                      <button
                        onClick={() => handleUpdateResult(session.id, "FAIL", false)}
                        className="px-2 py-1 rounded-lg bg-amber-500 text-white"
                      >
                        Mark FAIL
                      </button>
                    </div>
                  </div>
                ))}
                {!sessions.length && (
                  <div className="text-sm text-slate-400">No sessions found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
