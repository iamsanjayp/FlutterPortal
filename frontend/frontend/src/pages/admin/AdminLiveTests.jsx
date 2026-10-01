import { useState, useEffect } from 'react';
import { Search, RefreshCw, Clock, AlertCircle, Shuffle, X } from 'lucide-react';
import { 
  fetchSessions, 
  fetchSchedules,
  resetQuestions, 
  updateSessionDuration,
  resetSessionLogin,
  forceLogoutSession,
  reinstateSession,
  extendScheduleDuration
} from '../../api/adminApi';
import { fetchTest } from '../../api/testApi';

export default function AdminLiveTests() {
  const [sessions, setSessions] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchRoll, setSearchRoll] = useState('');
  const [searchDate, setSearchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');

  // Selective Question Replacement Modal State
  const [questionModalSession, setQuestionModalSession] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [sessionSubmissions, setSessionSubmissions] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [swappingProblemId, setSwappingProblemId] = useState(null);
  const [resettingAll, setResettingAll] = useState(false);
  const [modalMessage, setModalMessage] = useState({ text: '', type: '' });

  // Direct Detail View Questions State
  const [detailQuestions, setDetailQuestions] = useState([]);
  const [detailSubmissions, setDetailSubmissions] = useState({});
  const [loadingDetailQuestions, setLoadingDetailQuestions] = useState(false);
  const [swappingId, setSwappingId] = useState(null);

  useEffect(() => {
    if (!selectedSession?.id) {
      setDetailQuestions([]);
      setDetailSubmissions({});
      return;
    }
    loadSessionDetailQuestions(selectedSession.id);
  }, [selectedSession?.id]);

  async function loadSessionDetailQuestions(sId) {
    try {
      setLoadingDetailQuestions(true);
      const data = await fetchTest(sId);
      setDetailQuestions(data.questions || []);
      setDetailSubmissions(data.submissionStatuses || {});
    } catch (err) {
      console.error('Failed to load session questions:', err);
    } finally {
      setLoadingDetailQuestions(false);
    }
  }

  async function handleSwapOne(sessionId, problemId, questionNumber) {
    if (!window.confirm(`Replace Question #${questionNumber} with an alternative problem? The student's other questions and passed submissions will be completely preserved.`)) {
      return;
    }

    try {
      setSwappingId(problemId);
      await resetQuestions({ sessionIds: [sessionId], problemId });
      await loadSessionDetailQuestions(sessionId);
      await loadSessions();
      alert(`Question #${questionNumber} was replaced successfully! All other questions remain intact.`);
    } catch (err) {
      alert('Failed to swap question: ' + (err.message || err));
    } finally {
      setSwappingId(null);
    }
  }

  async function handleResetAll(sessionId) {
    if (!window.confirm("Are you sure you want to reset ALL questions for this student? This will wipe all current questions and assign brand new ones.")) {
      return;
    }

    try {
      setResettingAll(true);
      await resetQuestions({ sessionIds: [sessionId] });
      await loadSessionDetailQuestions(sessionId);
      await loadSessions();
      alert('All questions have been reset.');
    } catch (err) {
      alert('Failed to reset questions: ' + (err.message || err));
    } finally {
      setResettingAll(false);
    }
  }

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [searchDate, selectedScheduleId]);

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    try {
      const data = await fetchSchedules();
      setSchedules(data.schedules || []);
      if (!selectedScheduleId && data.schedules?.length) {
        setSelectedScheduleId(String(data.schedules[0].id));
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  }

  async function loadSessions() {
    try {
      setLoading(true);
      const data = await fetchSessions({
        date: searchDate || undefined,
        scheduleId: selectedScheduleId || undefined,
      });
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function openQuestionModal(session) {
    setQuestionModalSession(session);
    setLoadingQuestions(true);
    setModalMessage({ text: '', type: '' });
    try {
      const data = await fetchTest(session.id);
      setSessionQuestions(data.questions || []);
      setSessionSubmissions(data.submissionStatuses || {});
    } catch (err) {
      setModalMessage({ text: err?.message || 'Failed to load session questions', type: 'error' });
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleSwapSingleQuestion(problemId) {
    if (!questionModalSession) return;
    if (!window.confirm("Swap only this question? The student's other questions and submissions will be preserved.")) {
      return;
    }

    setSwappingProblemId(problemId);
    setModalMessage({ text: '', type: '' });
    try {
      await resetQuestions({ sessionIds: [questionModalSession.id], problemId });
      const data = await fetchTest(questionModalSession.id);
      setSessionQuestions(data.questions || []);
      setSessionSubmissions(data.submissionStatuses || {});
      setModalMessage({ text: 'Question swapped successfully! Other questions remain untouched.', type: 'success' });
      loadSessions();
    } catch (err) {
      setModalMessage({ text: err?.message || 'Failed to swap question', type: 'error' });
    } finally {
      setSwappingProblemId(null);
    }
  }

  async function handleResetAllQuestions() {
    if (!questionModalSession) return;
    if (!window.confirm('Reset ALL questions for this student? This will wipe all current questions and assign brand new ones.')) {
      return;
    }

    setResettingAll(true);
    setModalMessage({ text: '', type: '' });
    try {
      await resetQuestions({ sessionIds: [questionModalSession.id] });
      const data = await fetchTest(questionModalSession.id);
      setSessionQuestions(data.questions || []);
      setSessionSubmissions(data.submissionStatuses || {});
      setModalMessage({ text: 'All questions reset successfully.', type: 'success' });
      loadSessions();
    } catch (err) {
      setModalMessage({ text: err?.message || 'Failed to reset questions', type: 'error' });
    } finally {
      setResettingAll(false);
    }
  }

  async function handleResetQuestions(sessionId) {
    const session = sessions.find(s => s.id === sessionId) || { id: sessionId };
    openQuestionModal(session);
  }

  async function handleExtendTime(sessionId, currentDuration) {
    const addMinutes = prompt(`Add minutes to remaining time (current duration: ${currentDuration}):`, "5");
    if (!addMinutes) return;

    try {
      await updateSessionDuration(sessionId, { extendMinutes: parseInt(addMinutes) });
      alert('Duration updated successfully');
      loadSessions();
    } catch (err) {
      alert('Failed to update duration: ' + err.message);
    }
  }

  async function handleResetLogin(sessionId) {
    try {
      await resetSessionLogin(sessionId);
      alert('Login reset successfully');
    } catch (err) {
      alert('Failed to reset login: ' + err.message);
    }
  }

  async function handleForceLogout(sessionId) {
    if (!window.confirm('Force logout this active test session?')) {
      return;
    }
    try {
      await forceLogoutSession(sessionId);
      await loadSessions();
      window.alert('User logged out and session terminated');
      setSelectedSession(null);
    } catch (err) {
      window.alert('Failed to force logout: ' + (err.message || err));
    }
  }

  async function handleReinstate(sessionId) {
    if (!confirm('Reinstate this session? This will clear submissions and reopen the test.')) {
      return;
    }

    try {
      await reinstateSession(sessionId);
      alert('Session reinstated');
      setSelectedSession(null);
      loadSessions();
    } catch (err) {
      alert('Failed to reinstate session: ' + err.message);
    }
  }

  async function handleSearch() {
    try {
      setLoading(true);
      const data = await fetchSessions({
        email: searchEmail || undefined,
        rollNo: searchRoll || undefined,
        date: searchDate || undefined,
        scheduleId: selectedScheduleId || undefined,
      });
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to search sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkExtend() {
    if (!selectedScheduleId) {
      alert('Select a slot to extend');
      return;
    }
    const addMinutes = prompt('Add minutes for all students in this slot:', '5');
    if (!addMinutes) return;

    try {
      await extendScheduleDuration(selectedScheduleId, { extendMinutes: parseInt(addMinutes) });
      alert('Slot duration extended');
      loadSessions();
    } catch (err) {
      alert('Failed to extend slot: ' + err.message);
    }
  }

  if (selectedSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Active Session</h1>
            <p className="text-sm text-gray-500 mt-1">Session details and actions</p>
          </div>
          <button
            onClick={() => setSelectedSession(null)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to List
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-lg font-semibold">
                {selectedSession.full_name?.charAt(0) || 'S'}
              </span>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">{selectedSession.full_name || 'Student'}</div>
              <div className="text-sm text-gray-500">{selectedSession.email}</div>
              <div className="text-sm text-gray-500">Roll: {selectedSession.roll_no || '-'} | User ID: {selectedSession.user_id}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard label="Session ID" value={selectedSession.id} />
            <InfoCard label="Level" value={`Level ${selectedSession.level}`} />
            <InfoCard label="Duration" value={`${selectedSession.duration_minutes || 0} min`} />
            <InfoCard label="Started At" value={new Date(selectedSession.started_at).toLocaleString()} />
            <InfoCard label="Status" value={selectedSession.status} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleReinstate(selectedSession.id)}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Reinstate Session
            </button>
            <button
              onClick={() => handleResetLogin(selectedSession.id)}
              className="px-4 py-2 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
            >
              Reset Login
            </button>
            <button
              onClick={() => handleForceLogout(selectedSession.id)}
              className="px-4 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Force Logout
            </button>
            <button
              onClick={() => handleExtendTime(selectedSession.id, selectedSession.duration_minutes)}
              className="px-4 py-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              Extend Time
            </button>
          </div>

          {/* Direct Question Inspection & Swap Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>Assigned Questions</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                    {detailQuestions.length} Problems
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Replace a faulty question individually without affecting other questions or already submitted code.
                </p>
              </div>
              <button
                onClick={() => handleResetAll(selectedSession.id)}
                disabled={resettingAll}
                className="px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-semibold transition flex items-center gap-1"
                title="Wipe and reset all questions for this session"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Reset All Questions</span>
              </button>
            </div>

            {loadingDetailQuestions ? (
              <div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading assigned questions…</span>
              </div>
            ) : detailQuestions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                No questions assigned to this session.
              </div>
            ) : (
              <div className="space-y-3">
                {detailQuestions.map((q, idx) => {
                  const status = detailSubmissions[q.id];
                  const isPassed = status === 'PASSED' || status === 'SUCCESS';
                  const isSub = !!status;
                  const isSwapping = swappingId === q.id;

                  return (
                    <div
                      key={q.id}
                      className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-gray-300 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-gray-900 truncate">
                            {q.title || `Problem #${q.id}`}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">(ID: {q.id})</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isPassed
                                ? 'bg-emerald-100 text-emerald-800'
                                : isSub
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {status || 'NOT ATTEMPTED'}
                          </span>
                        </div>
                        {q.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {q.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleSwapOne(selectedSession.id, q.id, idx + 1)}
                        disabled={isSwapping || resettingAll}
                        className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shrink-0 self-start sm:self-auto"
                        title={`Replace only Question ${idx + 1}`}
                      >
                        <Shuffle className={`w-3.5 h-3.5 ${isSwapping ? 'animate-spin' : ''}`} />
                        <span>{isSwapping ? 'Replacing…' : `Change Question ${idx + 1} Only`}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {renderQuestionModal()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Live Tests</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor active test sessions in real-time</p>
        </div>
        <button
          onClick={loadSessions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Slots</option>
            {schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.name} ({new Date(schedule.start_at).toLocaleDateString()})
              </option>
            ))}
          </select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Student email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <input
            type="text"
            value={searchRoll}
            onChange={(e) => setSearchRoll(e.target.value)}
            placeholder="Roll No"
            className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          <button
            onClick={handleBulkExtend}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Extend Slot Time
          </button>
        </div>
      </div>

      {/* Active Sessions Count */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">Active Test Sessions</p>
            <p className="text-4xl font-bold mt-1">{sessions.length}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level / Slot</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {session.full_name?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{session.full_name || 'Student'}</div>
                      <div className="text-xs text-gray-500">{session.roll_no || session.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-sm font-mono text-gray-600">{session.id}</code>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Level {session.level}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">Session ID: {session.id}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(session.started_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {session.duration_minutes || 0} min
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    session.status === 'IN_PROGRESS'
                      ? 'bg-green-100 text-green-700'
                      : session.status === 'PASS'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => openQuestionModal(session)}
                    className="px-2.5 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors font-medium inline-flex items-center gap-1"
                    title="Change or swap questions"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Questions</span>
                  </button>
                  <button
                    onClick={() => setSelectedSession(session)}
                    className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {loading ? 'Loading sessions...' : 'No active test sessions'}
            </p>
          </div>
        )}
      </div>

      {renderQuestionModal()}
    </div>
  );

  function renderQuestionModal() {
    if (!questionModalSession) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Manage Questions - {questionModalSession.full_name || "Student"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Session #{questionModalSession.id} · Level {questionModalSession.level} · Replace faulty questions individually without affecting other completed problems.
              </p>
            </div>
            <button
              onClick={() => setQuestionModalSession(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {modalMessage.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  modalMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {modalMessage.text}
              </div>
            )}

            {loadingQuestions ? (
              <div className="py-12 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                <p className="text-xs font-medium">Fetching assigned questions…</p>
              </div>
            ) : sessionQuestions.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs">
                No questions assigned to this session yet.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Assigned Questions ({sessionQuestions.length})
                </div>
                {sessionQuestions.map((q, idx) => {
                  const status = sessionSubmissions[q.id];
                  const isPassed = status === "PASSED" || status === "SUCCESS";
                  const isSub = !!status;
                  const isSwapping = swappingProblemId === q.id;

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {q.title || `Problem #${q.id}`}
                          </h4>
                          <span className="text-[11px] text-gray-400 font-mono">ID: {q.id}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPassed
                                ? "bg-emerald-100 text-emerald-800"
                                : isSub
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {status || "NOT ATTEMPTED"}
                          </span>
                          {q.description && (
                            <p className="text-xs text-gray-500 truncate max-w-sm">
                              {q.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Swap action button */}
                      <button
                        onClick={() => handleSwapSingleQuestion(q.id)}
                        disabled={isSwapping || resettingAll}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
                        title="Replace only this question with an alternative"
                      >
                        <Shuffle className={`w-3.5 h-3.5 ${isSwapping ? "animate-spin" : ""}`} />
                        <span>{isSwapping ? "Swapping…" : "Swap This Question"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <button
              onClick={handleResetAllQuestions}
              disabled={resettingAll || loadingQuestions}
              className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition disabled:opacity-50 flex items-center gap-1.5"
              title="Wipe and assign all questions anew"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{resettingAll ? "Resetting…" : "Reset All Questions"}</span>
            </button>

            <button
              onClick={() => setQuestionModalSession(null)}
              className="px-4 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}
