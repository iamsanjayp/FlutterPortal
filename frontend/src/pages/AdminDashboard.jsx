import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminMetrics,
  fetchSchedules,
  createSchedule,
  updateSchedule,
  resetQuestions,
  updateSessionDuration,
  updateSessionResult,
  fetchSubmissions,
  fetchStudents,
  updateStudentStatus,
  fetchStudentSessions,
  fetchProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  fetchTestCases,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from "../api/adminApi";

export default function AdminDashboard({ onLogout }) {
  const [metrics, setMetrics] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    startAt: "",
    endAt: "",
    durationMinutes: "",
    isActive: false,
  });
  const [selectedScheduleId, setSelectedScheduleId] = useState("");

  const [studentQuery, setStudentQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSessions, setStudentSessions] = useState([]);

  const [resetSessionIds, setResetSessionIds] = useState("");
  const [resetUserIds, setResetUserIds] = useState("");
  const [durationSessionId, setDurationSessionId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");

  const [submissionFilters, setSubmissionFilters] = useState({
    sessionId: "",
    studentId: "",
  });
  const [submissions, setSubmissions] = useState([]);

  const [problems, setProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [problemForm, setProblemForm] = useState({
    level: "1A",
    title: "",
    description: "",
    starterCode: "",
    isActive: true,
  });
  const [testCases, setTestCases] = useState([]);
  const [testCaseForm, setTestCaseForm] = useState({
    input: "",
    expectedOutput: "",
    isHidden: false,
    orderNo: 1,
  });

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const scheduleOptions = useMemo(
    () =>
      schedules.map(s => ({
        value: String(s.id),
        label: `${s.name} (${new Date(s.start_at).toLocaleString()} - ${new Date(s.end_at).toLocaleString()})`,
      })),
    [schedules]
  );

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [metricsRes, schedulesRes, problemsRes] = await Promise.all([
        fetchAdminMetrics(),
        fetchSchedules(),
        fetchProblems(),
      ]);
      setMetrics(metricsRes);
      setSchedules(schedulesRes.schedules || []);
      setProblems(problemsRes.problems || []);
    } catch (err) {
      setError(err.message || "Failed to load admin data");
    }
  }

  function pushNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  }

  async function handleCreateSchedule() {
    setError("");
    try {
      await createSchedule({
        name: scheduleForm.name,
        startAt: scheduleForm.startAt,
        endAt: scheduleForm.endAt,
        durationMinutes: scheduleForm.durationMinutes ? Number(scheduleForm.durationMinutes) : null,
        isActive: scheduleForm.isActive,
      });
      pushNotice("Schedule created");
      const schedulesRes = await fetchSchedules();
      setSchedules(schedulesRes.schedules || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateSchedule() {
    if (!selectedScheduleId) return;
    setError("");
    try {
      await updateSchedule(selectedScheduleId, {
        name: scheduleForm.name || null,
        startAt: scheduleForm.startAt || null,
        endAt: scheduleForm.endAt || null,
        durationMinutes: scheduleForm.durationMinutes ? Number(scheduleForm.durationMinutes) : null,
        isActive: scheduleForm.isActive,
      });
      pushNotice("Schedule updated");
      const schedulesRes = await fetchSchedules();
      setSchedules(schedulesRes.schedules || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSearchStudents() {
    setError("");
    try {
      const res = await fetchStudents(studentQuery);
      setStudents(res.students || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSelectStudent(student) {
    setSelectedStudent(student);
    setError("");
    try {
      const res = await fetchStudentSessions(student.id);
      setStudentSessions(res.sessions || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleStudentActive() {
    if (!selectedStudent) return;
    setError("");
    try {
      await updateStudentStatus(selectedStudent.id, {
        isActive: !selectedStudent.is_active,
      });
      pushNotice("Student status updated");
      await handleSearchStudents();
      setSelectedStudent({ ...selectedStudent, is_active: !selectedStudent.is_active });
    } catch (err) {
      setError(err.message);
    }
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
      setError(err.message);
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
      setError(err.message);
    }
  }

  async function handleUpdateSessionResult(sessionId, status, levelCleared) {
    setError("");
    try {
      await updateSessionResult(sessionId, { status, levelCleared });
      pushNotice("Session result updated");
      if (selectedStudent) {
        const res = await fetchStudentSessions(selectedStudent.id);
        setStudentSessions(res.sessions || []);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSearchSubmissions() {
    setError("");
    try {
      const res = await fetchSubmissions({
        sessionId: submissionFilters.sessionId || undefined,
        studentId: submissionFilters.studentId || undefined,
      });
      setSubmissions(res.submissions || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSelectProblem(problemId) {
    setSelectedProblemId(problemId);
    setError("");
    try {
      const res = await fetchTestCases(problemId);
      setTestCases(res.testCases || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateProblem() {
    setError("");
    try {
      await createProblem(problemForm);
      pushNotice("Problem created");
      const res = await fetchProblems();
      setProblems(res.problems || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateProblem() {
    if (!selectedProblemId) return;
    setError("");
    try {
      await updateProblem(selectedProblemId, problemForm);
      pushNotice("Problem updated");
      const res = await fetchProblems();
      setProblems(res.problems || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteProblem(problemId) {
    setError("");
    try {
      await deleteProblem(problemId);
      pushNotice("Problem deactivated");
      const res = await fetchProblems();
      setProblems(res.problems || []);
      if (selectedProblemId === String(problemId)) {
        setSelectedProblemId("");
        setTestCases([]);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateTestCase() {
    if (!selectedProblemId) return;
    setError("");
    try {
      await createTestCase(selectedProblemId, testCaseForm);
      pushNotice("Test case created");
      const res = await fetchTestCases(selectedProblemId);
      setTestCases(res.testCases || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateTestCase(testCaseId, payload) {
    setError("");
    try {
      await updateTestCase(testCaseId, payload);
      pushNotice("Test case updated");
      const res = await fetchTestCases(selectedProblemId);
      setTestCases(res.testCases || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteTestCase(testCaseId) {
    setError("");
    try {
      await deleteTestCase(testCaseId);
      pushNotice("Test case removed");
      const res = await fetchTestCases(selectedProblemId);
      setTestCases(res.testCases || []);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Manage tests, students, and questions.</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-md border border-slate-200 text-slate-700"
          >
            Logout
          </button>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {notice && <div className="text-sm text-emerald-600">{notice}</div>}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-100 p-4">
            <div className="text-xs uppercase text-slate-400">Questions</div>
            <div className="text-2xl font-semibold text-slate-800">
              {metrics?.questionCount ?? "-"}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-100 p-4">
            <div className="text-xs uppercase text-slate-400">Users</div>
            <div className="text-2xl font-semibold text-slate-800">
              {metrics?.userCount ?? "-"}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-100 p-4">
            <div className="text-xs uppercase text-slate-400">Tests Today</div>
            <div className="text-2xl font-semibold text-slate-800">
              {metrics?.testsToday ?? "-"}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800">Level Completions</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
            {(metrics?.levelCompletions || []).map(level => (
              <div key={level.level} className="rounded-md border border-slate-200 p-3">
                <div className="text-xs uppercase text-slate-400">Level {level.level}</div>
                <div className="text-lg font-semibold text-slate-700">{level.studentCount}</div>
              </div>
            ))}
            {!metrics?.levelCompletions?.length && (
              <div className="text-sm text-slate-500">No completions yet.</div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg border border-slate-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Test Scheduling</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm text-slate-600">Select Schedule</label>
              <select
                value={selectedScheduleId}
                onChange={event => setSelectedScheduleId(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {scheduleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  value={scheduleForm.name}
                  onChange={event => setScheduleForm({ ...scheduleForm, name: event.target.value })}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Schedule name"
                />
                <input
                  value={scheduleForm.durationMinutes}
                  onChange={event => setScheduleForm({ ...scheduleForm, durationMinutes: event.target.value })}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Duration (minutes)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="datetime-local"
                  value={scheduleForm.startAt}
                  onChange={event => setScheduleForm({ ...scheduleForm, startAt: event.target.value })}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="datetime-local"
                  value={scheduleForm.endAt}
                  onChange={event => setScheduleForm({ ...scheduleForm, endAt: event.target.value })}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={scheduleForm.isActive}
                  onChange={event => setScheduleForm({ ...scheduleForm, isActive: event.target.checked })}
                />
                Active
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateSchedule}
                  className="px-4 py-2 rounded-md bg-sky-500 text-white text-sm"
                >
                  Create Schedule
                </button>
                <button
                  onClick={handleUpdateSchedule}
                  className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-sm"
                >
                  Update Schedule
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-slate-600">Existing Schedules</div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {schedules.map(schedule => (
                  <div key={schedule.id} className="rounded-md border border-slate-200 p-3 text-xs text-slate-600">
                    <div className="font-semibold text-slate-800">{schedule.name}</div>
                    <div>{new Date(schedule.start_at).toLocaleString()} - {new Date(schedule.end_at).toLocaleString()}</div>
                    <div>Duration: {schedule.duration_minutes || "Default"} mins</div>
                    <div>Status: {schedule.is_active ? "Active" : "Inactive"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-slate-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Test Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="text-sm text-slate-600">Reset Questions</div>
              <input
                value={resetSessionIds}
                onChange={event => setResetSessionIds(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Session IDs (comma-separated)"
              />
              <input
                value={resetUserIds}
                onChange={event => setResetUserIds(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Student IDs (comma-separated)"
              />
              <button
                onClick={handleResetQuestions}
                className="px-4 py-2 rounded-md bg-sky-500 text-white text-sm"
              >
                Reset Questions
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-slate-600">Change Session Duration</div>
              <input
                value={durationSessionId}
                onChange={event => setDurationSessionId(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Session ID"
              />
              <input
                value={durationMinutes}
                onChange={event => setDurationMinutes(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Duration (minutes)"
              />
              <button
                onClick={handleUpdateDuration}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-sm"
              >
                Update Duration
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-slate-600">Submission Lookup</div>
              <input
                value={submissionFilters.sessionId}
                onChange={event => setSubmissionFilters({ ...submissionFilters, sessionId: event.target.value })}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Session ID"
              />
              <input
                value={submissionFilters.studentId}
                onChange={event => setSubmissionFilters({ ...submissionFilters, studentId: event.target.value })}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Student ID"
              />
              <button
                onClick={handleSearchSubmissions}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-sm"
              >
                View Submissions
              </button>
            </div>
          </div>

          {submissions.length > 0 && (
            <div className="mt-4 space-y-3">
              {submissions.map(sub => (
                <div key={sub.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap justify-between">
                    <div className="font-semibold text-slate-800">
                      {sub.problem_title} ({sub.status})
                    </div>
                    <div className="text-xs text-slate-500">{new Date(sub.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-slate-500">Student: {sub.student_name} | Session {sub.test_session_id}</div>
                  <pre className="mt-2 whitespace-pre-wrap text-xs bg-slate-50 border border-slate-200 rounded p-2">
                    {sub.code}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg border border-slate-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Student Management</h2>
          <div className="flex flex-wrap gap-2">
            <input
              value={studentQuery}
              onChange={event => setStudentQuery(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Search by name, email, roll"
            />
            <button
              onClick={handleSearchStudents}
              className="px-4 py-2 rounded-md bg-sky-500 text-white text-sm"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {students.map(student => (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className={`w-full text-left rounded-md border px-3 py-2 text-sm ${
                    selectedStudent?.id === student.id
                      ? "border-sky-400 bg-sky-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="font-semibold text-slate-700">{student.full_name}</div>
                  <div className="text-xs text-slate-500">{student.email}</div>
                  <div className="text-xs text-slate-500">Status: {student.is_active ? "Active" : "Blocked"}</div>
                </button>
              ))}
            </div>

            {selectedStudent && (
              <div className="space-y-3">
                <div className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="font-semibold text-slate-700">{selectedStudent.full_name}</div>
                  <div className="text-xs text-slate-500">{selectedStudent.email}</div>
                  <div className="text-xs text-slate-500">Enrollment: {selectedStudent.enrollment_no || "-"}</div>
                  <div className="text-xs text-slate-500">Roll: {selectedStudent.roll_no || "-"}</div>
                  <button
                    onClick={handleToggleStudentActive}
                    className="mt-2 px-3 py-1 rounded-md border border-slate-200 text-xs"
                  >
                    {selectedStudent.is_active ? "Block" : "Unblock"}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Test Sessions</div>
                  {studentSessions.map(session => (
                    <div key={session.id} className="rounded-md border border-slate-200 p-3 text-xs">
                      <div className="font-semibold text-slate-700">Session {session.id}</div>
                      <div>Level: {session.level}</div>
                      <div>Status: {session.status}</div>
                      <div>Cleared: {session.level_cleared ? "Yes" : "No"}</div>
                      <div>Started: {new Date(session.started_at).toLocaleString()}</div>
                      <div>Ended: {session.ended_at ? new Date(session.ended_at).toLocaleString() : "-"}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUpdateSessionResult(session.id, "PASS", true)}
                          className="px-2 py-1 rounded-md bg-emerald-500 text-white"
                        >
                          Mark PASS
                        </button>
                        <button
                          onClick={() => handleUpdateSessionResult(session.id, "FAIL", false)}
                          className="px-2 py-1 rounded-md bg-amber-500 text-white"
                        >
                          Mark FAIL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg border border-slate-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Questions Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {problems.map(problem => (
                <div key={problem.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleSelectProblem(String(problem.id))}
                      className="text-left"
                    >
                      <div className="font-semibold text-slate-700">{problem.title}</div>
                      <div className="text-xs text-slate-500">Level {problem.level}</div>
                    </button>
                    <button
                      onClick={() => handleDeleteProblem(problem.id)}
                      className="text-xs text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">{problem.is_active ? "Active" : "Inactive"}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-sm text-slate-600">Problem Details</div>
              <input
                value={problemForm.level}
                onChange={event => setProblemForm({ ...problemForm, level: event.target.value })}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Level"
              />
              <input
                value={problemForm.title}
                onChange={event => setProblemForm({ ...problemForm, title: event.target.value })}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Title"
              />
              <textarea
                value={problemForm.description}
                onChange={event => setProblemForm({ ...problemForm, description: event.target.value })}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Description"
                rows={3}
              />
              <textarea
                value={problemForm.starterCode}
                onChange={event => setProblemForm({ ...problemForm, starterCode: event.target.value })}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Starter code"
                rows={3}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={problemForm.isActive}
                  onChange={event => setProblemForm({ ...problemForm, isActive: event.target.checked })}
                />
                Active
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProblem}
                  className="px-4 py-2 rounded-md bg-sky-500 text-white text-sm"
                >
                  Add Problem
                </button>
                <button
                  onClick={handleUpdateProblem}
                  className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-sm"
                >
                  Update Selected
                </button>
              </div>

              {selectedProblemId && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm text-slate-600">Test Cases for Problem {selectedProblemId}</div>
                  {testCases.map(tc => (
                    <div key={tc.id} className="rounded-md border border-slate-200 p-3 text-xs space-y-2">
                      <div>Input: {tc.input}</div>
                      <div>Expected: {tc.expected_output}</div>
                      <div>Hidden: {tc.is_hidden ? "Yes" : "No"}</div>
                      <div>Order: {tc.order_no}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateTestCase(tc.id, {
                            input: tc.input,
                            expectedOutput: tc.expected_output,
                            isHidden: !tc.is_hidden,
                            orderNo: tc.order_no,
                          })}
                          className="px-2 py-1 rounded-md border border-slate-200"
                        >
                          Toggle Hidden
                        </button>
                        <button
                          onClick={() => handleDeleteTestCase(tc.id)}
                          className="px-2 py-1 rounded-md text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-md border border-slate-200 p-3 space-y-2">
                    <div className="text-sm text-slate-600">Add Test Case</div>
                    <input
                      value={testCaseForm.input}
                      onChange={event => setTestCaseForm({ ...testCaseForm, input: event.target.value })}
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Input"
                    />
                    <input
                      value={testCaseForm.expectedOutput}
                      onChange={event => setTestCaseForm({ ...testCaseForm, expectedOutput: event.target.value })}
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Expected output"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={testCaseForm.isHidden}
                        onChange={event => setTestCaseForm({ ...testCaseForm, isHidden: event.target.checked })}
                      />
                      <span className="text-xs text-slate-500">Hidden</span>
                    </div>
                    <input
                      type="number"
                      value={testCaseForm.orderNo}
                      onChange={event => setTestCaseForm({ ...testCaseForm, orderNo: Number(event.target.value) })}
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Order"
                    />
                    <button
                      onClick={handleCreateTestCase}
                      className="px-3 py-2 rounded-md bg-sky-500 text-white text-sm"
                    >
                      Add Test Case
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
