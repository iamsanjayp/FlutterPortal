import { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Clock, User, Image as ImageIcon, FileText, Award, X, Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_BASE_ROOT } from '../../api/apiBase.js';
import { fetchSchedules } from '../../api/adminApi';

const API_BASE = API_BASE_ROOT;

export default function AdminManualGrading() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedFilePath, setSelectedFilePath] = useState('lib/main.dart');
  const [reviewTab, setReviewTab] = useState('preview');
  const [manualScore, setManualScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, graded, all
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSubmissions = submissions.filter(sub => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      sub.user_name?.toLowerCase().includes(search) ||
      sub.user_email?.toLowerCase().includes(search) ||
      sub.student_roll_no?.toLowerCase().includes(search) ||
      sub.problem_title?.toLowerCase().includes(search) ||
      sub.schedule_name?.toLowerCase().includes(search) ||
      String(sub.user_id || '').includes(search) ||
      String(sub.test_session_id || '').includes(search) ||
      String(sub.problem_id || '').includes(search);

    return matchesSearch;
  });

  function exportToExcel() {
    if (!filteredSubmissions.length) {
      alert('No submissions to export');
      return;
    }

    const exportData = filteredSubmissions.map((sub, index) => {
      const schedule = schedules.find(s => String(s.id) === String(sub.test_session_id || selectedScheduleId)) || {};
      const finalScore = sub.manual_score !== null && sub.score !== null
        ? ((sub.score * 0.5) + (sub.manual_score * 0.5)).toFixed(1)
        : (sub.score || 0);

      return {
        "S.No": index + 1,
        "Submission ID": sub.id,
        "Student Name": sub.user_name || sub.student_name || sub.user_email || 'N/A',
        "Student Email": sub.user_email || 'N/A',
        "Roll Number": sub.student_roll_no || 'N/A',
        "Test Slot": sub.schedule_name || schedule.name || `Session #${sub.test_session_id}`,
        "Problem ID": sub.problem_id,
        "Problem Title": sub.problem_title || `Problem #${sub.problem_id}`,
        "Auto Score (50%)": sub.score || 0,
        "Manual Score (50%)": sub.manual_score !== null ? sub.manual_score : 'Pending',
        "Final Score (%)": finalScore,
        "Feedback": sub.feedback || 'None',
        "Status": sub.status,
        "Submitted At": sub.created_at ? new Date(sub.created_at).toLocaleString() : sub.updated_at ? new Date(sub.updated_at).toLocaleString() : 'N/A',
        "Code Files Count": Object.keys(getSubmissionFiles(sub.code)).length
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UI Test Results");

    const slotName = selectedScheduleId
      ? (schedules.find(s => String(s.id) === String(selectedScheduleId))?.name || `Slot_${selectedScheduleId}`)
      : "All_Slots";
    const cleanSlotName = slotName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `UI_Test_Results_${cleanSlotName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  }

  function getSubmissionFiles(code) {
    if (!code) return { 'lib/main.dart': '' };
    if (typeof code === 'object' && !Array.isArray(code)) {
      return code;
    }
    if (typeof code === 'string') {
      try {
        const parsed = JSON.parse(code);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Not JSON, treat as string
      }
      return { 'lib/main.dart': code };
    }
    return { 'lib/main.dart': String(code) };
  }

  useEffect(() => {
    loadSchedules();
    loadSubmissions();
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [filter, selectedScheduleId]);

  async function loadSchedules() {
    try {
      const data = await fetchSchedules();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error('Error loading schedules:', err);
    }
  }

  async function loadSubmissions() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      if (selectedScheduleId) {
        params.set('scheduleId', selectedScheduleId);
      }

      const response = await fetch(`${API_BASE}/api/admin/submissions/ui?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load submissions');
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function submitManualGrade() {
    if (!selectedSubmission || manualScore === '') return;

    const score = parseInt(manualScore);
    if (isNaN(score) || score < 0 || score > 100) {
      alert('Please enter a valid score between 0 and 100');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/submissions/${selectedSubmission.id}/manual-grade`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            manualScore: score,
            feedback: feedback.trim(),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to submit grade');

      alert('Manual grade submitted successfully!');
      setSelectedSubmission(null);
      setManualScore('');
      setFeedback('');
      loadSubmissions();
    } catch (err) {
      console.error('Error submitting grade:', err);
      alert('Failed to submit grade');
    } finally {
      setSubmitting(false);
    }
  }

  function getFinalScore(sub) {
    if (sub.manual_score !== null && sub.score !== null) {
      return ((sub.score * 0.5) + (sub.manual_score * 0.5)).toFixed(1);
    }
    return '-';
  }

  function renderPreview(url, title) {
    if (!url) return null;

    return (
      <iframe
        src={`${API_BASE}${url}`}
        title={title}
        className="w-full h-[620px] rounded-md border border-gray-200 bg-white"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Code Review - UI Test</h2>
        <p className="text-sm text-gray-600">
          Review and manually grade UI test submissions. Each submission receives 50% automated + 50% manual grading.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock className="inline-block w-4 h-4 mr-1" />
              Pending Grading
            </button>
            <button
              onClick={() => setFilter('graded')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'graded'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="inline-block w-4 h-4 mr-1" />
              Graded
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Submissions
            </button>
          </div>

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

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll no, email, slot name, or problem title..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading submissions...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No submissions found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-800">
                        {sub.user_name || sub.user_email}
                      </span>
                      <span className="text-sm text-gray-500">
                        Session #{sub.test_session_id}
                      </span>
                      <span className="text-sm text-gray-500">
                        Problem #{sub.problem_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-medium ${
                        sub.status === 'PASS'
                          ? 'text-green-600'
                          : sub.status === 'FAIL'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}>
                        Auto: {sub.status === 'AWAITING_MANUAL' ? 'Awaiting manual grade' : sub.status} ({sub.score || 0}%)
                      </span>
                      {sub.manual_score !== null ? (
                        <>
                          <span className="text-blue-600 font-medium">
                            Manual: {sub.manual_score}%
                          </span>
                          <span className="text-purple-600 font-bold">
                            Final: {getFinalScore(sub)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          <Clock className="inline-block w-3 h-3 mr-1" />
                          Awaiting Manual Grade
                        </span>
                      )}
                      <span className="text-gray-400">
                        {new Date(sub.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSubmission(sub);
                      const files = getSubmissionFiles(sub.code);
                      setSelectedFilePath(Object.keys(files)[0] || 'lib/main.dart');
                      setManualScore(sub.manual_score?.toString() || '');
                      setFeedback(sub.manual_feedback || '');
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {sub.manual_score !== null ? 'Review' : 'Grade'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-800">
                    Submission Review #{selectedSubmission.id}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedSubmission.status === 'PASS'
                      ? 'bg-emerald-100 text-emerald-700'
                      : selectedSubmission.status === 'FAIL'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedSubmission.status === 'AWAITING_MANUAL' ? 'Awaiting Manual Grade' : selectedSubmission.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-600 bg-white px-3 py-0.5 rounded-full border border-gray-300">
                    Automated Score: <span className="text-blue-600 font-bold">{selectedSubmission.score || 0}%</span> (50% wt)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Student: <span className="font-semibold text-gray-700">{selectedSubmission.user_name || selectedSubmission.user_email}</span> | Problem #{selectedSubmission.problem_id} | Submitted: {new Date(selectedSubmission.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => { setSelectedSubmission(null); setManualScore(''); setFeedback(''); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split Screen */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_380px] overflow-hidden">
              {/* Left Column: Tabbed Workspace */}
              <div className="flex flex-col min-h-0 border-r border-gray-200 bg-gray-50/50">
                {/* Tab Bar */}
                <div className="px-6 py-2.5 bg-white border-b border-gray-200 flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setReviewTab("preview")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      reviewTab === "preview"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Live Preview & Mockup
                  </button>
                  <button
                    onClick={() => setReviewTab("code")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      reviewTab === "code"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Student Code ({Object.keys(getSubmissionFiles(selectedSubmission.code)).length} files)
                  </button>
                  <button
                    onClick={() => setReviewTab("logs")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      reviewTab === "logs"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Execution Logs & Console
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-6">
                  {reviewTab === "preview" && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
                      {/* Design Mockup */}
                      <div className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700 uppercase tracking-wider flex items-center justify-between">
                          <span>Design Mockup (Reference)</span>
                          <span className="text-gray-400 font-normal">Target UI</span>
                        </div>
                        <div className="flex-1 p-4 flex items-center justify-center bg-gray-100/50 overflow-auto min-h-[350px]">
                          {(selectedSubmission.referenceMockupUrl || selectedSubmission.reference_image_url) ? (
                            <img
                              src={`${API_BASE}${selectedSubmission.referenceMockupUrl || selectedSubmission.reference_image_url}`}
                              alt="Design Mockup"
                              className="max-h-full max-w-full object-contain rounded border border-gray-300 shadow-sm"
                            />
                          ) : (
                            <div className="text-gray-400 text-sm">No reference mockup provided</div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Live Preview */}
                      <div className="flex flex-col bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-2.5 bg-blue-50/50 border-b border-blue-200 font-semibold text-xs text-blue-800 uppercase tracking-wider flex items-center justify-between">
                          <span>Student Live Preview</span>
                          <span className="text-blue-600 font-normal">Interactive Web App</span>
                        </div>
                        <div className="flex-1 p-4 flex items-center justify-center bg-gray-100/50 overflow-auto min-h-[350px]">
                          {(selectedSubmission.previewUrl || selectedSubmission.preview_image_url) ? (
                            renderPreview(selectedSubmission.previewUrl || selectedSubmission.preview_image_url, "Interactive Live Preview")
                          ) : (
                            <div className="text-gray-400 text-sm">No live preview generated</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {reviewTab === "code" && (
                    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      {(() => {
                        const files = getSubmissionFiles(selectedSubmission.code);
                        const fileKeys = Object.keys(files);
                        const currentPath = fileKeys.includes(selectedFilePath) ? selectedFilePath : fileKeys[0] || 'lib/main.dart';
                        return (
                          <>
                            <div className="bg-slate-100 px-4 py-2.5 flex items-center gap-2 overflow-x-auto border-b border-slate-200 shrink-0">
                              {fileKeys.map((path) => (
                                <button
                                  key={path}
                                  onClick={() => setSelectedFilePath(path)}
                                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition shrink-0 ${
                                    currentPath === path
                                      ? 'bg-blue-600 text-white shadow'
                                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                                  }`}
                                >
                                  {path}
                                </button>
                              ))}
                            </div>
                            <div className="flex-1 min-h-0 overflow-auto bg-slate-50 p-4">
                              <pre className="text-slate-800 text-sm font-mono whitespace-pre font-normal leading-relaxed">
                                {files[currentPath] || ''}
                              </pre>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {reviewTab === "logs" && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-blue-600" />
                          Execution Run Metadata
                        </h4>
                        {selectedSubmission.execution_run_id ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <div className="text-xs uppercase text-gray-400 mb-1 font-semibold">Run ID</div>
                              <div className="font-mono text-xs break-all text-gray-700">{selectedSubmission.execution_run_id}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <div className="text-xs uppercase text-gray-400 mb-1 font-semibold">Status</div>
                              <div className="font-semibold text-gray-800">{selectedSubmission.execution_run_status || '-'}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <div className="text-xs uppercase text-gray-400 mb-1 font-semibold">Started At</div>
                              <div className="text-xs text-gray-700">{selectedSubmission.execution_started_at ? new Date(selectedSubmission.execution_started_at).toLocaleTimeString() : '-'}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <div className="text-xs uppercase text-gray-400 mb-1 font-semibold">Finished At</div>
                              <div className="text-xs text-gray-700">{selectedSubmission.execution_finished_at ? new Date(selectedSubmission.execution_finished_at).toLocaleTimeString() : 'Live / pending'}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">No execution record found for this submission.</div>
                        )}
                      </div>

                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          Console Output / Error Trace
                        </h4>
                        <pre className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800 font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap break-words shadow-inner">
                          {selectedSubmission.execution_result_json || 'No console output recorded.'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Dedicated Manual Grading Workstation */}
              <div className="flex flex-col min-h-0 bg-white p-6 overflow-y-auto border-l border-gray-200 shadow-lg justify-between">
                <div className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
                      <Award className="w-3.5 h-3.5" />
                      Teacher Evaluation
                    </div>
                    <h4 className="text-lg font-bold text-gray-800">Manual Grading</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Assess code quality, UI accuracy, and architecture. This contributes 50% to the student's final score.
                    </p>
                  </div>

                  {/* Score Breakdown Box */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Automated Score (50%):</span>
                      <span className="font-bold text-gray-800">{selectedSubmission.score || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Manual Score (50%):</span>
                      <span className="font-bold text-blue-600">{manualScore !== '' ? `${manualScore}%` : 'Pending'}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-800">Estimated Total:</span>
                      <span className="text-lg font-black text-indigo-600">
                        {manualScore !== '' ? `${Math.round((Number(selectedSubmission.score || 0) * 0.5) + (Number(manualScore) * 0.5))}%` : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Manual Score Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Manual Score <span className="text-xs font-normal text-gray-400">(0 to 100)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={manualScore}
                      onChange={(e) => setManualScore(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-gray-800 transition"
                      placeholder="e.g. 85"
                    />
                  </div>

                  {/* Feedback Textarea */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Teacher Feedback <span className="text-xs font-normal text-gray-400">(Optional)</span>
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 transition resize-none"
                      placeholder="Provide constructive feedback on widget structure, clean code practices, or styling accuracy..."
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-gray-200 space-y-3 mt-6">
                  <button
                    onClick={submitManualGrade}
                    disabled={manualScore === '' || submitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {submitting ? 'Submitting...' : 'Submit Final Grade'}
                  </button>
                  <button
                    onClick={() => { setSelectedSubmission(null); setManualScore(''); setFeedback(''); }}
                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm"
                  >
                    Cancel / Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
