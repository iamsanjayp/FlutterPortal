import { useEffect, useMemo, useState } from "react";
import { fetchTest, executeTest, executeCustom, finishTest, submitFeedback } from "../api/testApi";
import CodeEditor from "../components/CodeEditor";
import ProblemPanel from "../components/ProblemPanel";
import ResultPanel from "../components/ResultPanel";

function normalizeQuestions(rawQuestions) {
  return (rawQuestions || []).map(question => ({
    ...question,
    testCases: (question.testCases || []).map(tc => ({
      ...tc,
      status: tc.status ?? "NOT_TESTED",
    })),
  }));
}

function buildInitialCodeMap(questions) {
  return questions.reduce((acc, question) => {
    acc[question.id] = question.starter_code ?? "";
    return acc;
  }, {});
}

export default function TestPage({ sessionId, durationMinutes = 60, level = "1A", onExit }) {
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [code, setCode] = useState("");
  const [codeByQuestionId, setCodeByQuestionId] = useState({});
  const [resultsByQuestionId, setResultsByQuestionId] = useState({});
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [results, setResults] = useState(null);
  const [sessionVerdict, setSessionVerdict] = useState(null);
  const [error, setError] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [customOutput, setCustomOutput] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [finalResult, setFinalResult] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const activeQuestion = questions[activeIndex];
  const activeQuestionId = activeQuestion?.id;

  // Load test data when sessionId is available
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;

    async function init() {
      setInitializing(true);
      setError("");

      try {
        const data = await fetchTest(sessionId);
        if (!isMounted) return;

        const normalized = normalizeQuestions(data.questions);
        setQuestions(normalized);
        setActiveIndex(0);

        const initialCodeMap = buildInitialCodeMap(normalized);
        setCodeByQuestionId(initialCodeMap);
        setCode(initialCodeMap[normalized[0]?.id] ?? "");
        setResultsByQuestionId({});
        setResults(null);
        setSessionVerdict(null);
        setFinalResult(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load the test.");
      } finally {
        if (!isMounted) return;
        setInitializing(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    setTimeLeft(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    if (finalResult) return;
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, finalResult]);

  function handleCodeChange(value) {
    setCode(value || "");
    if (!activeQuestionId) return;

    setCodeByQuestionId(prev => ({
      ...prev,
      [activeQuestionId]: value || "",
    }));
  }

  function handleSelectQuestion(index) {
    const nextQuestion = questions[index];
    if (!nextQuestion) return;

    setActiveIndex(index);
    setCode(codeByQuestionId[nextQuestion.id] ?? "");
    setResults(resultsByQuestionId[nextQuestion.id] ?? null);
    setError("");
  }

  async function submitCode() {
    if (!sessionId || !activeQuestion) return;

    setLoading(true);
    setError("");

    try {
      const res = await executeTest({
        sessionId,
        problemId: activeQuestion.id,
        code: codeByQuestionId[activeQuestion.id] ?? code,
      });

      setResults(res || null);
      setResultsByQuestionId(prev => ({
        ...prev,
        [activeQuestion.id]: res || null,
      }));

      if (res?.sessionStatus === "PASS" || res?.sessionStatus === "FAIL") {
        setSessionVerdict(res.sessionStatus);
      } else {
        setSessionVerdict(null);
      }

      const tests = Array.isArray(res?.tests) ? res.tests : [];

      // Update test case statuses
      setQuestions(prev =>
        prev.map(q =>
          q.id !== activeQuestion.id
            ? q
            : {
                ...q,
                testCases: (q.testCases || []).map(tc => {
                  const match = tests.find(
                    t => Number(t.testCaseId) === Number(tc.id)
                  );
                  return match
                    ? { ...tc, status: match.status }
                    : tc;
                }),
              }
        )
      );
    } catch (err) {
      setError(err?.message || "Execution failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runCustomInput() {
    if (!activeQuestion) return;

    setCustomLoading(true);
    setError("");

    try {
      const res = await executeCustom({
        code: codeByQuestionId[activeQuestion.id] ?? code,
        customInput,
      });

      setCustomOutput(res?.output ?? "");
    } catch (err) {
      setError(err?.message || "Custom execution failed.");
    } finally {
      setCustomLoading(false);
    }
  }

  async function handleFinish() {
    if (!sessionId || finalResult) return;
    try {
      const res = await finishTest({ sessionId });
      setFinalResult(res);
    } catch (err) {
      setError(err?.message || "Failed to finish test.");
    }
  }

  async function handleSubmitFeedback() {
    if (!sessionId) return;
    try {
      await submitFeedback({ sessionId, feedback });
      setFeedbackSaved(true);
      if (onExit) {
        setTimeout(() => onExit(), 800);
      }
    } catch (err) {
      setError(err?.message || "Failed to submit feedback.");
    }
  }

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeft]);

  if (initializing) return <div>Loading test…</div>;

  if (!questions.length) {
    return (
      <div className="p-6 text-red-600">
        {error || "No questions available."}
      </div>
    );
  }

  if (finalResult) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Test Results
          </h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div>
              Level: <span className="font-semibold">{finalResult.level}</span>
            </div>
            <div>
              Total Passed: <span className="font-semibold">{finalResult.totalPassed}</span>
            </div>
            <div>
              Total Test Cases: <span className="font-semibold">{finalResult.totalCount}</span>
            </div>
            <div>
              Level Clear: <span className={`font-semibold ${finalResult.levelCleared ? "text-green-600" : "text-red-600"}`}>
                {finalResult.levelCleared ? "YES" : "NO"}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-700">
              Feedback
            </div>
            <textarea
              className="mt-2 w-full h-24 resize-none rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700"
              placeholder="Share your feedback about the test..."
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            />
            <button
              onClick={handleSubmitFeedback}
              className="mt-3 px-4 py-2 rounded-md bg-sky-500 text-white"
              disabled={feedbackSaved}
            >
              {feedbackSaved ? "Feedback submitted" : "Submit Feedback"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen grid grid-rows-[auto_1fr_auto] bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 bg-sky-500 text-white font-semibold flex items-center justify-between">
        <span>Flutter Skill Test — Level {level}</span>
        <div className="flex items-center gap-4 text-sm font-normal">
          <span>
            Time Left: <span className="font-semibold">{formattedTime}</span>
          </span>
          <button
            onClick={handleFinish}
            className="px-3 py-1 rounded-md border border-white/40 bg-white/10 text-white"
          >
            Finish Test
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="grid grid-rows-[auto_1fr] gap-4 p-4 overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-2 flex gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => handleSelectQuestion(index)}
              className={`px-3 py-1 rounded-md border text-sm transition ${
                index === activeIndex
                  ? "bg-sky-500 text-white border-sky-500"
                  : "bg-white text-slate-700 border-slate-200 hover:border-sky-300"
              }`}
            >
              Question {index + 1}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 overflow-hidden">
          <ProblemPanel question={activeQuestion} />
          <CodeEditor code={code} setCode={handleCodeChange} />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={submitCode}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-sky-500 text-white"
            >
              {loading ? "Submitting…" : "Submit"}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
            {results && <ResultPanel results={results} />}
            {sessionVerdict && (
              <span className="text-sm font-semibold">
                Final Verdict:{" "}
                <span
                  className={
                    sessionVerdict === "PASS"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {sessionVerdict}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-700">
              Custom Input
            </div>
            <textarea
              className="mt-2 w-full h-28 resize-none rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700"
              placeholder="Enter custom input..."
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
            />
            <button
              onClick={runCustomInput}
              disabled={customLoading}
              className="mt-3 px-4 py-2 rounded-md bg-sky-500 text-white"
            >
              {customLoading ? "Running…" : "Run Code"}
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-700">
              Output
            </div>
            <div className="mt-2 h-28 rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-500">
              {customOutput || "Run code to see output."}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
