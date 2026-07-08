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

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 border-l-4 border-indigo-500">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 flex-1 focus:outline-none focus:border-indigo-500"
            placeholder="Search by name, email, roll"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
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
                className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm shadow-sm transition ${
                  selectedStudent?.id === student.id
                    ? "border-indigo-500 bg-indigo-50/60"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="font-bold text-slate-800">{student.full_name}</div>
                <div className="text-xs text-slate-500">{student.email}</div>
                <div className="text-xs text-slate-600 mt-1">Status: <span className={student.is_active ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>{student.is_active ? "Active" : "Blocked"}</span></div>
              </button>
            ))}
            {!students.length && (
              <div className="text-sm text-slate-500">Search for students to begin.</div>
            )}
          </div>

          {selectedStudent && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="font-bold text-slate-800">{selectedStudent.full_name}</div>
                <div className="text-xs text-slate-600">{selectedStudent.email}</div>
                <div className="text-xs text-slate-600 mt-1">Enrollment: {selectedStudent.enrollment_no || "-"}</div>
                <div className="text-xs text-slate-600">Roll: {selectedStudent.roll_no || "-"}</div>
                <button
                  onClick={handleToggleStatus}
                  className="mt-3 px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-sm transition"
                >
                  {selectedStudent.is_active ? "Block" : "Unblock"}
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-bold text-slate-800">Test Sessions</div>
                {sessions.map(session => (
                  <div key={session.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-xs space-y-1">
                    <div className="font-bold text-slate-800 text-sm">Session {session.id}</div>
                    <div className="text-slate-600">Level: <span className="font-semibold text-indigo-600">{session.level}</span></div>
                    <div className="text-slate-600">Status: <span className="font-semibold">{session.status}</span></div>
                    <div className="text-slate-600">Cleared: <span className={session.level_cleared ? "text-emerald-600 font-semibold" : "text-slate-500"}>{session.level_cleared ? "Yes" : "No"}</span></div>
                    <div className="text-slate-500">Started: {new Date(session.started_at).toLocaleString()}</div>
                    <div className="text-slate-500">Ended: {session.ended_at ? new Date(session.ended_at).toLocaleString() : "-"}</div>
                    <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleUpdateResult(session.id, "PASS", true)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition"
                      >
                        Mark PASS
                      </button>
                      <button
                        onClick={() => handleUpdateResult(session.id, "FAIL", false)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm transition"
                      >
                        Mark FAIL
                      </button>
                    </div>
                  </div>
                ))}
                {!sessions.length && (
                  <div className="text-sm text-slate-500">No sessions found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
