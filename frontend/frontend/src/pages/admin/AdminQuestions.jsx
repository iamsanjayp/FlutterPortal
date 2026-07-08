import { useEffect, useState } from "react";
import {
  fetchProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  fetchTestCases,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from "../../api/adminApi";

export default function AdminQuestions() {
  const [problems, setProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [selectedProblem, setSelectedProblem] = useState(null);
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

  useEffect(() => {
    loadProblems();
  }, []);

  async function loadProblems() {
    try {
      const res = await fetchProblems();
      setProblems(res.problems || []);
      return res.problems || [];
    } catch (err) {
      setError(err.message || "Failed to load problems");
      return [];
    }
  }

  function pushNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  }

  async function handleSelectProblem(problem) {
    const id = String(problem.id);
    setSelectedProblemId(id);
    setSelectedProblem(problem);
    setProblemForm({
      level: problem.level || "1A",
      title: problem.title || "",
      description: problem.description || "",
      starterCode: problem.starter_code || "",
      isActive: Boolean(problem.is_active),
    });
    setTestCaseForm({
      input: "",
      expectedOutput: "",
      isHidden: false,
      orderNo: 1,
    });
    try {
      const res = await fetchTestCases(id);
      setTestCases(res.testCases || []);
    } catch (err) {
      setError(err.message || "Failed to load test cases");
    }
  }

  async function handleCreateProblem() {
    setError("");
    try {
      const created = await createProblem(problemForm);
      pushNotice("Problem created");
      const freshProblems = await loadProblems();
      const matched = freshProblems.find(problem => String(problem.id) === String(created.id));
      if (matched) {
        handleSelectProblem(matched);
      }
    } catch (err) {
      setError(err.message || "Failed to create problem");
    }
  }

  async function handleUpdateProblem() {
    if (!selectedProblemId) return;
    setError("");
    try {
      await updateProblem(selectedProblemId, problemForm);
      pushNotice("Problem updated");
      loadProblems();
    } catch (err) {
      setError(err.message || "Failed to update problem");
    }
  }

  async function handleDeleteProblem(id) {
    setError("");
    try {
      await deleteProblem(id);
      pushNotice("Problem deactivated");
      loadProblems();
      if (selectedProblemId === String(id)) {
        setSelectedProblemId("");
        setTestCases([]);
      }
    } catch (err) {
      setError(err.message || "Failed to delete problem");
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
      setError(err.message || "Failed to create test case");
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
      setError(err.message || "Failed to update test case");
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
      setError(err.message || "Failed to delete test case");
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {notice && <div className="text-sm text-emerald-600">{notice}</div>}

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 border-l-4 border-indigo-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Questions</h2>
            <p className="text-sm text-slate-500">Manage coding problems and test cases.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Question Bank</div>
            {problems.map(problem => (
              <div
                key={problem.id}
                className={`rounded-xl border p-4 shadow-sm transition ${
                  selectedProblemId === String(problem.id)
                    ? "border-indigo-500 bg-indigo-50/60"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleSelectProblem(problem)}
                    className="text-left flex-1"
                  >
                    <div className="font-bold text-slate-800">{problem.title}</div>
                    <div className="text-xs font-semibold text-indigo-600">Level {problem.level}</div>
                  </button>
                  <button
                    onClick={() => handleDeleteProblem(problem.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 transition"
                  >
                    Remove
                  </button>
                </div>
                <div className="text-xs text-slate-500 mt-2">Status: <span className={problem.is_active ? "text-emerald-600 font-semibold" : "text-slate-500 font-semibold"}>{problem.is_active ? "Active" : "Inactive"}</span></div>
              </div>
            ))}
            {!problems.length && (
              <div className="text-sm text-slate-500">No problems configured.</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="text-sm font-bold text-slate-800">Problem Details</div>
              {selectedProblem && (
                <div className="text-xs text-slate-500">
                  Editing: <span className="font-bold text-indigo-600">{selectedProblem.title}</span>
                </div>
              )}
            <input
              value={problemForm.level}
              onChange={event => setProblemForm({ ...problemForm, level: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              placeholder="Level (e.g. 1A, 2B, 3C)"
            />
            <input
              value={problemForm.title}
              onChange={event => setProblemForm({ ...problemForm, title: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              placeholder="Title"
            />
            <textarea
              value={problemForm.description}
              onChange={event => setProblemForm({ ...problemForm, description: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              placeholder="Description"
              rows={3}
            />
            <textarea
              value={problemForm.starterCode}
              onChange={event => setProblemForm({ ...problemForm, starterCode: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              placeholder="Starter code"
              rows={3}
            />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={problemForm.isActive}
                onChange={event => setProblemForm({ ...problemForm, isActive: event.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Active
            </label>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreateProblem}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
              >
                Add Problem
              </button>
              <button
                onClick={handleUpdateProblem}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm transition"
              >
                Update Selected
              </button>
            </div>
            </div>

            {selectedProblemId && (
              <div className="space-y-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-800">Test Cases</div>
                  <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">Problem ID: {selectedProblemId}</div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 shadow-inner">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Add Test Case</div>
                  <input
                    value={testCaseForm.input}
                    onChange={event => setTestCaseForm({ ...testCaseForm, input: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    placeholder="Input"
                  />
                  <input
                    value={testCaseForm.expectedOutput}
                    onChange={event => setTestCaseForm({ ...testCaseForm, expectedOutput: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    placeholder="Expected output"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={testCaseForm.isHidden}
                        onChange={event => setTestCaseForm({ ...testCaseForm, isHidden: event.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Hidden
                    </label>
                    <input
                      type="number"
                      value={testCaseForm.orderNo}
                      onChange={event => setTestCaseForm({ ...testCaseForm, orderNo: Number(event.target.value) })}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      placeholder="Order"
                    />
                  </div>
                  <button
                    onClick={handleCreateTestCase}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
                  >
                    Add Test Case
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {testCases.map(tc => (
                    <div key={tc.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm text-xs space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono">
                        <div><span className="font-sans font-semibold text-slate-500">Input:</span> <span className="text-slate-800">{tc.input}</span></div>
                        <div><span className="font-sans font-semibold text-slate-500">Expected:</span> <span className="text-slate-800">{tc.expected_output}</span></div>
                        <div className="font-sans"><span className="font-semibold text-slate-500">Hidden:</span> <span className={tc.is_hidden ? "text-amber-600 font-semibold" : "text-slate-700"}>{tc.is_hidden ? "Yes" : "No"}</span></div>
                        <div className="font-sans"><span className="font-semibold text-slate-500">Order:</span> {tc.order_no}</div>
                      </div>
                      <div className="mt-3 flex gap-2 pt-2 border-t border-slate-200/60 font-sans">
                        <button
                          onClick={() => handleUpdateTestCase(tc.id, {
                            input: tc.input,
                            expectedOutput: tc.expected_output,
                            isHidden: !tc.is_hidden,
                            orderNo: tc.order_no,
                          })}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold shadow-sm transition"
                        >
                          Toggle Hidden
                        </button>
                        <button
                          onClick={() => handleDeleteTestCase(tc.id)}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold shadow-sm transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {!testCases.length && (
                    <div className="text-sm text-slate-500">No test cases.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
