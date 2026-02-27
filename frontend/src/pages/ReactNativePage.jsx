import { useState, useEffect, useRef, useCallback } from "react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { Code, Clock, Play, Save, RotateCcw, Layout, Terminal, Maximize2, Minimize2, PanelLeftClose, PanelLeft, Settings, ChevronRight, User, X, ZoomIn, ArrowLeft } from 'lucide-react';

import RNCodeEditor from "../components/RNCodeEditor";
import RNEmulator from "../components/RNEmulator";
import ProblemViewer from "../components/ProblemViewer";
import AssessmentTimer from "../components/AssessmentTimer";
import { executeReactNative } from "../api/reactNativeApi";
import { getAssessmentSession, getCurrentProblem, submitUISolution, endTest } from "../api/reactNativeProblemApi";
import { useAuth } from "../context/AuthContext";

const DEFAULT_CODE = `import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, React Native!</Text>
      <Text style={styles.subtitle}>Welcome to MobileDev Portal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});`;

export default function ReactNativePage({ level = '3A', durationMinutes = 90, onEndTest }) {
    const { user } = useAuth();
    const [code, setCode] = useState(DEFAULT_CODE);
    const [embedUrl, setEmbedUrl] = useState(null);

    const [output, setOutput] = useState(null);
    const [html, setHtml] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snackUrl, setSnackUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('preview'); // 'question' | 'preview' | 'vm'
    const [problem, setProblem] = useState(null);
    const [problemLoading, setProblemLoading] = useState(false);
    const [problemError, setProblemError] = useState(null);
    const [problemType, setProblemType] = useState(null); // 'CODE' | 'UI'
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    // Layout state
    const [isProblemVisible, setIsProblemVisible] = useState(true);
    const [leftWidth, setLeftWidth] = useState(550);
    const [rightWidth, setRightWidth] = useState(450);
    const containerRef = useRef(null);
    const draggingRef = useRef(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    // Drag-to-resize handlers
    const handleMouseDown = useCallback((handle, e) => {
        e.preventDefault();
        draggingRef.current = handle;
        startXRef.current = e.clientX;
        startWidthRef.current = handle === 'left' ? leftWidth : rightWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [leftWidth, rightWidth]);

    useEffect(() => {
        function onMouseMove(e) {
            if (!draggingRef.current) return;
            const delta = e.clientX - startXRef.current;
            if (draggingRef.current === 'left') {
                const newWidth = Math.max(200, Math.min(600, startWidthRef.current + delta));
                setLeftWidth(newWidth);
            } else {
                const newWidth = Math.max(200, Math.min(600, startWidthRef.current - delta));
                setRightWidth(newWidth);
            }
        }
        function onMouseUp() {
            if (draggingRef.current) {
                draggingRef.current = null;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        }
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    // Load problem via session on mount (random assignment with persistence)
    useEffect(() => {
        async function initializeAssessment() {
            setProblemLoading(true);
            setProblemError(null);

            try {
                // Step 1: Get or create session
                const session = await getAssessmentSession(level);

                // Step 2: Fetch the current assigned problem
                const problemData = await getCurrentProblem(level);

                if (problemData.success) {
                    const prob = {
                        id: problemData.id,
                        title: problemData.title,
                        description: problemData.description,
                        starterCode: problemData.starterCode,
                        problemType: problemData.problemType,
                        level: problemData.level || '3A',
                        sampleImage: problemData.sampleImage,
                        sampleTests: problemData.sampleTests || [],
                        hiddenTestCount: problemData.hiddenTestCount || 0,
                    };

                    setProblem(prob);
                    setCode(prob.starterCode || DEFAULT_CODE);
                    setProblemType(prob.problemType || 'UI');

                    // Store session & problem in localStorage as backup
                    localStorage.setItem('assessment_session', JSON.stringify({
                        sessionId: session.sessionId,
                        problemIds: session.problemIds,
                        level: level,
                        startedAt: session.startedAt
                    }));
                    localStorage.setItem('current_problem', JSON.stringify(prob));

                    // Restore saved code if available (in case of page reload mid-test)
                    const savedCode = localStorage.getItem('assessment_code');
                    if (savedCode && savedCode.trim() !== '') {
                        setCode(savedCode);
                        console.log('Restored code from localStorage');
                    }
                }
            } catch (err) {
                console.error('Session loading error:', err);
                setProblemError(err.message || 'Failed to load assessment session');

                // Fallback: Try to load from localStorage
                try {
                    const cachedProblem = localStorage.getItem('current_problem');
                    if (cachedProblem) {
                        const prob = JSON.parse(cachedProblem);
                        setProblem(prob);
                        setProblemType(prob.problemType || 'UI');

                        // Restore saved code
                        const savedCode = localStorage.getItem('assessment_code');
                        if (savedCode) {
                            setCode(savedCode);
                        } else {
                            setCode(prob.starterCode || DEFAULT_CODE);
                        }
                        console.log('Loaded from cache (offline mode)');
                    }
                } catch (cacheErr) {
                    console.error('Cache loading error:', cacheErr);
                }
            } finally {
                setProblemLoading(false);
            }
        }

        initializeAssessment();
    }, []);

    // Auto-save code to localStorage whenever it changes
    useEffect(() => {
        if (code && code !== DEFAULT_CODE) {
            localStorage.setItem('assessment_code', code);
        }
    }, [code]);

    const handleRun = async () => {
        setLoading(true);
        setError(null);
        setEmbedUrl(null);
        setOutput(null);
        setHtml(null);
        setActiveTab('preview'); // Auto-switch to preview on run

        try {
            const result = await executeReactNative(code);

            if (result.success) {
                if (result.html) {
                    setHtml(result.html);
                } else if (result.deviceUrl) {
                    setEmbedUrl(result.deviceUrl);
                    setSnackUrl(result.webUrl);
                } else if (result.output) {
                    setOutput(result.output);
                }
            } else {
                if (result.output) {
                    // If execution failed but we have output (e.g. tests failed), show output
                    setOutput(result.output);
                    setError(result.message || 'Execution failed');
                } else {
                    setError(result.message || 'Failed to compile code');
                }
            }
        } catch (err) {
            setError(err.message || 'An error occurred while compiling');
        } finally {
            setLoading(false);
        }
    };

    // UI-type problem submission handler with cleanup
    const handleSubmitUI = async () => {
        if (!problem?.id) {
            setError('No problem loaded');
            return;
        }

        if (!window.confirm("Are you ready to submit your solution?")) return;

        setSubmitting(true);
        setError(null);
        setSubmitSuccess(false);
        setSubmitMessage(null);

        try {
            const result = await submitUISolution(problem.id, code);
            setSubmitSuccess(true);
            setSubmitMessage(`Successfully submitted! Submission ID: ${result.submissionId}`);

            // Clear all session data after successful submission
            clearSessionData();

        } catch (err) {
            setError(err.message || 'Failed to submit solution');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEndTest = async () => {
        if (!window.confirm("Are you sure you want to end the test? Your current code will be submitted.")) {
            return;
        }

        setSubmitting(true);
        try {
            // Step 1: Submit current code if we have a problem
            if (problem?.id && code) {
                console.log('Submitting code before ending test...');
                await submitUISolution(problem.id, code);
            }

            // Step 2: End test on backend (deletes session)
            console.log('Ending test session...');
            await endTest(level);

            // Step 3: Clear local storage
            clearSessionData();

            // Step 4: Navigate away
            if (onEndTest) onEndTest();
        } catch (error) {
            console.error('Error ending test:', error);
            // Still clear local data even if API fails
            clearSessionData();
            if (onEndTest) onEndTest();
        } finally {
            setSubmitting(false);
        }
    };

    // Helper function to clear all session data
    const clearSessionData = () => {
        try {
            localStorage.removeItem('assessment_session');
            localStorage.removeItem('current_problem');
            localStorage.removeItem('assessment_code');
            console.log('Session data cleared after submission');
        } catch (err) {
            console.error('Error clearing session data:', err);
        }
    };

    // Loading state
    if (problemLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900 border-b border-slate-800">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading problem...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (problemError) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900">
                <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 max-w-md text-center">
                    <h3 className="text-red-400 font-semibold mb-2">Error Loading Problem</h3>
                    <p className="text-red-200 text-sm">{problemError}</p>
                    <p className="text-xs text-slate-500 mt-4">Try refreshing the page or contact admin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-900 text-slate-100 font-sans overflow-hidden">
            {/* Header - Dark Theme */}
            <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Code className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-wide">LEVEL {level}</h1>
                            <span className="text-xs text-slate-400 font-medium tracking-wider">REACT NATIVE SINGLE FILE</span>
                        </div>

                        {/* Student Info Display */}
                        {user && (
                            <div className="hidden md:flex items-center gap-6 px-4 py-1.5 bg-slate-900 rounded-md border border-slate-800 text-xs text-slate-400 ml-4">
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-purple-500" />
                                    <span className="font-semibold text-slate-200">{user.full_name}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Timer, Run/Submit, Finish */}
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 flex items-center gap-3">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <AssessmentTimer
                            durationMinutes={durationMinutes}
                            storageKey={`level_${level}_timer`}
                            className="text-sm font-mono font-medium text-slate-200"
                            minimal={true}
                        />
                    </div>

                    <div className="h-6 w-px bg-slate-800 mx-2" />

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRun}
                            disabled={loading}
                            className={`
                                flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all
                                ${loading
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'}
                            `}
                        >
                            {loading ? (
                                <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                            Run
                        </button>

                        <button
                            onClick={handleSubmitUI}
                            disabled={submitting}
                            className={`
                                flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all
                                ${submitting
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}
                            `}
                        >
                            {submitting ? (
                                <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            Submit
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-800 mx-2" />

                    <button
                        onClick={handleEndTest}
                        disabled={submitting}
                        className="px-4 py-1.5 text-xs font-bold text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 rounded-md transition-all uppercase tracking-wider"
                    >
                        {submitting ? 'Finishing...' : 'Finish Test'}
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden" ref={containerRef}>

                {/* Left Panel: Problem Description */}
                {isProblemVisible && (
                    <div
                        style={{ width: leftWidth }}
                        className="bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 relative"
                    >
                        <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Problem Description</span>
                            <button onClick={() => setIsProblemVisible(false)} className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800">
                                <PanelLeftClose className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                            {problem ? (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <h2 className="text-xl font-bold text-white mb-4">{problem.title}</h2>
                                    <ProblemViewer problem={problem} darkMode={true} />
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 mt-10">Loading description...</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Minimized Problem Toggle */}
                {!isProblemVisible && (
                    <div className="w-10 border-r border-slate-800 bg-slate-950 flex flex-col items-center py-4 gap-4 shrink-0">
                        <button
                            onClick={() => setIsProblemVisible(true)}
                            className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-blue-400 transition-colors"
                            title="Show Problem"
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Left Resize Handle */}
                {isProblemVisible && (
                    <div
                        onMouseDown={(e) => handleMouseDown('left', e)}
                        className="w-1.5 bg-slate-950 hover:bg-blue-600 cursor-col-resize transition-colors shrink-0"
                    />
                )}

                {/* Middle Panel: Code Editor */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-900 relative">
                    {/* Status / Error Messages Overlay */}
                    {(submitSuccess || error || submitMessage) && (
                        <div className="absolute top-2 left-2 right-2 z-20 pointer-events-none">
                            <div className="pointer-events-auto inline-block max-w-full">
                                {submitSuccess && submitMessage && (
                                    <div className="bg-emerald-900/90 border border-emerald-700/50 text-emerald-100 rounded-lg p-3 shadow-xl backdrop-blur-sm mb-2 animate-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                            <p className="text-sm font-medium">{submitMessage}</p>
                                            <button onClick={() => { setSubmitSuccess(false); setSubmitMessage(null); }} className="ml-2 text-emerald-400 hover:text-emerald-200">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {error && !submitSuccess && (
                                    <div className="bg-red-900/90 border border-red-700/50 text-red-100 rounded-lg p-3 shadow-xl backdrop-blur-sm animate-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-400" />
                                            <p className="text-sm font-medium">{error}</p>
                                            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-200">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden relative">
                        <RNCodeEditor
                            code={code}
                            setCode={setCode}
                            onRun={handleRun}
                            loading={loading}
                            theme="vs-dark"
                        />
                    </div>
                </div>

                {/* Right Resize Handle */}
                <div
                    onMouseDown={(e) => handleMouseDown('right', e)}
                    className="w-1.5 bg-slate-950 hover:bg-blue-600 cursor-col-resize transition-colors shrink-0"
                />

                {/* Right Panel: Preview */}
                <div style={{ width: rightWidth }} className="border-l border-slate-800 bg-slate-950 flex flex-col shrink-0">
                    <div className="h-10 border-b border-slate-800 flex items-center px-1 bg-slate-900">
                        <div className="flex items-center px-4 h-full text-xs font-medium border-b-2 border-blue-500 text-blue-400 bg-slate-800/50 gap-2">
                            <Layout className="w-3.5 h-3.5" />
                            Preview
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden p-4 bg-black relative">
                        <RNEmulator
                            embedUrl={embedUrl}
                            output={output}
                            html={html}
                            loading={loading}
                            error={error}
                            initialScale={0.7}
                            darkMode={true}
                        />
                    </div>
                </div>

            </div>

            {/* Footer Status Bar */}
            <div className="bg-slate-950 border-t border-slate-800 px-4 py-1.5 flex justify-between items-center">
                <div className="flex items-center gap-6 text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span>ENV: ISOLATED_CONTAINER</span>
                    </div>
                </div>
                <div className="text-[10px] text-slate-600">
                    MobileDev Portal v2.0
                </div>
            </div>
        </div>
    );
}

// Simple icons for status messages
function CheckCircle({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function AlertCircle({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
