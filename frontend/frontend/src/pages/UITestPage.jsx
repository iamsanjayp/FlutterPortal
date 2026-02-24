import { useEffect, useRef, useState } from "react";
import { fetchTest, fetchTestMeta, executeUiPreview, executeUiSubmit, finishTest } from "../api/testApi";
import CodeEditor from "../components/CodeEditor";
import { API_BASE_ROOT } from "../api/apiBase.js";

const API_ORIGIN = API_BASE_ROOT;

function buildInitialCodeMap(questions) {
  return questions.reduce((acc, question) => {
    acc[question.id] = question.starter_code ?? "";
    return acc;
  }, {});
}

export default function UITestPage({ sessionId, level = "1A", durationMinutes, passThreshold = 85, onLogout, onFinish }) {
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [code, setCode] = useState("");
  const [codeByQuestionId, setCodeByQuestionId] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [timerEndAt, setTimerEndAt] = useState(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState(0);
  const [autoFinished, setAutoFinished] = useState(false);
  const autoFinishPendingRef = useRef(false);
  const storageKey = sessionId ? `ui-test-${sessionId}` : null;

  const activeQuestion = questions[activeIndex];
  const activeQuestionId = activeQuestion?.id;

  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;

    async function init() {
      setInitializing(true);
      setError("");

      try {
        const data = await fetchTest(sessionId);
        if (!isMounted) return;

        setQuestions(data.questions || []);
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

        const initialCodeMap = buildInitialCodeMap(data.questions || []);
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
        setCode(mergedMap[data.questions?.[0]?.id] ?? "");
        setPreviewUrl("");
        setScore(null);
        setStatus(null);
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
    setError("");
    setPreviewUrl("");
    setScore(null);
    setStatus(null);
  }

  async function runPreview() {
    if (!sessionId || !activeQuestion) return;

    setRunning(true);
    setError("");

    try {
      const res = await executeUiPreview({
        sessionId,
        problemId: activeQuestion.id,
        code: codeByQuestionId[activeQuestion.id] ?? code,
      });
      setPreviewUrl(res.previewUrl || "");
    } catch (err) {
      setError(err?.message || "Preview failed.");
    } finally {
      setRunning(false);
    }
  }

  async function submitUI() {
    if (!sessionId || !activeQuestion) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await executeUiSubmit({
        sessionId,
        problemId: activeQuestion.id,
        code: codeByQuestionId[activeQuestion.id] ?? code,
      });
      setScore(res.score ?? null);
      setStatus(res.status || null);
    } catch (err) {
      setError(err?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinish() {
    if (!sessionId || finishing || autoFinished) return;
    setFinishing(true);
    setError("");

    try {
      const res = await finishTest({ sessionId });
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
  const isAwaitingManual = status === "AWAITING_MANUAL";
  const statusLabel = isAwaitingManual ? "Awaiting manual grading" : status;

  if (initializing) return <div className="p-6 text-gray-600">Loading test…</div>;

  if (!questions.length) {
    return (
      <div className="p-6 text-red-600">
        {error || "No questions available."}
      </div>
    );
  }

  return (
    <div className="h-screen grid grid-rows-[auto_1fr] bg-gray-50">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-800">Flutter UI Test — Level {level}</div>
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

      <div className="p-6 overflow-y-auto">
        {/* Question selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex gap-2 mb-6">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => handleSelectQuestion(index)}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition ${index === activeIndex
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                }`}
            >
              Question {index + 1}
            </button>
          ))}
        </div>

        {/* Question + Reference side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_auto] items-stretch gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 w-full h-full" style={{ minHeight: "620px" }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Question Description</h3>
            <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {activeQuestion?.description || "No description provided."}
            </div>

            {activeQuestion?.resourceUrls?.length > 0 && (
              <div className="mt-5 mb-5 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  Provided Resources
                </h4>
                <p className="text-xs text-blue-700 mb-3">
                  The following assets are available for use in your code. Use the exact paths below:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {activeQuestion.resourceUrls.map((url, idx) => {
                    const filename = url.split('/').pop();
                    const assetPath = `assets/images/${filename}`;
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded border border-blue-100">
                        <img
                          src={`${API_ORIGIN}${url}`}
                          alt="Resource thumbnail"
                          className="w-10 h-10 object-contain bg-gray-50 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">{filename}</div>
                          <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 block w-fit mt-0.5 select-all">
                            {assetPath}
                          </code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeQuestion?.uiRequiredWidgets?.length > 0 && (
              <div className="mt-5 space-y-4">
                {activeQuestion?.uiRequiredWidgets?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Required Widgets</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeQuestion.uiRequiredWidgets.map(widget => (
                        <span
                          key={widget}
                          className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                        >
                          {widget}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 w-fit justify-self-start self-start">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Expected Output (Sample)</h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center" style={{ width: "298px", height: "620px" }}>
              {activeQuestion?.referenceImageUrl ? (
                <img
                  src={`${API_ORIGIN}${activeQuestion.referenceImageUrl}`}
                  alt="Reference UI"
                  className="object-contain"
                  style={{ width: "270px", height: "615px" }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-500">
                  No reference image uploaded.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Code editor + Preview side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_auto] items-start gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Your Code</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={runPreview}
                  disabled={running}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {running ? "Running..." : "Run Preview"}
                </button>
                <button
                  onClick={submitUI}
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? "Submitting..." : "Submit for Grading"}
                </button>
              </div>
            </div>
            <div className="h-[800px] border border-gray-200 rounded-md overflow-hidden">
              <CodeEditor code={code} setCode={handleCodeChange} />
            </div>
            {status && (
              <div className={`mt-4 p-4 rounded-lg border ${isAwaitingManual ? "bg-amber-50 border-amber-200" : status === "PASS" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${isAwaitingManual ? "text-amber-700" : status === "PASS" ? "text-green-700" : "text-red-700"
                    }`}>
                    {statusLabel} {score !== null ? `- Auto Score: ${score}%` : ""}
                  </span>
                  {score !== null && (
                    <span className="text-sm text-gray-600">Automated Score (50% of total) | Pass threshold ≥ {passThreshold}%</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Final verdict is published after manual grading.
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Output (Preview)</h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center" style={{ width: "290px", height: "620px" }}>
              {previewUrl ? (
                <img
                  src={`${API_ORIGIN}${previewUrl}`}
                  alt="UI Preview"
                  className="object-contain"
                  style={{ width: "270px", height: "600px" }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-500">
                  Click "Run Preview" to see your output.
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-sm font-semibold text-red-800">Error</div>
            <div className="text-sm text-red-600 mt-1">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
