import { useEffect, useRef, useState, useCallback } from "react";
import { fetchTest, fetchTestMeta, executeTest, executeCustom, finishTest } from "../api/testApi";
import CodeEditor from "../components/CodeEditor";
import ProblemPanel from "../components/ProblemPanel";
import logo from "../../logo.png";
import {
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  BookOpen,
  Code2,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from "lucide-react";

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

  // Custom Run State
  const [customInput, setCustomInput] = useState("");
  const [customOutput, setCustomOutput] = useState("");
  const [customLoading, setCustomLoading] = useState(false);

  // Timer & Session State
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [timerEndAt, setTimerEndAt] = useState(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState(0);
  const [autoFinished, setAutoFinished] = useState(false);
  const autoFinishPendingRef = useRef(false);
  const storageKey = sessionId ? `test-${sessionId}` : null;

  // Responsive & Dock Layout State
  const [mobileTab, setMobileTab] = useState("problem"); // "problem" | "code" | "results"
  const [bottomTab, setBottomTab] = useState("testcases"); // "testcases" | "custom"
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);
  const [dockHeightMode, setDockHeightMode] = useState("normal"); // "normal" | "collapsed" | "expanded"

  const [leftPanelPercent, setLeftPanelPercent] = useState(() => {
    try {
      const saved = localStorage.getItem("test_split_percent");
      if (saved) {
        const val = parseFloat(saved);
        if (val >= 25 && val <= 75) return val;
      }
    } catch {}
    return 46; // Balanced default ~46% problem, ~54% editor + results
  });

  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const workspaceRef = useRef(null);

  const startDragging = useCallback((e) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;

    function handleMove(e) {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const newWidth = clientX - rect.left;
      const percent = (newWidth / rect.width) * 100;
      // Clamp between 28% and 72%
      const clamped = Math.min(Math.max(percent, 28), 72);
      setLeftPanelPercent(clamped);
    }

    function handleEnd() {
      setIsDraggingSplit(false);
      try {
        localStorage.setItem("test_split_percent", leftPanelPercent.toString());
      } catch {}
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDraggingSplit, leftPanelPercent]);

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

        // Fetch already submitted codes from DB
        const dbSubmittedCode = data.submittedCode || {};
        const dbSubmissionStatuses = data.submissionStatuses || {};

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
        // Merge: starter code -> DB submitted code -> unsaved local drafts
        const mergedMap = { ...initialCodeMap, ...dbSubmittedCode, ...storedMap };
        setCodeByQuestionId(mergedMap);
        setCode(mergedMap[normalized[0]?.id] ?? "");

        // Restore submission verdicts from DB
        const restoredResults = {};
        for (const q of normalized) {
          if (dbSubmissionStatuses[q.id]) {
            restoredResults[q.id] = {
              status: dbSubmissionStatuses[q.id],
              tests: q.testCases || [],
            };
          }
        }
        setResultsByQuestionId(restoredResults);
        setResults(restoredResults[normalized[0]?.id] || null);
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
    if (!storageKey || initializing) return;
    if (Object.keys(codeByQuestionId).length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(codeByQuestionId));
    } catch {}
  }, [storageKey, codeByQuestionId, initializing]);

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

  function handleResetCode() {
    if (!activeQuestion) return;
    if (confirm("Reset editor to starter code for this question?")) {
      const initial = activeQuestion.starter_code || "";
      handleCodeChange(initial);
    }
  }

  function handleSelectQuestion(index) {
    const nextQuestion = questions[index];
    if (!nextQuestion) return;

    setActiveIndex(index);
    setCode(codeByQuestionId[nextQuestion.id] ?? "");
    setResults(resultsByQuestionId[nextQuestion.id] ?? null);
    setSelectedTestCaseIdx(0);
    setError("");
  }

  async function submitCode() {
    if (!sessionId || !activeQuestion) return;

    setLoading(true);
    setError("");
    setBottomTab("testcases");
    if (dockHeightMode === "collapsed") {
      setDockHeightMode("normal");
    }

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

      // On small screens (< lg), switch to results tab only if student was editing code; do not hide problem
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        if (mobileTab === "code") {
          setMobileTab("results");
        }
      }
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
    setBottomTab("custom");
    if (dockHeightMode === "collapsed") {
      setDockHeightMode("normal");
    }

    try {
      const res = await executeCustom({
        code: codeByQuestionId[activeQuestion.id] ?? code,
        customInput,
      });

      setCustomOutput(res?.output ?? "");
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        if (mobileTab === "code") {
          setMobileTab("results");
        }
      }
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
      setShowFinishModal(false);
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

  const isLowTime = remainingSeconds !== null && remainingSeconds < 300;
  const timeLabel = remainingSeconds !== null
    ? `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`
    : null;

  if (initializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
          <Code2 className="w-6 h-6 text-blue-400" />
        </div>
        <p className="text-sm font-medium text-slate-400">Loading your test environment…</p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-rose-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Unable to load test</h2>
          <p className="text-sm text-slate-600">{error || "No questions available for this level."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sampleCases = (activeQuestion?.testCases || []).filter(tc => !tc.isHidden && !tc.is_hidden);
  const executionTests = results?.tests || [];

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-3 shrink-0 z-30 shadow-xs">
        {/* Left: Branding & Level */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 hidden sm:block">
            <img src={logo} alt="Portal" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-slate-800 text-sm tracking-tight truncate hidden md:inline">
              PCDP Coding Assessment
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              Level {level}
            </span>
          </div>
        </div>

        {/* Center: Question Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1">
          {questions.map((q, idx) => {
            const isCurrent = idx === activeIndex;
            const qResult = resultsByQuestionId[q.id];
            const hasPassed = qResult?.status === "PASS";
            const hasFailed = qResult?.status === "FAIL";

            return (
              <button
                key={q.id}
                onClick={() => handleSelectQuestion(idx)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${isCurrent
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                <span>Q{idx + 1}</span>
                {hasPassed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                {hasFailed && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
              </button>
            );
          })}
        </div>

        {/* Right: Timer & Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {timeLabel && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-all ${isLowTime
                  ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                  : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLabel}</span>
            </div>
          )}

          <button
            onClick={submitCode}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{loading ? "Running..." : "Submit & Test"}</span>
            <span className="sm:hidden">{loading ? "..." : "Submit"}</span>
          </button>

          <button
            onClick={() => setShowFinishModal(true)}
            disabled={finishing}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Finish
          </button>
        </div>
      </header>

      {/* Mobile Navigation Segmented Tabs (< lg) */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-1.5 flex items-center justify-around gap-1 shrink-0 z-20">
        <button
          onClick={() => setMobileTab("problem")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 ${mobileTab === "problem"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "text-slate-600 hover:bg-slate-50"
            }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Problem</span>
        </button>
        <button
          onClick={() => setMobileTab("code")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 ${mobileTab === "code"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "text-slate-600 hover:bg-slate-50"
            }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>
        <button
          onClick={() => setMobileTab("results")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 relative ${mobileTab === "results"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "text-slate-600 hover:bg-slate-50"
            }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Results</span>
          {results && (
            <span
              className={`w-2 h-2 rounded-full ${results.status === "PASS" ? "bg-emerald-500" : "bg-rose-500"
                }`}
            />
          )}
        </button>
      </div>

      {/* Main Workspace */}
      <div 
        ref={workspaceRef}
        className={`flex-1 flex min-h-0 overflow-hidden relative ${
          isDraggingSplit ? "cursor-col-resize select-none" : ""
        }`}
      >
        {/* Left Column: Problem Panel */}
        <div
          style={showLeftPanel ? { width: `${leftPanelPercent}%` } : undefined}
          className={`bg-white border-r border-slate-200 flex flex-col shrink-0 min-w-[300px] max-w-[75%] ${
            isDraggingSplit ? "" : "transition-[width] duration-150"
          } ${
            showLeftPanel ? "lg:flex" : "lg:hidden"
          } ${mobileTab === "problem" ? "max-lg:flex max-lg:flex-1 max-lg:w-full" : "max-lg:hidden"}`}
        >
          <div className="h-10 bg-slate-50 border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between text-xs font-semibold text-slate-700 shrink-0">
            <span className="flex items-center gap-1.5 truncate">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Description & Test Cases</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setLeftPanelPercent(p => p > 48 ? 40 : 52)}
                className="hidden lg:flex px-2 py-0.5 rounded text-[11px] font-mono text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                title="Toggle width (40% / 52%)"
              >
                {Math.round(leftPanelPercent)}%
              </button>
              <button
                onClick={() => setShowLeftPanel(false)}
                className="hidden lg:flex p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                title="Collapse problem panel"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ProblemPanel question={activeQuestion} />
          </div>
        </div>

        {/* Resizer Splitter Handle (Desktop) */}
        {showLeftPanel && (
          <div
            onMouseDown={startDragging}
            onTouchStart={startDragging}
            onDoubleClick={() => setLeftPanelPercent(46)}
            title="Drag to resize panels (Double-click to reset)"
            className={`hidden lg:flex w-3 -ml-1.5 z-30 cursor-col-resize items-center justify-center group relative hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors select-none ${
              isDraggingSplit ? "bg-blue-500/30" : ""
            }`}
          >
            <div className={`w-1 h-8 rounded-full transition-colors ${
              isDraggingSplit ? "bg-blue-600" : "bg-slate-300 group-hover:bg-blue-500"
            }`} />
          </div>
        )}

        {/* Expand Left Panel Button (Desktop when collapsed) */}
        {!showLeftPanel && (
          <button
            onClick={() => setShowLeftPanel(true)}
            className="hidden lg:flex absolute left-2 top-2 z-20 p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            title="Expand problem panel"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Right Column: Code Editor & Bottom Results Dock */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-white ${
            mobileTab === "problem" ? "max-lg:hidden" : "flex"
          }`}
        >
          {/* Editor Sub-header */}
          <div
            className={`h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between text-xs font-mono shrink-0 ${
              mobileTab === "results" ? "max-lg:hidden" : "flex"
            }`}
          >
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>solution.dart</span>
            </div>
            <div className="flex items-center gap-3 font-sans">
              <button
                onClick={handleResetCode}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                title="Reset to starter code"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div
            className={`flex-1 min-h-[220px] overflow-hidden ${
              mobileTab === "results" ? "max-lg:hidden" : "block"
            } ${dockHeightMode === "expanded" ? "hidden" : "block"}`}
          >
            <CodeEditor code={code} setCode={handleCodeChange} />
          </div>

          {/* Bottom Results & Custom Dock */}
          <div
            className={`border-t border-slate-200 bg-white flex flex-col transition-all duration-150 ${
              dockHeightMode === "collapsed"
                ? "h-10 shrink-0"
                : dockHeightMode === "expanded"
                ? "flex-1 h-full"
                : "h-[280px] sm:h-[300px] shrink-0"
            } ${
              mobileTab === "code" ? "max-lg:hidden" : "flex"
            } ${mobileTab === "results" ? "max-lg:flex-1 max-lg:h-full" : ""}`}
          >
            {/* Dock Header Tabs */}
            <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBottomTab("testcases");
                    if (dockHeightMode === "collapsed") setDockHeightMode("normal");
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    bottomTab === "testcases"
                      ? "bg-white text-blue-700 border border-slate-200 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  <span>Test Results</span>
                  {results && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        results.status === "PASS"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {results.status}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setBottomTab("custom");
                    if (dockHeightMode === "collapsed") setDockHeightMode("normal");
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    bottomTab === "custom"
                      ? "bg-white text-blue-700 border border-slate-200 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Play className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Custom Test</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {results && (
                  <div className="flex items-center gap-2 text-xs">
                    {results.executionTimeMs !== undefined && (
                      <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">
                        {results.executionTimeMs}ms
                      </span>
                    )}
                  </div>
                )}

                {/* Dock Height Controls for Desktop */}
                <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 pl-2">
                  {dockHeightMode !== "collapsed" ? (
                    <button
                      onClick={() => setDockHeightMode("collapsed")}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                      title="Minimize dock"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setDockHeightMode("normal")}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                      title="Restore dock height"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {dockHeightMode === "expanded" ? (
                    <button
                      onClick={() => setDockHeightMode("normal")}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                      title="Restore normal height"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setDockHeightMode("expanded")}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                      title="Expand dock full height"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dock Content Body */}
            {dockHeightMode !== "collapsed" && (
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-slate-50/50">
              {bottomTab === "testcases" ? (
                <div className="space-y-3">
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{error}</div>
                    </div>
                  )}

                  {!results && !loading && !error && (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <Play className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-600">No test runs yet</p>
                      <p className="text-[11px] text-slate-400">
                        Click "Submit & Test" to evaluate your solution against test cases.
                      </p>
                    </div>
                  )}

                  {loading && (
                    <div className="py-8 text-center text-slate-500 space-y-2">
                      <div className="w-6 h-6 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-medium">Compiling & executing Flutter test cases…</p>
                    </div>
                  )}

                  {results && (
                    <div className="space-y-3">
                      {/* Overall Verdict Banner */}
                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between ${results.status === "PASS"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {results.status === "PASS" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          )}
                          <div>
                            <div className="text-xs font-bold">
                              {results.status === "PASS" ? "All Test Cases Passed!" : "Execution Failed / Tests Did Not Pass"}
                            </div>
                            <div className="text-[11px] opacity-85">
                              {results.status === "PASS"
                                ? "Great job! Your code satisfies the required assertions."
                                : "Check the outputs below to debug and fix failing assertions."}
                            </div>
                          </div>
                        </div>
                        {results.sessionStatus && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/80 border">
                            Session: {results.sessionStatus}
                          </span>
                        )}
                      </div>

                      {/* Debug or Compiler Output if present */}
                      {results.debugOutput && (
                        <div className="p-3 bg-slate-900 text-rose-300 font-mono text-xs rounded-xl border border-slate-800 whitespace-pre-wrap">
                          <div className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Compiler / Runtime Output</div>
                          {results.debugOutput}
                        </div>
                      )}

                      {/* Test Case Breakdown Tabs */}
                      {sampleCases.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {sampleCases.map((tc, idx) => {
                              const match = executionTests.find(t => Number(t.testCaseId) === Number(tc.id));
                              const tcStatus = match?.status ?? tc.status ?? "NOT_TESTED";
                              const isSelected = selectedTestCaseIdx === idx;

                              return (
                                <button
                                  key={tc.id || idx}
                                  onClick={() => setSelectedTestCaseIdx(idx)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all shrink-0 ${isSelected
                                      ? "bg-white border-blue-400 text-blue-700 shadow-xs font-semibold"
                                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-white"
                                    }`}
                                >
                                  {tcStatus === "PASS" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                  {tcStatus === "FAIL" && <XCircle className="w-3 h-3 text-rose-600" />}
                                  {tcStatus === "NOT_TESTED" && <Clock className="w-3 h-3 text-slate-400" />}
                                  <span>Case {idx + 1}</span>
                                </button>
                              );
                            })}
                          </div>

                          {sampleCases[selectedTestCaseIdx] && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono space-y-2 shadow-xs">
                              <div>
                                <span className="text-[10px] font-sans text-slate-400 block font-semibold">Input</span>
                                <pre className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-800 whitespace-pre-wrap">
                                  {sampleCases[selectedTestCaseIdx].input || "<none>"}
                                </pre>
                              </div>
                              <div>
                                <span className="text-[10px] font-sans text-slate-400 block font-semibold">Expected Output</span>
                                <pre className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-800 whitespace-pre-wrap">
                                  {sampleCases[selectedTestCaseIdx].expectedOutput ?? sampleCases[selectedTestCaseIdx].expected_output ?? "<none>"}
                                </pre>
                              </div>
                              {(() => {
                                const match = executionTests.find(
                                  t => Number(t.testCaseId) === Number(sampleCases[selectedTestCaseIdx].id)
                                );
                                if (match?.output) {
                                  return (
                                    <div>
                                      <span className="text-[10px] font-sans text-slate-400 block font-semibold">Actual Output</span>
                                      <pre className={`p-2 rounded border whitespace-pre-wrap ${match.status === "PASS"
                                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                          : "bg-rose-50 border-rose-200 text-rose-800"
                                        }`}>
                                        {match.output}
                                      </pre>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Custom Input Runner */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">Custom Input</span>
                      <button
                        onClick={runCustomInput}
                        disabled={customLoading}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <Play className="w-3 h-3" />
                        <span>{customLoading ? "Running..." : "Run Code"}</span>
                      </button>
                    </div>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom test input..."
                      className="flex-1 min-h-[90px] w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">Output</span>
                    </div>
                    <pre className="flex-1 min-h-[90px] p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 whitespace-pre-wrap overflow-y-auto shadow-inner">
                      {customOutput || (customLoading ? "Executing code..." : "Run code with custom input to see output.")}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Finish Test */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-800">Finish Test?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to end your test session? You won't be able to make further submissions.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {finishing ? "Finishing..." : "Confirm & Finish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
