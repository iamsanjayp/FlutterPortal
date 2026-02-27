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
      <div className="space-y-[24px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-text-primary tracking-tight">Active Session</h1>
            <p className="text-sm text-text-muted mt-1">Session details and actions</p>
          </div>
          <button
            onClick={() => setSelectedSession(null)}
            className="px-4 h-[32px] bg-main border border-border-subtle text-text-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-surface transition-colors"
          >
            Back to List
          </button>
        </div>

        <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[24px]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[10px] bg-accent-soft flex items-center justify-center border border-border-subtle">
              <span className="text-accent text-lg font-bold">
                {selectedSession.full_name?.charAt(0) || 'S'}
              </span>
            </div>
            <div>
              <div className="text-lg font-bold text-text-primary">{selectedSession.full_name || 'Student'}</div>
              <div className="text-sm text-text-muted">{selectedSession.email}</div>
              <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mt-1">Roll: {selectedSession.roll_no || '-'} <span className="mx-2">•</span> User ID: {selectedSession.user_id}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border-subtle pt-6">
            <InfoCard label="Session ID" value={selectedSession.id} />
            <InfoCard label="Level" value={`Level ${selectedSession.level}`} />
            <InfoCard label="Duration" value={`${selectedSession.duration_minutes || 0} min`} />
            <InfoCard label="Started At" value={new Date(selectedSession.started_at).toLocaleString()} />
            <InfoCard label="Status" value={selectedSession.status} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-border-subtle pt-6">
            <button
              onClick={() => handleReinstate(selectedSession.id)}
              className="px-4 h-[36px] rounded-[8px] bg-main text-text-primary border border-border-subtle hover:bg-surface transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Reinstate Session
            </button>
            <button
              onClick={() => handleResetLogin(selectedSession.id)}
              className="px-4 h-[36px] rounded-[8px] bg-warning-soft text-warning outline outline-1 outline-warning/20 hover:bg-warning hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Reset Login
            </button>
            <button
              onClick={() => handleForceLogout(selectedSession.id)}
              className="px-4 h-[36px] rounded-[8px] bg-danger-soft text-danger outline outline-1 outline-danger/20 hover:bg-danger hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Force Logout
            </button>
            <button
              onClick={() => handleExtendTime(selectedSession.id, selectedSession.duration_minutes)}
              className="px-4 h-[36px] rounded-[8px] bg-accent-soft text-accent outline outline-1 outline-accent/20 hover:bg-accent hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Extend Time
            </button>
            <button
              onClick={() => handleResetQuestions(selectedSession.id)}
              className="px-4 h-[36px] rounded-[8px] bg-success-soft text-success outline outline-1 outline-success/20 hover:bg-success hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Change Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[24px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary tracking-tight">Live Tests</h1>
          <p className="text-sm text-text-muted mt-1">Monitor active test sessions in real-time</p>
        </div>
        <button
          onClick={loadSessions}
          disabled={loading}
          className="flex items-center gap-2 px-4 h-[36px] bg-surface border border-border-subtle text-text-primary rounded-[8px] hover:bg-main transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[16px]">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Student email"
              className="w-full pl-9 pr-4 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
            />
          </div>
          <input
            type="text"
            value={searchRoll}
            onChange={(e) => setSearchRoll(e.target.value)}
            placeholder="Roll No"
            className="w-full md:w-48 px-4 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
          />
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-full md:w-auto px-4 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
          />
          <button
            onClick={handleSearch}
            className="w-full md:w-auto px-6 h-[40px] bg-accent text-white rounded-[8px] hover:bg-accent/90 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            Search
          </button>
        </div>
      </div>

      {/* Active Sessions Count */}
      <div className="bg-accent rounded-[10px] shadow-sm p-[24px] text-white border border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-[11px] font-bold uppercase tracking-wider">Active Test Sessions</p>
            <p className="text-4xl font-bold mt-2">{sessions.length}</p>
          </div>
          <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-main border-b border-border-subtle">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Student</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Session ID</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Level / Slot</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Login Time</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Duration</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-main/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-accent-soft flex items-center justify-center border border-border-subtle shrink-0">
                      <span className="text-accent text-sm font-bold">
                        {session.full_name?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{session.full_name || 'Student'}</div>
                      <div className="text-[11px] text-text-muted truncate">{session.roll_no || session.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-[11px] font-mono font-medium bg-main border border-border-subtle px-1.5 py-0.5 rounded text-text-muted">{session.id}</code>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-accent-soft text-accent outline outline-1 outline-accent/20">
                      Level {session.level}
                    </span>
                    <div className="text-[11px] text-text-muted mt-2 truncate">Session ID: {session.id}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">
                  {new Date(session.started_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Clock className="w-4 h-4 text-text-muted" />
                    {session.duration_minutes || 0} min
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${session.status === 'IN_PROGRESS'
                    ? 'bg-success-soft text-success outline outline-1 outline-success/20'
                    : session.status === 'PASS'
                      ? 'bg-accent-soft text-accent outline outline-1 outline-accent/20'
                      : 'bg-danger-soft text-danger outline outline-1 outline-danger/20'
                    }`}>
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="inline-flex items-center gap-1.5 px-3 h-[28px] bg-surface text-text-primary border border-border-subtle rounded-md hover:bg-main transition-colors text-[11px] font-bold uppercase tracking-wider"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleResetLogin(session.id)}
                      className="p-1.5 text-warning hover:bg-warning-soft rounded transition-colors"
                      title="Reset Login"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleForceLogout(session.id)}
                      className="p-1.5 text-danger hover:bg-danger-soft rounded transition-colors"
                      title="Force Logout"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExtendTime(session.id, session.duration_minutes)}
                      className="p-1.5 text-accent hover:bg-accent-soft rounded transition-colors"
                      title="Extend Time"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResetQuestions(session.id)}
                      className="p-1.5 text-success hover:bg-success-soft rounded transition-colors"
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
          <div className="p-8 text-center text-text-muted">
            <AlertCircle className="w-12 h-12 text-border-subtle mx-auto mb-3" />
            <p className="text-sm">
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
    <div className="rounded-[8px] bg-main border border-border-subtle p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-text-primary truncate">{value}</div>
    </div>
  );
}
