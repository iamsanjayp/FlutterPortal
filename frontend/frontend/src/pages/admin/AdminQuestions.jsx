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

      <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6 border-l-4 border-indigo-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Questions</h2>
            <p className="text-sm text-slate-400">Manage coding problems and test cases.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs uppercase text-slate-400">Question Bank</div>
            {problems.map(problem => (
              <div
                key={problem.id}
                className={`rounded-xl border p-4 shadow-sm transition ${
                  selectedProblemId === String(problem.id)
                    ? "border-indigo-400 bg-slate-800"
                    : "border-slate-800 bg-slate-950"
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleSelectProblem(problem)}
                    className="text-left"
                  >
                    <div className="font-semibold text-slate-100">{problem.title}</div>
                    <div className="text-xs text-slate-400">Level {problem.level}</div>
                  </button>
                  <button
                    onClick={() => handleDeleteProblem(problem.id)}
                    className="text-xs text-red-500"
                  >
                    Remove
                  </button>
                </div>
                <div className="text-xs text-slate-400 mt-2">{problem.is_active ? "Active" : "Inactive"}</div>
              </div>
            ))}
            {!problems.length && (
              <div className="text-sm text-slate-400">No problems configured.</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="text-sm font-semibold text-slate-100">Problem Details</div>
              {selectedProblem && (
                <div className="text-xs text-slate-400">
                  Editing: <span className="font-semibold text-slate-100">{selectedProblem.title}</span>
                </div>
              )}
            <input
              value={problemForm.level}
              onChange={event => setProblemForm({ ...problemForm, level: event.target.value })}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              placeholder="Level"
            />
            <input
              value={problemForm.title}
              onChange={event => setProblemForm({ ...problemForm, title: event.target.value })}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              placeholder="Title"
            />
            <textarea
              value={problemForm.description}
              onChange={event => setProblemForm({ ...problemForm, description: event.target.value })}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              placeholder="Description"
              rows={3}
            />
            <textarea
              value={problemForm.starterCode}
              onChange={event => setProblemForm({ ...problemForm, starterCode: event.target.value })}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              placeholder="Starter code"
              rows={3}
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={problemForm.isActive}
                onChange={event => setProblemForm({ ...problemForm, isActive: event.target.checked })}
              />
              Active
            </label>
            <div className="flex gap-3">
              <button
                onClick={handleCreateProblem}
                className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm shadow-sm"
              >
                Add Problem
              </button>
              <button
                onClick={handleUpdateProblem}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm shadow-sm"
              >
                Update Selected
              </button>
            </div>
            </div>

            {selectedProblemId && (
              <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-100">Test Cases</div>
                  <div className="text-xs text-slate-400">Problem ID: {selectedProblemId}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                  <div className="text-xs uppercase text-slate-400">Add Test Case</div>
                  <input
                    value={testCaseForm.input}
                    onChange={event => setTestCaseForm({ ...testCaseForm, input: event.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    placeholder="Input"
                  />
                  <input
                    value={testCaseForm.expectedOutput}
                    onChange={event => setTestCaseForm({ ...testCaseForm, expectedOutput: event.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    placeholder="Expected output"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={testCaseForm.isHidden}
                        onChange={event => setTestCaseForm({ ...testCaseForm, isHidden: event.target.checked })}
                      />
                      Hidden
                    </label>
                    <input
                      type="number"
                      value={testCaseForm.orderNo}
                      onChange={event => setTestCaseForm({ ...testCaseForm, orderNo: Number(event.target.value) })}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                      placeholder="Order"
                    />
                  </div>
                  <button
                    onClick={handleCreateTestCase}
                    className="px-3 py-2 rounded-xl bg-indigo-500 text-white text-sm"
                  >
                    Add Test Case
                  </button>
                </div>

                <div className="space-y-3">
                  {testCases.map(tc => (
                    <div key={tc.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div><span className="text-slate-400">Input:</span> {tc.input}</div>
                        <div><span className="text-slate-400">Expected:</span> {tc.expected_output}</div>
                        <div><span className="text-slate-400">Hidden:</span> {tc.is_hidden ? "Yes" : "No"}</div>
                        <div><span className="text-slate-400">Order:</span> {tc.order_no}</div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleUpdateTestCase(tc.id, {
                            input: tc.input,
                            expectedOutput: tc.expected_output,
                            isHidden: !tc.is_hidden,
                            orderNo: tc.order_no,
                          })}
                          className="px-2 py-1 rounded-lg border border-slate-700 text-slate-100"
                        >
                          Toggle Hidden
                        </button>
                        <button
                          onClick={() => handleDeleteTestCase(tc.id)}
                          className="px-2 py-1 rounded-lg text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {!testCases.length && (
                    <div className="text-sm text-slate-400">No test cases.</div>
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
