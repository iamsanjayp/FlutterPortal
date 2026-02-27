
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Code, CheckCircle, XCircle, AlertCircle, Eye, FileText, Play, Gavel, ChevronLeft, Calendar, Monitor } from 'lucide-react';
import { fetchSchedules, fetchSubmissions, updateSubmissionStatus, fetchRNSubmissions, runRNSubmission, updateRNSubmissionStatus, gradeSubmission } from '../../api/adminApi';

export default function AdminSubmissions({ useRN = true, useStaffApi = false, staffApi }) {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isGrading, setIsGrading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [selectedDate, useRN, selectedScheduleId]); // Reload when date changes

  // Sync state with URL
  useEffect(() => {
    const subId = searchParams.get('submissionId');
    const mode = searchParams.get('mode'); // 'view' or 'grade'

    if (subId && submissions.length > 0) {
      const sub = submissions.find(s => s.id.toString() === subId);
      if (sub) {
        setSelectedSubmission(sub);
        setIsGrading(mode === 'grade');
      }
    } else if (!subId) {
      setSelectedSubmission(null);
      setIsGrading(false);
    }
  }, [searchParams, submissions]);

  async function loadSchedules() {
    try {
      const data = await fetchSchedules();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  }

  async function loadSubmissions() {
    try {
      setLoading(true);
      if (useRN) {
        // Pass date filter to API
        const data = useStaffApi
          ? await staffApi.fetchRNSubmissions({ date: selectedDate })
          : await fetchRNSubmissions({ date: selectedDate });
        setSubmissions(data.submissions || []);
      } else {
        const data = await fetchSubmissions({ scheduleId: selectedScheduleId });
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleViewSubmission(submission) {
    setSearchParams({ submissionId: submission.id, mode: 'view' });
    setRunResult(null);
  }

  function handleOpenGrading(submission) {
    setSearchParams({ submissionId: submission.id, mode: 'grade' });
    setRunResult(null);
  }

  function handleCloseDetail() {
    setSearchParams({});
    setRunResult(null);
  }

  async function handleUpdateSubmission(submission, status) {
    try {
      if (useRN) {
        if (useStaffApi) {
          await staffApi.updateRNSubmissionStatus(submission.id, { status });
        } else {
          await updateRNSubmissionStatus(submission.id, { status });
        }
      } else {
        await updateSubmissionStatus(submission.id, { status });
      }
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

  async function handleRun(submission) {
    try {
      setRunResult({ loading: true });
      const data = useStaffApi ? await staffApi.runRNSubmission(submission.id) : await runRNSubmission(submission.id);
      setRunResult({ loading: false, data });
    } catch (err) {
      setRunResult({ loading: false, error: err.message });
    }
  }

  async function handleSubmitGrade(submissionId, manualScore, feedback) {
    try {
      const res = await gradeSubmission(submissionId, { manualScore: Number(manualScore), feedback });
      // Update local state
      setSubmissions(prev =>
        prev.map(item =>
          item.id === submissionId
            ? { ...item, status: res.status, score: res.autoScore, manual_score: manualScore, final_score: res.finalScore }
            : item
        )
      );
      setSelectedSubmission(prev => ({
        ...prev,
        status: res.status,
        score: res.autoScore,
        manual_score: manualScore,
        final_score: res.finalScore,
        manual_feedback: feedback
      }));
      alert(`Grading Saved! Final Score: ${res.finalScore} (${res.status})`);
      // setIsGrading(false); 
    } catch (err) {
      alert('Grading failed: ' + err.message);
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
    if (isGrading) {
      return (
        <GradingView
          submission={selectedSubmission}
          onClose={handleCloseDetail}
          onRun={() => handleRun(selectedSubmission)}
          runResult={runResult}
          onSubmitGrade={handleSubmitGrade}
        />
      );
    }
    return (
      <SubmissionDetail
        submission={selectedSubmission}
        onClose={handleCloseDetail}
        onUpdateSubmission={handleUpdateSubmission}
        onRun={useRN ? handleRun : null}
        runResult={runResult}
        onGrade={() => handleOpenGrading(selectedSubmission)}
      />
    );
  }

  return (
    <div className="space-y-[24px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary tracking-tight">Submissions & Review</h1>
          <p className="text-sm text-text-muted mt-1">Review all student submissions and test results</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[16px]">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="w-full sm:w-auto px-4 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
          >
            <option value="">All Slots</option>
            {schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.name} ({new Date(schedule.start_at).toLocaleDateString()})
              </option>
            ))}
          </select>
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, roll no, or question..."
              className="w-full pl-9 pr-4 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-4 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
          >
            <option value="all">All Status</option>
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto px-4 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total"
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
          value={submissions.filter(s => s.status === 'FAIL' || s.status === 'FAILED').length.toString()}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Pending"
          value={submissions.filter(s => s.status !== 'PASS' && s.status !== 'FAIL' && s.status !== 'FAILED').length.toString()}
          icon={AlertCircle}
          color="yellow"
        />
      </div>

      {/* Submissions Table */}
      <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-main border-b border-border-subtle">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Student</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Question</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Score</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filteredSubmissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-main/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-accent-soft flex items-center justify-center shrink-0 border border-border-subtle">
                      <span className="text-accent text-sm font-bold">
                        {sub.student_name?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{sub.student_name}</div>
                      <div className="text-[11px] text-text-muted truncate">{sub.student_email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-text-primary">{sub.problem_title}</div>
                  <div className="text-[11px] text-text-muted mt-1">Level: {sub.level}</div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-text-primary">
                  {sub.final_score !== undefined && sub.final_score !== null ? (
                    <span>{sub.final_score}%</span>
                  ) : (
                    <span className="text-text-muted/50">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sub.status === 'PASS' ? 'bg-success-soft text-success outline outline-1 outline-success/20'
                    : (sub.status === 'FAIL' || sub.status === 'FAILED') ? 'bg-danger-soft text-danger outline outline-1 outline-danger/20'
                      : 'bg-warning-soft text-warning outline outline-1 outline-warning/20'
                    }`}>
                    {sub.status === 'FAILED' ? 'FAIL' : sub.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleViewSubmission(sub)}
                      className="p-1.5 text-text-muted hover:text-text-primary hover:bg-main rounded-md transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenGrading(sub)}
                      className="px-3 h-[28px] bg-accent text-white text-[11px] font-bold uppercase tracking-wider rounded-md hover:bg-accent/90 flex items-center gap-1.5 transition-colors"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      Grade
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GradingView({ submission, onClose, onRun, runResult, onSubmitGrade }) {
  const [manualScore, setManualScore] = useState(submission.manual_score || '');
  const [feedback, setFeedback] = useState(submission.manual_feedback || '');
  const [parsedFiles, setParsedFiles] = useState(null);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'question' | 'testresults'
  const [gradeSubmitting, setGradeSubmitting] = useState(false);

  const autoScore = submission.score || 0;
  const mScore = Number(manualScore) || 0;
  const finalPreview = Math.round((autoScore * 0.5) + (mScore * 0.5));

  // Parse test results
  let testResults = [];
  try {
    if (submission.test_results) {
      const parsed = typeof submission.test_results === 'string' ? JSON.parse(submission.test_results) : submission.test_results;
      testResults = Array.isArray(parsed) ? parsed : parsed.results || [];
    }
  } catch { }

  const passedTests = testResults.filter(t => t.passed || t.status === 'passed').length;
  const totalTests = testResults.length;

  useEffect(() => {
    try {
      if (submission.code) {
        const parsed = JSON.parse(submission.code);
        if (typeof parsed === 'object' && parsed !== null) {
          setParsedFiles(parsed);
        } else {
          setParsedFiles({ 'App.js': submission.code });
        }
      } else {
        setParsedFiles({ 'App.js': '// No code available' });
      }
    } catch (e) {
      setParsedFiles({ 'App.js': submission.code || '// No code available' });
    }
  }, [submission.code]);

  async function handleGradeSubmit() {
    setGradeSubmitting(true);
    try {
      await onSubmitGrade(submission.id, manualScore, feedback);
    } finally {
      setGradeSubmitting(false);
    }
  }

  const statusConfig = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending Review' },
    graded: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Graded' },
    passed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Passed' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Failed' },
  };
  const sts = statusConfig[submission.status] || statusConfig.pending;

  return (
    <div className="flex flex-col h-[calc(100vh-[100px])] gap-[24px]">
      {/* ──── Header ──── */}
      <div className="flex items-center justify-between shrink-0 bg-surface px-6 py-4 rounded-[10px] border border-border-subtle shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 -ml-2 text-text-muted hover:text-text-primary hover:bg-main rounded-[6px] transition-colors mr-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">{submission.problem_title}</h1>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sts.bg} ${sts.text} ${sts.border} border`}>
                {sts.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-1 font-medium">
              <span className="text-text-primary bg-main border border-border-subtle px-2 py-0.5 rounded-md">{submission.student_name}</span>
              <span className="text-border-subtle">•</span>
              <span>{submission.student_email}</span>
              {(submission.level || submission.problem_type) && <span className="text-border-subtle">•</span>}
              {submission.level && <span className="text-accent font-bold">Level {submission.level}</span>}
              {submission.problem_type && <span className="text-purple-500 font-bold">{submission.problem_type}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right mr-2 hidden sm:block">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Submitted</p>
            <p className="text-sm font-semibold text-text-primary">{new Date(submission.submitted_at).toLocaleString()}</p>
          </div>
          <button
            onClick={handleGradeSubmit}
            disabled={gradeSubmitting}
            className="px-6 h-[40px] bg-accent text-white rounded-[8px] hover:bg-accent/90 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50"
          >
            {gradeSubmitting ? (
              <><div className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" /> Saving...</>
            ) : (
              <><Gavel className="w-4 h-4" /> Submit Grade</>
            )}
          </button>
        </div>
      </div>

      {/* ──── Main Layout (2 Columns) ──── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-[24px] min-h-0">

        {/* ─── LEFT COLUMN: Code & Preview (60%) ─── */}
        <div className="lg:col-span-3 flex flex-col gap-[24px] min-h-0">

          {/* Top Half: Code Editor */}
          <div className="flex-1 bg-surface rounded-[10px] border border-border-subtle shadow-sm flex flex-col overflow-hidden relative">
            <div className="flex justify-between items-center px-4 h-[44px] bg-main border-b border-border-subtle z-10">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-accent" /> Source Code
              </h3>
              {totalTests > 0 && (
                <div className="flex items-center gap-2 bg-surface px-3 py-1 rounded-full border border-border-subtle shadow-sm">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Auto Tests:</span>
                  <span className={`text-[11px] font-black ${passedTests === totalTests ? 'text-success' : 'text-warning'}`}>{passedTests}/{totalTests}</span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              {parsedFiles ? (
                <MultiFileEditor files={parsedFiles} onChange={() => { }} readOnly={true} />
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted bg-main text-sm">No code found</div>
              )}
            </div>
          </div>

          {/* Bottom Half: Preview & Run Context */}
          <div className="h-[600px] shrink-0 bg-surface rounded-[10px] border border-border-subtle shadow-sm flex overflow-hidden">
            {/* Run Actions Column */}
            <div className="w-[180px] shrink-0 bg-main border-r border-border-subtle p-6 flex flex-col justify-center items-center relative">
              <div className="w-16 h-16 bg-surface rounded-[10px] border border-border-subtle shadow-sm flex items-center justify-center mb-4">
                <Play className={`w-8 h-8 ${runResult?.loading ? 'text-border-subtle animate-pulse' : 'text-accent ml-1'}`} />
              </div>
              <button
                onClick={() => onRun(submission)}
                disabled={runResult?.loading}
                className="w-full h-[36px] bg-surface border border-border-subtle text-text-primary rounded-[8px] hover:bg-main transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {runResult?.loading ? 'Building...' : 'Preview App'}
              </button>
            </div>
            {/* Emulator Space */}
            <div className="flex-1 bg-gray-50 flex items-center justify-center relative inner-shadow">
              {!runResult ? (
                <p className="text-text-muted font-medium text-sm flex items-center gap-2">
                  <Monitor className="w-4 h-4" /> Ready for preview
                </p>
              ) : (
                <RNEmulator embedUrl={null} html={runResult?.data?.html} loading={runResult?.loading} error={runResult?.error} output={null} initialScale={0.65} />
              )}
            </div>
          </div>

        </div>

        {/* ─── RIGHT COLUMN: Grading & Feedback (40%) ─── */}
        <div className="lg:col-span-2 flex flex-col gap-[24px] min-h-0 overflow-y-auto pr-1 pb-4">

          {/* Scoring Panel */}
          <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm overflow-hidden flex flex-col shrink-0">
            <div className="bg-main px-5 h-[44px] border-b border-border-subtle flex items-center gap-2">
              <div className="w-6 h-6 bg-accent-soft rounded flex items-center justify-center border border-accent/20">
                <Gavel className="w-3.5 h-3.5 text-accent" />
              </div>
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Assessment</h3>
            </div>

            <div className="p-[24px] space-y-6 flex flex-col justify-center">
              {/* Auto Score Circle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-text-primary mb-1">Automated Score</h4>
                  <p className="text-[11px] text-text-muted uppercase tracking-wider">Based on {totalTests} specific tests</p>
                </div>
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-border-subtle" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={autoScore >= 50 ? "var(--success)" : "var(--warning)"} strokeWidth="3" strokeDasharray={`${autoScore}, 100`} />
                  </svg>
                  <span className="absolute text-sm font-black text-text-primary">{autoScore}</span>
                </div>
              </div>

              <div className="w-full h-px bg-border-subtle" />

              {/* Manual Score */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-text-primary">Manual Score</h4>
                  <div className="bg-main px-3 py-1 rounded-[8px] border border-border-subtle font-black text-xl text-text-primary w-20 text-center">
                    {manualScore}
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={manualScore}
                  onChange={e => setManualScore(e.target.value)}
                  className="w-full h-2 bg-main border border-border-subtle rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between mt-2">
                  {[0, 25, 50, 75, 100].map(s => (
                    <button
                      key={s}
                      onClick={() => setManualScore(s)}
                      className="text-[10px] font-bold text-text-muted hover:text-accent focus:outline-none transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Final Calculated Result */}
              <div className={`mt-2 p-4 rounded-[10px] border outline outline-1 flex items-center justify-between ${finalPreview >= 50 ? 'bg-success-soft border-success/20 outline-success/10' : 'bg-danger-soft border-danger/20 outline-danger/10'}`}>
                <div>
                  <h4 className={`text-sm font-black uppercase tracking-wider ${finalPreview >= 50 ? 'text-success' : 'text-danger'}`}>
                    Final Grade
                  </h4>
                  <p className={`text-[10px] font-medium mt-0.5 ${finalPreview >= 50 ? 'text-success/70' : 'text-danger/70'}`}>
                    Auto + Manual average
                  </p>
                </div>
                <div className={`text-3xl font-black ${finalPreview >= 50 ? 'text-success' : 'text-danger'}`}>
                  {finalPreview}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Panel */}
          <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm overflow-hidden flex flex-col shrink-0">
            <div className="bg-main px-5 h-[44px] border-b border-border-subtle flex justify-between items-center">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" /> Constructive Feedback
              </h3>
            </div>
            <div className="p-[24px] flex flex-col gap-4">
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="w-full min-h-[140px] bg-main border border-border-subtle text-text-primary rounded-[10px] p-4 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none resize-none transition-all placeholder:text-text-muted/50"
                placeholder="Break down your assessment for the student here. Focus on code structure, logic, and areas of improvement..."
              />
              <div className="flex flex-wrap gap-2">
                {['Great architecture 🏆', 'Needs robust error handling ⚠️', 'UI differs from spec 🎨', 'Clean code ✨'].map(q => (
                  <button
                    key={q}
                    onClick={() => setFeedback(prev => prev ? `${prev}\n- ${q}` : `- ${q}`)}
                    className="text-[11px] font-bold uppercase tracking-wider px-2.5 h-[28px] rounded-md bg-main border border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

import MultiFileEditor from '../../components/MultiFileEditor';
import RNEmulator from '../../components/RNEmulator';

function SubmissionDetail({ submission, onClose, onUpdateSubmission, onRun, runResult, onGrade }) {
  const [parsedFiles, setParsedFiles] = useState(null);

  useEffect(() => {
    try {
      if (submission.code) {
        const parsed = JSON.parse(submission.code);
        if (typeof parsed === 'object' && parsed !== null) {
          setParsedFiles(parsed);
        } else {
          setParsedFiles({ 'App.js': submission.code });
        }
      } else {
        setParsedFiles({ 'App.js': '// No code available' });
      }
    } catch (e) {
      setParsedFiles({ 'App.js': submission.code || '// No code available' });
    }
  }, [submission.code]);

  return (
    <div className="flex flex-col h-[calc(100vh-[100px])] gap-[24px]">
      {/* Header Section */}
      <div className="flex items-center justify-between shrink-0 bg-surface px-6 py-4 rounded-[10px] border border-border-subtle shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent-soft rounded-[8px] border border-accent/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              {submission.problem_title}
              <span className="bg-main text-text-muted px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border border-border-subtle">Level {submission.level}</span>
            </h1>
            <div className="flex items-center gap-3 text-xs text-text-muted mt-1 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-border-subtle"></span>{submission.student_name}</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-border-subtle"></span>{submission.student_email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${submission.status === 'PASS' ? 'bg-success-soft text-success border-success/20' :
            submission.status === 'FAIL' ? 'bg-danger-soft text-danger border-danger/20' : 'bg-warning-soft text-warning border-warning/20'
            }`}>
            {submission.status === 'PASS' ? <CheckCircle className="w-4 h-4" /> :
              submission.status === 'FAIL' ? <XCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {submission.status}
          </div>
          <div className="h-8 w-px bg-border-subtle mx-1"></div>
          <button
            onClick={onGrade}
            className="px-6 h-[40px] bg-accent text-white rounded-[8px] hover:bg-accent/90 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm"
          >
            <Gavel className="w-4 h-4" /> Grade
          </button>
          <button
            onClick={onClose}
            className="px-6 h-[40px] bg-main border border-border-subtle text-text-primary rounded-[8px] hover:bg-surface transition-colors text-xs font-bold uppercase tracking-wider"
          >
            Back
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-[24px] min-h-0">

        {/* Left: Code Editor (Read Only) */}
        <div className="lg:col-span-3 bg-surface rounded-[10px] border border-border-subtle shadow-sm flex flex-col overflow-hidden relative">
          <div className="flex items-center justify-between px-4 h-[44px] bg-main border-b border-border-subtle">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-accent" /> Source Code
            </span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider bg-surface border border-border-subtle px-2 py-1 rounded">Read Only</span>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {parsedFiles ? (
              <MultiFileEditor
                files={parsedFiles}
                onChange={() => { }}
                readOnly={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-sm bg-main">No code loaded</div>
            )}
          </div>
        </div>

        {/* Right: Preview & Details */}
        <div className="lg:col-span-2 flex flex-col gap-[24px] min-h-0 overflow-y-auto pr-1 pb-4">

          {/* Top Right: Preview (Flexible Height) */}
          <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm flex flex-col shrink-0 min-h-[500px] overflow-hidden">
            <div className="px-4 h-[44px] border-b border-border-subtle flex justify-between items-center bg-main">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-500" /> Live Preview
              </span>
              <button
                onClick={() => onRun(submission)}
                disabled={runResult?.loading}
                className="text-[10px] font-bold uppercase tracking-wider bg-surface text-text-primary border border-border-subtle px-3 h-[28px] rounded hover:bg-main transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {runResult?.loading ? (
                  <><div className="animate-spin w-3 h-3 border border-text-muted border-t-transparent rounded-full"></div> Building...</>
                ) : (
                  <><Play className="w-3 h-3 fill-current" /> Run Preview</>
                )}
              </button>
            </div>

            <div className="flex-1 bg-gray-50 flex items-center justify-center relative overflow-hidden group border-t border-transparent">
              {!runResult ? (
                <div className="text-center p-8">
                  <div className="w-12 h-12 bg-main border border-border-subtle rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Play className="w-6 h-6 text-border-subtle ml-1" />
                  </div>
                  <p className="text-text-primary text-sm font-semibold">Ready to compile</p>
                  <p className="text-text-muted text-xs mt-1">Click "Run Preview" to build the app</p>
                </div>
              ) : (
                <RNEmulator
                  embedUrl={null}
                  html={runResult?.data?.html}
                  loading={runResult?.loading}
                  error={runResult?.error}
                  output={null}
                />
              )}
            </div>
          </div>

          {/* Bottom Right: Grading Results */}
          <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm flex flex-col shrink-0 min-h-[300px] overflow-hidden">
            <div className="px-5 h-[44px] border-b border-border-subtle bg-main flex items-center">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" /> Grading Results
              </span>
            </div>

            <div className="p-[24px] flex flex-col h-full bg-surface">
              <div className="grid grid-cols-2 gap-[24px] mb-[24px]">
                <div className="bg-accent-soft p-4 rounded-[10px] border border-accent/20 text-center relative overflow-hidden">
                  <div className="text-[10px] text-accent font-bold uppercase tracking-wider mb-1">Final Score</div>
                  <div className="text-3xl font-black text-accent">{submission.final_score !== null ? submission.final_score : '-'}%</div>
                  <div className="absolute top-0 right-0 p-1 opacity-10">
                    <Gavel className="w-12 h-12 text-accent" />
                  </div>
                </div>
                <div className="bg-main p-4 rounded-[10px] border border-border-subtle text-center flex flex-col justify-center">
                  <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2">Breakdown</div>
                  <div className="flex justify-between items-center text-xs font-semibold px-2">
                    <span className="text-text-muted">Auto</span>
                    <span className="font-bold text-text-primary">{submission.score || 0}</span>
                  </div>
                  <div className="w-full h-px bg-border-subtle my-2"></div>
                  <div className="flex justify-between items-center text-xs font-semibold px-2">
                    <span className="text-text-muted">Manual</span>
                    <span className="font-bold text-text-primary">{submission.manual_score !== null ? submission.manual_score : '-'}%</span>
                  </div>
                </div>
              </div>

              {submission.manual_feedback ? (
                <div className="flex-1 bg-warning-soft p-4 rounded-[10px] border border-warning/20 text-sm overflow-y-auto">
                  <strong className="text-warning block mb-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Grader Feedback
                  </strong>
                  <p className="text-text-primary font-medium leading-relaxed text-xs">{submission.manual_feedback}</p>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-text-muted text-[11px] font-bold uppercase tracking-wider bg-main rounded-[10px] border border-border-subtle border-dashed">
                  No feedback provided
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-accent-soft text-accent',
    green: 'bg-success-soft text-success',
    red: 'bg-danger-soft text-danger',
    yellow: 'bg-warning-soft text-warning',
  };

  return (
    <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[24px]">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-[10px] ${colorClasses[color]} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider mb-2">{title}</p>
      <p className="text-3xl font-bold text-text-primary">{value}</p>
    </div>
  );
}
