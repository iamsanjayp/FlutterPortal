import { useState, useEffect } from 'react';
import { Search, RefreshCw, UserX, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { 
  fetchSessions, 
  resetQuestions, 
  updateSessionDuration,
  resetSessionLogin,
  forceLogoutSession,
  reinstateSession
} from '../../api/adminApi';

export default function AdminLiveTests() {
  const [sessions, setSessions] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchRoll, setSearchRoll] = useState('');
  const [searchDate, setSearchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [searchDate]);

  async function loadSessions() {
    try {
      setLoading(true);
      const data = await fetchSessions({
        date: searchDate || undefined,
      });
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetQuestions(sessionId) {
    if (!confirm('Reset questions for this student? This will assign new random questions.')) {
      return;
    }

    try {
      await resetQuestions({ sessionIds: [sessionId] });
      alert('Questions reset successfully');
      loadSessions();
    } catch (err) {
      alert('Failed to reset questions: ' + err.message);
    }
  }

  async function handleExtendTime(sessionId, currentDuration) {
    const newDuration = prompt(`Enter new duration in minutes (current: ${currentDuration}):`, currentDuration);
    if (!newDuration) return;

    try {
      await updateSessionDuration(sessionId, { durationMinutes: parseInt(newDuration) });
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
    try {
      await forceLogoutSession(sessionId);
      alert('User logged out');
    } catch (err) {
      alert('Failed to force logout: ' + err.message);
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
      });
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to search sessions:', err);
    } finally {
      setLoading(false);
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
            <button
              onClick={() => handleResetQuestions(selectedSession.id)}
              className="px-4 py-2 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
            >
              Change Questions
            </button>
          </div>
        </div>
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
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleResetLogin(session.id)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Reset Login"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleForceLogout(session.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Force Logout"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExtendTime(session.id, session.duration_minutes)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Extend Time"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResetQuestions(session.id)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Change Questions"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
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
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}
