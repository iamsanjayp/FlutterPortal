import { useState } from "react";
import { resetQuestions, updateSessionDuration, fetchSubmissions, fetchSessions } from "../../api/adminApi";

export default function AdminTests() {
  const [resetSessionIds, setResetSessionIds] = useState("");
  const [resetUserIds, setResetUserIds] = useState("");
  const [durationSessionId, setDurationSessionId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filters, setFilters] = useState({ sessionId: "", studentId: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleSearchSession() {
    setError("");
    try {
      const res = await fetchSessions({ id: sessionSearch || undefined });
      const match = res.sessions?.[0] || null;
      setSelectedSession(match);
      if (match) {
        setResetSessionIds(String(match.id));
        setDurationSessionId(String(match.id));
        setFilters({ sessionId: String(match.id), studentId: String(match.user_id) });
      }
    } catch (err) {
      setError(err.message || "Failed to load session");
    }
  }

  function pushNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  }

  async function handleResetQuestions() {
    setError("");
    const sessionIds = resetSessionIds
      .split(",")
      .map(val => Number(val.trim()))
      .filter(Boolean);
    const userIds = resetUserIds
      .split(",")
      .map(val => Number(val.trim()))
      .filter(Boolean);

    try {
      await resetQuestions({ sessionIds, userIds });
      pushNotice("Questions reset");
    } catch (err) {
      setError(err.message || "Failed to reset questions");
    }
  }

  async function handleUpdateDuration() {
    setError("");
    try {
      await updateSessionDuration(durationSessionId, {
        durationMinutes: Number(durationMinutes),
      });
      pushNotice("Duration updated");
    } catch (err) {
      setError(err.message || "Failed to update duration");
    }
  }

  async function handleSearchSubmissions() {
    setError("");
    try {
      const res = await fetchSubmissions({
        sessionId: filters.sessionId || undefined,
        studentId: filters.studentId || undefined,
      });
      setSubmissions(res.submissions || []);
    } catch (err) {
      setError(err.message || "Failed to load submissions");
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {notice && <div className="text-sm text-emerald-600">{notice}</div>}

      <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6 space-y-4 border-l-4 border-indigo-500">
        <div>
          <div className="text-sm font-semibold text-slate-100">Search Session</div>
          <div className="text-xs text-slate-400">Enter a session ID to manage.</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            value={sessionSearch}
            onChange={event => setSessionSearch(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 flex-1"
            placeholder="Session ID"
          />
          <button
            onClick={handleSearchSession}
            className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm"
          >
            Search
          </button>
        </div>

        {selectedSession && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-100">Session {selectedSession.id}</div>
              <div className="text-xs text-slate-400">Level {selectedSession.level}</div>
            </div>
            <div className="text-xs text-slate-400 mt-2">Student ID: {selectedSession.user_id}</div>
            <div className="text-xs text-slate-400">{selectedSession.full_name} • {selectedSession.email}</div>
            <div className="text-xs text-slate-400">Started: {new Date(selectedSession.started_at).toLocaleString()}</div>
            <div className="text-xs text-slate-400">Duration: {selectedSession.duration_minutes || "Default"} mins</div>
          </div>
        )}
        {!selectedSession && sessionSearch && (
          <div className="text-sm text-slate-400">No session found.</div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-5 space-y-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">Reset Questions</div>
            <div className="text-xs text-slate-400">Update questions during a live test.</div>
          </div>
          <input
            value={resetSessionIds}
            onChange={event => setResetSessionIds(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Session IDs (comma-separated)"
          />
          <input
            value={resetUserIds}
            onChange={event => setResetUserIds(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Student IDs (comma-separated)"
          />
          <button
            onClick={handleResetQuestions}
            className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm shadow-sm"
          >
            Reset Questions
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-5 space-y-3 border-l-4 border-sky-500">
          <div>
            <div className="text-sm font-semibold text-slate-100">Change Duration</div>
            <div className="text-xs text-slate-400">Extend timing for active tests.</div>
          </div>
          <input
            value={durationSessionId}
            onChange={event => setDurationSessionId(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Session ID"
          />
          <input
            value={durationMinutes}
            onChange={event => setDurationMinutes(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Duration (minutes)"
          />
          <button
            onClick={handleUpdateDuration}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm shadow-sm"
          >
            Update Duration
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-5 space-y-3 border-l-4 border-emerald-500">
          <div>
            <div className="text-sm font-semibold text-slate-100">Submissions Lookup</div>
            <div className="text-xs text-slate-400">Review submitted code during or after tests.</div>
          </div>
          <input
            value={filters.sessionId}
            onChange={event => setFilters({ ...filters, sessionId: event.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Session ID"
          />
          <input
            value={filters.studentId}
            onChange={event => setFilters({ ...filters, studentId: event.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Student ID"
          />
          <button
            onClick={handleSearchSubmissions}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm shadow-sm"
          >
            View Submissions
          </button>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6 border-l-4 border-amber-500">
        <h2 className="text-lg font-semibold text-slate-100">Submission Results</h2>
        <div className="mt-4 space-y-4">
          {submissions.map(sub => (
            <div key={sub.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex flex-wrap justify-between">
                <div className="font-semibold text-slate-100">
                  {sub.problem_title} ({sub.status})
                </div>
                <div className="text-xs text-slate-400">{new Date(sub.created_at).toLocaleString()}</div>
              </div>
              <div className="text-xs text-slate-400">Student: {sub.student_name} | Session {sub.test_session_id}</div>
              <pre className="mt-3 whitespace-pre-wrap text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100">
                {sub.code}
              </pre>
            </div>
          ))}
          {!submissions.length && (
            <div className="text-sm text-slate-400">No submissions loaded.</div>
          )}
        </div>
      </section>
    </div>
  );
}
