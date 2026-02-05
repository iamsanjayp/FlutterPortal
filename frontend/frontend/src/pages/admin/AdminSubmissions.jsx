import { useState, useEffect } from 'react';
import { Search, Code, CheckCircle, XCircle, AlertCircle, Eye, FileText } from 'lucide-react';
import { fetchSchedules, fetchSubmissions, updateSubmissionStatus, deleteSubmission, reinstateSession } from '../../api/adminApi';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    loadSubmissions(selectedScheduleId || undefined);
  }, [selectedScheduleId]);

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

  async function loadSubmissions(scheduleId) {
    try {
      setLoading(true);
      const data = await fetchSubmissions({ scheduleId, assessmentType: "TEST_CASE" });
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleViewSubmission(submission) {
    setSelectedSubmission(submission);
  }

  async function handleUpdateSubmission(submission, status) {
    try {
      await updateSubmissionStatus(submission.id, { status });
      setSubmissions(prev =>
        prev.map(item =>
          item.id === submission.id
            ? { ...item, status }
            : item
        )
      );
      setSelectedSubmission(prev =>
        prev ? { ...prev, status } : prev
      );
    } catch (err) {
      alert('Failed to update session: ' + err.message);
    }
  }

  async function handleDeleteSubmission(submission) {
    if (!confirm('Delete this submission? This will reopen the session if it is the only submission.')) {
      return;
    }

    try {
      await deleteSubmission(submission.id);
      setSelectedSubmission(null);
      loadSubmissions(selectedScheduleId || undefined);
    } catch (err) {
      alert('Failed to delete submission: ' + err.message);
    }
  }

  async function handleReinstateSession(submission) {
    if (!confirm('Reinstate the entire session? This clears all submissions for this session.')) {
      return;
    }

    try {
      await reinstateSession(submission.test_session_id);
      setSelectedSubmission(null);
      loadSubmissions(selectedScheduleId || undefined);
    } catch (err) {
      alert('Failed to reinstate session: ' + err.message);
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      sub.student_name?.toLowerCase().includes(search) ||
      sub.problem_title?.toLowerCase().includes(search) ||
      String(sub.user_id || '').includes(search) ||
      String(sub.test_session_id || '').includes(search);

    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (selectedSubmission) {
    return (
      <SubmissionDetail 
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onUpdateSubmission={handleUpdateSubmission}
        onDeleteSubmission={handleDeleteSubmission}
        onReinstateSession={handleReinstateSession}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Code Review - Coding Test</h1>
          <p className="text-sm text-gray-500 mt-1">Review latest coding test submissions and results</p>
        </div>
      </div>

      {/* Filters Bar */}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, roll no, or question..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Submissions" 
          value={submissions.length.toString()}
          icon={FileText}
          color="blue"
        />
        <StatCard 
          title="Passed" 
          value={submissions.filter(s => s.status === 'PASS').length.toString()}
          icon={CheckCircle}
          color="green"
        />
        <StatCard 
          title="Failed" 
          value={submissions.filter(s => s.status === 'FAIL').length.toString()}
          icon={XCircle}
          color="red"
        />
        <StatCard 
          title="Pending Review" 
          value={submissions.filter(s => s.status !== 'PASS' && s.status !== 'FAIL').length.toString()}
          icon={AlertCircle}
          color="yellow"
        />
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSubmissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {sub.student_name?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{sub.student_name}</div>
                      <div className="text-xs text-gray-500">ID: {sub.user_id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-800">{sub.problem_title || `Problem ${sub.problem_id}`}</div>
                  <div className="text-xs text-gray-500">ID: {sub.problem_id}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(sub.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sub.status === 'PASS'
                      ? 'bg-green-100 text-green-700'
                      : sub.status === 'FAIL'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sub.status === 'AWAITING_MANUAL' ? 'Awaiting Manual' : sub.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleViewSubmission(sub)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSubmissions.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {loading ? 'Loading submissions...' : 'No submissions found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionDetail({ submission, onClose, onUpdateSubmission, onDeleteSubmission, onReinstateSession }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Submission Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            {submission.student_name} - {submission.problem_title}
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to List
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Submitted Code */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Submitted Code
            </h3>
          </div>
          <div className="p-6">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm text-gray-800 font-mono">
                {submission.code || 'No code available'}
              </code>
            </pre>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Results</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  submission.status === 'PASS'
                    ? 'bg-green-100 text-green-700'
                    : submission.status === 'FAIL'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {submission.status === 'AWAITING_MANUAL' ? 'Awaiting Manual' : submission.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Submitted At</span>
                <span className="text-sm font-medium text-gray-800">
                  {new Date(submission.created_at).toLocaleString()}
                </span>
              </div>
              {typeof submission.score === 'number' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Score</span>
                  <span className="text-sm font-medium text-gray-800">{submission.score}%</span>
                </div>
              )}
              {typeof submission.match_percent === 'number' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Match %</span>
                  <span className="text-sm font-medium text-gray-800">{submission.match_percent}%</span>
                </div>
              )}
            </div>
          </div>

          {(submission.reference_image_url || submission.preview_image_url) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">UI Comparison</h3>
              <div className="space-y-4">
                {submission.reference_image_url && (
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Reference</div>
                    <img
                      src={`${API_ORIGIN}${submission.reference_image_url}`}
                      alt="Reference"
                      className="w-full rounded-md border border-gray-200 object-contain"
                    />
                  </div>
                )}
                {submission.preview_image_url && (
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Student Output</div>
                    <img
                      src={`${API_ORIGIN}${submission.preview_image_url}`}
                      alt="Preview"
                      className="w-full rounded-md border border-gray-200 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Manual Override</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => onUpdateSubmission(submission, "PASS")}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Passed
              </button>
              <button
                onClick={() => onUpdateSubmission(submission, "FAIL")}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Mark as Failed
              </button>
              <button
                onClick={() => onDeleteSubmission(submission)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Delete Submission
              </button>
              <button
                onClick={() => onReinstateSession(submission)}
                className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Reinstate Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
