import { useEffect, useRef, useState } from "react";
import { fetchTest, fetchTestMeta, executeUiPreview, executeUiSubmit, fetchExecutionRun, cancelExecutionRun, finishTest } from "../api/testApi";
import CodeEditor from "../components/CodeEditor";
import { API_BASE_ROOT } from "../api/apiBase.js";

const API_ORIGIN = API_BASE_ROOT;

function getQuestionFileMap(codeEntry, fallbackCode = "") {
  if (typeof codeEntry === "object" && codeEntry !== null && Object.keys(codeEntry).length > 0) {
    return codeEntry;
  }
  if (typeof codeEntry === "string" && codeEntry.trim()) {
    try {
      const parsed = JSON.parse(codeEntry);
      if (typeof parsed === "object" && parsed !== null && Object.keys(parsed).length > 0) {
        return parsed;
      }
    } catch { }
    return { "lib/main.dart": codeEntry };
  }
  return { "lib/main.dart": fallbackCode };
}

function buildInitialCodeMap(questions) {
  return questions.reduce((acc, question) => {
    let initial = question.starter_code ?? "";
    if (question.projectFiles) {
      try {
        const parsed = typeof question.projectFiles === 'string' ? JSON.parse(question.projectFiles) : question.projectFiles;
        if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) {
          acc[question.id] = parsed;
          return acc;
        }
      } catch { }
    }
    acc[question.id] = { "lib/main.dart": initial };
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
  const [executionRunId, setExecutionRunId] = useState("");
  const [executionRunStatus, setExecutionRunStatus] = useState("");
  const [error, setError] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [timerEndAt, setTimerEndAt] = useState(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState(0);
  const [autoFinished, setAutoFinished] = useState(false);
  const [rightTab, setRightTab] = useState("preview"); // "preview" | "mockup" | "split"
  
  // Multi-file and dynamic LeetCode panel states
  const [activeFilePath, setActiveFilePath] = useState("lib/main.dart");
  const [newFileName, setNewFileName] = useState("");
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  
  const autoFinishPendingRef = useRef(false);
  const storageKey = sessionId ? `ui-test-${sessionId}` : null;

  const activeQuestion = questions[activeIndex];
  const activeQuestionId = activeQuestion?.id;
  
  const currentFileMap = getQuestionFileMap(codeByQuestionId[activeQuestionId], activeQuestion?.starter_code);
  const currentEditorCode = currentFileMap[activeFilePath] !== undefined ? currentFileMap[activeFilePath] : (Object.values(currentFileMap)[0] || "");

  function renderInteractivePreview(url, title) {
    if (!url) return null;

    return (
      <iframe
        src={`${API_ORIGIN}${url}`}
        title={title}
        className="w-full h-full bg-white border-0"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
      />
    );
  }

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
        setExecutionRunId("");
        setExecutionRunStatus("");
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
    if (!executionRunId) return;

    let isMounted = true;
    let intervalId = null;

    async function syncExecutionStatus() {
      try {
        const res = await fetchExecutionRun(executionRunId);
        if (!isMounted) return;

        const run = res.run || {};
        setExecutionRunStatus(run.status || "");

        if (run.status && run.status !== "RUNNING") {
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      } catch {
        // keep last known status
      }
    }

    syncExecutionStatus();
    intervalId = setInterval(syncExecutionStatus, 2000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [executionRunId]);

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

    setCodeByQuestionId(prev => {
      const currentMap = getQuestionFileMap(prev[activeQuestionId], activeQuestion?.starter_code);
      const nextMap = { ...currentMap, [activeFilePath]: value || "" };
      return {
        ...prev,
        [activeQuestionId]: nextMap,
      };
    });
  }

  function handleAddFile() {
    if (!newFileName.trim()) return;
    let name = newFileName.trim().replace(/\\/g, '/');
    if (!name.startsWith('lib/') && !name.startsWith('test/') && name !== 'pubspec.yaml') {
      name = 'lib/' + name;
    }
    if (currentFileMap[name] !== undefined) {
      alert('File already exists');
      return;
    }
    const nextMap = { ...currentFileMap, [name]: '// New file: ' + name + '\n' };
    setCodeByQuestionId(prev => ({ ...prev, [activeQuestionId]: nextMap }));
    setActiveFilePath(name);
    setNewFileName('');
    setShowAddFileModal(false);
  }

  function handleDeleteFile(pathToDelete) {
    if (Object.keys(currentFileMap).length <= 1) {
      alert('You must have at least one file in the workspace.');
      return;
    }
    if (!confirm(`Delete ${pathToDelete}?`)) return;
    const nextMap = { ...currentFileMap };
    delete nextMap[pathToDelete];
    setCodeByQuestionId(prev => ({ ...prev, [activeQuestionId]: nextMap }));
    if (activeFilePath === pathToDelete) {
      setActiveFilePath(Object.keys(nextMap)[0]);
    }
  }

  function handleSelectQuestion(index) {
    const nextQuestion = questions[index];
    if (!nextQuestion) return;

    setActiveIndex(index);
    const nextMap = getQuestionFileMap(codeByQuestionId[nextQuestion.id], nextQuestion.starter_code);
    const firstKey = Object.keys(nextMap)[0] || "lib/main.dart";
    setActiveFilePath(firstKey);
    setCode(nextMap[firstKey] ?? "");
    setError("");
    setPreviewUrl("");
    setScore(null);
    setStatus(null);
  }

  async function runPreview() {
    if (!sessionId || !activeQuestion) return;

    setRunning(true);
    setError("");
    setRightTab("preview");

    try {
      const res = await executeUiPreview({
        sessionId,
        problemId: activeQuestion.id,
        code: currentFileMap,
      });
      setPreviewUrl(res.previewUrl || "");
      setExecutionRunId(res.runId || "");
      setExecutionRunStatus(res.runId ? "RUNNING" : "");
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
        code: currentFileMap,
      });
      setScore(res.score ?? null);
      setStatus(res.status || null);
      setExecutionRunId(res.runId || "");
      setExecutionRunStatus(res.runId ? "RUNNING" : "");
    } catch (err) {
      setError(err?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function stopExecution() {
    if (!executionRunId) return;

    try {
      const res = await cancelExecutionRun(executionRunId, { reason: "Stopped by student" });
      setExecutionRunStatus(res.run?.status || "CANCELLED");
    } catch (err) {
      setError(err?.message || "Failed to stop execution.");
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
  const mockupUrl = activeQuestion?.referenceMockupUrl || activeQuestion?.referenceImageUrl;

  if (initializing) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center text-slate-700 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <div className="text-base font-medium">Loading Interactive Workspace…</div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">!</div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Workspace Unavailable</h3>
          <p className="text-sm text-rose-600 mb-6">{error || "No questions available for this assessment session."}</p>
          <button
            onClick={onLogout}
            className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-semibold text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse" />
            <span className="font-bold tracking-tight text-slate-800 text-base">Flutter Portal</span>
          </div>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 text-sm">Interactive Web Workspace</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
              Level {level}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                showLeftPanel ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Toggle Problem Panel"
            >
              <span>{showLeftPanel ? "◀" : "▶"}</span>
              <span>Problem</span>
            </button>
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                showRightPanel ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Toggle Preview Panel"
            >
              <span>Preview</span>
              <span>{showRightPanel ? "▶" : "◀"}</span>
            </button>
          </div>
          {timeLabel && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-sm font-semibold text-amber-800 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{timeLabel}</span>
            </div>
          )}
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-1.5 text-sm font-semibold shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {finishing ? "Finishing..." : "Finish Test"}
          </button>
        </div>
      </header>

      {/* Main 3-Column IDE Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        
        {/* Left Column: Problem Description & Requirements */}
        {showLeftPanel && (
          <div className="w-full lg:w-[360px] xl:w-[420px] max-h-[350px] lg:max-h-none lg:h-full flex flex-col bg-white border-b lg:border-b-0 lg:border-r border-slate-200 shrink-0 overflow-hidden shadow-sm">
            {/* Question Tabs Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => handleSelectQuestion(index)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    index === activeIndex
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Question {index + 1}
                </button>
              ))}
            </div>

            {/* Scrollable Problem Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-base font-bold text-slate-800 tracking-wide">Problem Description</h3>
                </div>
                <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-normal bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {activeQuestion?.description || "No description provided."}
                </div>
              </div>

              {/* Required Widgets */}
              {activeQuestion?.uiRequiredWidgets?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    <h4 className="text-sm font-bold text-slate-800 tracking-wide">Required Widgets</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeQuestion.uiRequiredWidgets.map(widget => (
                      <span
                        key={widget}
                        className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shadow-sm"
                      >
                        {widget}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Provided Resources */}
              {activeQuestion?.resourceUrls?.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Provided Resources</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Use exact asset paths in your code:
                  </p>
                  <div className="space-y-2">
                    {activeQuestion.resourceUrls.map((url, idx) => {
                      const filename = url.split('/').pop();
                      const assetPath = `assets/images/${filename}`;
                      return (
                        <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <img
                            src={`${API_ORIGIN}${url}`}
                            alt="Resource thumbnail"
                            className="w-10 h-10 object-contain bg-slate-50 rounded p-1 border border-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-800 truncate">{filename}</div>
                            <code className="text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 block w-fit mt-1 select-all font-mono">
                              {assetPath}
                            </code>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Center Column: Full-Height Code Editor & Actions */}
        <div className="flex-1 min-h-[500px] lg:min-h-0 lg:h-full flex flex-col min-w-0 bg-white border-b lg:border-b-0 border-slate-200">
          {/* Editor Action Bar */}
          <div className="h-14 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>{activeFilePath}</span>
              </div>
              {executionRunId && (
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 ${
                  executionRunStatus === "RUNNING"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : executionRunStatus === "OK" || executionRunStatus === "PASS"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : executionRunStatus === "FAILED"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  {executionRunStatus === "RUNNING" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                  Run {executionRunId.slice(0, 8)} {executionRunStatus ? `· ${executionRunStatus}` : ""}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={runPreview}
                disabled={running}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>{running ? "Running..." : "Run Preview"}</span>
              </button>
              <button
                onClick={stopExecution}
                disabled={!executionRunId || executionRunStatus !== "RUNNING"}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition-all flex items-center gap-1 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                <span>Stop</span>
              </button>
              <button
                onClick={submitUI}
                disabled={submitting}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{submitting ? "Submitting..." : "Submit for Grading"}</span>
              </button>
            </div>
          </div>

          {/* Tabbed Multi-File IDE Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {Object.keys(currentFileMap).map(filePath => (
                <div
                  key={filePath}
                  onClick={() => setActiveFilePath(filePath)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-medium cursor-pointer border transition-all shrink-0 ${
                    activeFilePath === filePath
                      ? "bg-white text-blue-700 border-blue-300 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span>{filePath}</span>
                  {Object.keys(currentFileMap).length > 1 && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleDeleteFile(filePath); }}
                      className="hover:text-rose-600 text-slate-400 font-bold ml-1 px-1 rounded hover:bg-rose-50"
                      title="Delete File"
                    >
                      ✕
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showAddFileModal ? (
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-300 shadow-sm">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="lib/models/cart.dart"
                    className="w-40 px-2 py-0.5 bg-white text-slate-800 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleAddFile}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddFileModal(false)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddFileModal(true)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold border border-slate-300 shadow-sm transition-colors flex items-center gap-1"
                >
                  <span>+ Add File</span>
                </button>
              )}
            </div>
          </div>

          {/* Full-Height Monaco Editor */}
          <div className="flex-1 min-h-0 w-full relative p-2 bg-slate-100">
            <CodeEditor code={currentEditorCode} setCode={handleCodeChange} />
          </div>

          {/* Docked Status & Error Banner */}
          {error && (
            <div className="shrink-0 bg-rose-50 border-t border-rose-200 p-3.5 px-5 flex items-center justify-between text-rose-800 text-xs font-medium">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-900 font-bold ml-4">✕</button>
            </div>
          )}

          {status && (
            <div className={`shrink-0 border-t p-3.5 px-5 flex items-center justify-between text-xs font-semibold ${
              isAwaitingManual
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : status === "PASS"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
            }`}>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isAwaitingManual ? "bg-amber-100 text-amber-800" : status === "PASS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}>
                  {statusLabel}
                </span>
                {score !== null && (
                  <span className="text-slate-800 text-sm font-bold">
                    Automated Widget Score: <span className="underline decoration-2 text-blue-600">{score}%</span>
                  </span>
                )}
                {score !== null && (
                  <span className="text-slate-500 font-normal">
                    (50% of total verdict · Pass threshold ≥ {passThreshold}%)
                  </span>
                )}
              </div>
              <div className="text-slate-600 font-normal">
                Final verdict published after teacher review.
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Preview & Design Mockup Workspace */}
        {showRightPanel && (
          <div className="w-full lg:w-[380px] xl:w-[440px] min-h-[660px] lg:min-h-0 lg:h-full flex flex-col bg-white lg:border-l border-slate-200 shrink-0 overflow-hidden shadow-sm">
            {/* Segmented Control Tab Bar */}
            <div className="h-14 px-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300/70 w-full">
                <button
                  onClick={() => setRightTab("preview")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    rightTab === "preview"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Live Preview</span>
                </button>
                <button
                  onClick={() => setRightTab("mockup")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    rightTab === "mockup"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span>Design Mockup</span>
                </button>
                <button
                  onClick={() => setRightTab("split")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    rightTab === "split"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a1 1 0 00-2 0v7h2V4zM15 4a1 1 0 10-2 0v7h2V4zM3 13a1 1 0 000 2h14a1 1 0 100-2H3z" />
                  </svg>
                  <span>Split Compare</span>
                </button>
              </div>
            </div>

            {/* Dynamic Panel Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col items-center justify-start bg-slate-50/50 gap-6 custom-scrollbar">
              
              {/* Live Web Preview Section */}
              {(rightTab === "preview" || rightTab === "split") && (
                <div className={`w-full max-w-[340px] flex flex-col items-center ${rightTab === "preview" ? "h-full justify-center" : ""}`}>
                  {rightTab === "split" && (
                    <div className="w-full text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>Live Web Preview</span>
                    </div>
                  )}
                  <div className="w-full h-[620px] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col relative shrink-0">
                    {previewUrl ? (
                      renderInteractivePreview(previewUrl, "Live Web Preview")
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 text-slate-600">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Preview Not Launched</h4>
                        <p className="text-xs text-slate-500 mb-4">Click "Run Preview" above to compile and launch your interactive web application.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Design Mockup Section */}
              {(rightTab === "mockup" || rightTab === "split") && (
                <div className={`w-full max-w-[340px] flex flex-col items-center ${rightTab === "mockup" ? "h-full justify-center" : ""}`}>
                  {rightTab === "split" && (
                    <div className="w-full text-xs font-bold uppercase tracking-wider text-purple-600 mb-2 flex items-center gap-1.5 pt-2 border-t border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      <span>Design Mockup (Reference)</span>
                    </div>
                  )}
                  <div className="w-full h-[620px] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-2 relative shrink-0">
                    {mockupUrl ? (
                      <img
                        src={`${API_ORIGIN}${mockupUrl}`}
                        alt="Design Mockup"
                        className="w-full h-full object-contain rounded-lg bg-white"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">No design mockup uploaded for this question.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
