import { useEffect, useRef, useState } from "react";
import { fetchTest, fetchTestMeta, executeTest, executeCustom, finishTest } from "../api/testApi";
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

export default function TestPage({ sessionId, level = "1A", durationMinutes, onLogout, onFinish }) {
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
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [timerEndAt, setTimerEndAt] = useState(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState(0);
  const [autoFinished, setAutoFinished] = useState(false);
  const autoFinishPendingRef = useRef(false);
  const storageKey = sessionId ? `test-${sessionId}` : null;

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

        const sessionMeta = data.session || {};
        const resolvedOffset = data.serverNow
          ? Date.now() - new Date(data.serverNow).getTime()
          : serverTimeOffsetMs;
        if (data.serverNow) {
          setServerTimeOffsetMs(resolvedOffset);
        }
        const serverDuration = sessionMeta.durationMinutes || durationMinutes || null;
        const startedAt = sessionMeta.startedAt ? new Date(sessionMeta.startedAt).getTime() : Date.now();
        setSessionStartedAt(startedAt);
        if (serverDuration) {
          const durationEndAt = startedAt + serverDuration * 60 * 1000;
          const scheduleEndAt = sessionMeta.ignoreScheduleEnd
            ? null
            : sessionMeta.scheduleEndAt
            ? new Date(sessionMeta.scheduleEndAt).getTime()
            : null;
          const endAt = scheduleEndAt ? Math.min(durationEndAt, scheduleEndAt) : durationEndAt;
          setTimerEndAt(endAt);
          const now = Date.now() - resolvedOffset;
          setRemainingSeconds(Math.max(0, Math.floor((endAt - now) / 1000)));
        } else {
          setTimerEndAt(null);
          setRemainingSeconds(null);
        }

        const initialCodeMap = buildInitialCodeMap(normalized);
        let storedMap = {};
        if (storageKey) {
          try {
            const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
            if (parsed && typeof parsed === "object") {
              storedMap = parsed;
            }
          } catch {
            storedMap = {};
          }
        }
        const mergedMap = { ...initialCodeMap, ...storedMap };
        setCodeByQuestionId(mergedMap);
        setCode(mergedMap[normalized[0]?.id] ?? "");
        setResultsByQuestionId({});
        setResults(null);
        setSessionVerdict(null);
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
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(codeByQuestionId));
  }, [storageKey, codeByQuestionId]);

  useEffect(() => {
    if (!timerEndAt) return;

    const interval = setInterval(() => {
      const now = Date.now() - serverTimeOffsetMs;
      const next = Math.max(0, Math.floor((timerEndAt - now) / 1000));
      setRemainingSeconds(next);
      if (next <= 0) {
        clearInterval(interval);
        if (!autoFinished) {
          confirmAutoFinish();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEndAt, serverTimeOffsetMs, autoFinished]);

  useEffect(() => {
    if (!sessionId || !sessionStartedAt) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetchTestMeta(sessionId);
        const meta = res.session || {};
        if (res.serverNow) {
          setServerTimeOffsetMs(Date.now() - new Date(res.serverNow).getTime());
        }
        if (meta.status && meta.status !== "IN_PROGRESS" && !autoFinished) {
          setSessionVerdict(meta.status);
          setAutoFinished(true);
          if (onFinish) {
            onFinish({ status: meta.status, sessionId, auto: true });
          }
          return;
        }
        if (!meta.durationMinutes || !meta.startedAt) return;
        const startedAt = new Date(meta.startedAt).getTime();
        if (startedAt !== sessionStartedAt) {
          setSessionStartedAt(startedAt);
        }
        const durationEndAt = startedAt + meta.durationMinutes * 60 * 1000;
        const scheduleEndAt = meta.ignoreScheduleEnd
          ? null
          : meta.scheduleEndAt
          ? new Date(meta.scheduleEndAt).getTime()
          : null;
        const endAt = scheduleEndAt ? Math.min(durationEndAt, scheduleEndAt) : durationEndAt;
        if (endAt !== timerEndAt) {
          setTimerEndAt(endAt);
        }
      } catch {
        // silent
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionId, sessionStartedAt, timerEndAt, onFinish, autoFinished]);

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
    if (!sessionId || finishing || autoFinished) return;
    setFinishing(true);
    setError("");
    

    try {
      const res = await finishTest({ sessionId });
      setSessionVerdict(res?.status || null);
      if (onFinish) {
        onFinish(res);
      }
    } catch (err) {
      setError(err?.message || "Failed to finish test.");
    } finally {
      setFinishing(false);
    }
  }

  async function confirmAutoFinish() {
    if (!sessionId || autoFinished || autoFinishPendingRef.current) return;
    autoFinishPendingRef.current = true;

    try {
      const res = await fetchTestMeta(sessionId);
      const meta = res.session || {};
      const now = res.serverNow
        ? new Date(res.serverNow).getTime()
        : Date.now();

      if (meta.status && meta.status !== "IN_PROGRESS") {
        setSessionVerdict(meta.status);
        setAutoFinished(true);
        if (onFinish) {
          onFinish({ status: meta.status, sessionId, auto: true });
        }
        return;
      }

      if (meta.durationMinutes && meta.startedAt) {
        const startedAt = new Date(meta.startedAt).getTime();
        const durationEndAt = startedAt + meta.durationMinutes * 60 * 1000;
        const scheduleEndAt = meta.ignoreScheduleEnd
          ? null
          : meta.scheduleEndAt
          ? new Date(meta.scheduleEndAt).getTime()
          : null;
        const endAt = scheduleEndAt ? Math.min(durationEndAt, scheduleEndAt) : durationEndAt;
        if (endAt > now) {
          setTimerEndAt(endAt);
          setRemainingSeconds(Math.max(0, Math.floor((endAt - now) / 1000)));
          return;
        }
      }

      await handleFinish();
    } catch {
      await handleFinish();
    } finally {
      autoFinishPendingRef.current = false;
    }
  }


  const timeLabel = remainingSeconds !== null
    ? `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`
    : null;

  if (initializing) return <div>Loading test…</div>;

  if (!questions.length) {
    return (
      <div className="p-6 text-red-600">
        {error || "No questions available."}
      </div>
    );
  }

  return (
    <div className="h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 text-gray-800 font-semibold flex items-center justify-between">
        <div>Flutter Skill Test — Level {level}</div>
        <div className="flex items-center gap-4 text-sm font-medium">
          {timeLabel && (
            <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1">Time Left: {timeLabel}</span>
          )}
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="rounded-md bg-blue-600 text-white px-4 py-2"
          >
            {finishing ? "Finishing..." : "Finish Test"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="grid grid-rows-[auto_1fr] gap-4 p-4 overflow-hidden">
        <div className="bg-white rounded-lg border border-gray-200 p-2 flex gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => handleSelectQuestion(index)}
              className={`px-3 py-1 rounded-md border text-sm transition ${
                index === activeIndex
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
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
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={submitCode}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white"
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
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm font-semibold text-gray-700">
              Custom Input
            </div>
            <textarea
              className="mt-2 w-full h-28 resize-none rounded-md border border-gray-200 bg-white p-2 text-sm text-gray-700"
              placeholder="Enter custom input..."
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
            />
            <button
              onClick={runCustomInput}
              disabled={customLoading}
              className="mt-3 px-4 py-2 rounded-md bg-blue-600 text-white"
            >
              {customLoading ? "Running…" : "Run Code"}
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm font-semibold text-gray-700">
              Output
            </div>
            <div className="mt-2 h-28 rounded-md border border-gray-200 bg-white p-2 text-sm text-gray-500">
              {customOutput || "Run code to see output."}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
