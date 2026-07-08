import { useState, useEffect } from 'react';
import { Search, Code, CheckCircle, XCircle, AlertCircle, Eye, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchSchedules, fetchSubmissions, updateSubmissionStatus, deleteSubmission, reinstateSession } from '../../api/adminApi';
import { API_BASE_ROOT } from '../../api/apiBase.js';

const API_ORIGIN = API_BASE_ROOT;

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
      sub.user_email?.toLowerCase().includes(search) ||
      sub.student_roll_no?.toLowerCase().includes(search) ||
      sub.problem_title?.toLowerCase().includes(search) ||
      sub.schedule_name?.toLowerCase().includes(search) ||
      String(sub.user_id || '').includes(search) ||
      String(sub.test_session_id || '').includes(search);

    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  function exportToExcel() {
    if (!filteredSubmissions.length) {
      alert('No submissions to export');
      return;
    }

    const exportData = filteredSubmissions.map((sub, index) => {
      const schedule = schedules.find(s => String(s.id) === String(sub.test_session_id || selectedScheduleId)) || {};
      return {
        "S.No": index + 1,
        "Submission ID": sub.id,
        "Student Name": sub.student_name || sub.user_name || sub.user_email || 'N/A',
        "Student Email": sub.user_email || 'N/A',
        "Roll Number": sub.student_roll_no || 'N/A',
        "Test Slot": sub.schedule_name || schedule.name || `Session #${sub.test_session_id}`,
        "Problem ID": sub.problem_id,
        "Problem Title": sub.problem_title || `Problem #${sub.problem_id}`,
        "Status": sub.status,
        "Score (%)": sub.score || 0,
        "Match Percent (%)": sub.match_percent || sub.score || 0,
        "Submitted At": sub.created_at ? new Date(sub.created_at).toLocaleString() : sub.updated_at ? new Date(sub.updated_at).toLocaleString() : 'N/A',
        "Code Length (Chars)": sub.code ? String(sub.code).length : 0
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Coding Test Results");

    const slotName = selectedScheduleId
      ? (schedules.find(s => String(s.id) === String(selectedScheduleId))?.name || `Slot_${selectedScheduleId}`)
      : "All_Slots";
    const cleanSlotName = slotName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Coding_Test_Results_${cleanSlotName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  }

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
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
            title="Export filtered slot results to Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span className="whitespace-nowrap">Export XLSX</span>
          </button>
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
  function renderPreview(url, title) {
    if (!url) return null;

    return (
      <iframe
        src={`${API_ORIGIN}${url}`}
        title={title}
        className="w-full h-[620px] rounded-md border border-gray-200 bg-white"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
      />
    );
  }

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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Execution Run</h3>
            {submission.execution_run_id ? (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-600">Run ID</span>
                  <span className="font-medium break-all text-right">{submission.execution_run_id}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium">{submission.execution_run_status || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-600">Started</span>
                  <span className="font-medium text-right">
                    {submission.execution_started_at ? new Date(submission.execution_started_at).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-600">Finished</span>
                  <span className="font-medium text-right">
                    {submission.execution_finished_at ? new Date(submission.execution_finished_at).toLocaleString() : 'Live / pending'}
                  </span>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-400 mb-2">Result</div>
                  <pre className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-xs whitespace-pre-wrap break-words max-h-56 overflow-y-auto">
                    {submission.execution_result_json || 'No execution result recorded.'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No execution run recorded for this submission.</div>
            )}
          </div>

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
              {(typeof submission.widgetScore === 'number' || typeof submission.match_percent === 'number') && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Widget Score</span>
                  <span className="text-sm font-medium text-gray-800">{submission.widgetScore ?? submission.match_percent}%</span>
                </div>
              )}
            </div>
          </div>

          {(submission.referenceMockupUrl || submission.reference_image_url || submission.previewUrl || submission.preview_image_url) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Interactive UI Evaluation</h3>
              <div className="space-y-4">
                {(submission.referenceMockupUrl || submission.reference_image_url) && (
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Design Mockup (Reference)</div>
                    <img
                      src={`${API_ORIGIN}${submission.referenceMockupUrl || submission.reference_image_url}`}
                      alt="Design Mockup"
                      className="w-full rounded-md border border-gray-200 object-contain"
                    />
                  </div>
                )}
                {(submission.previewUrl || submission.preview_image_url) && (
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Interactive Live Preview</div>
                    {renderPreview(submission.previewUrl || submission.preview_image_url, "Interactive Live Preview")}
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
