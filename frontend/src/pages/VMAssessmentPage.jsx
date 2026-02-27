import { useState, useEffect } from 'react';
import { Code, ArrowLeft, Clock, Play, Save, CheckCircle, AlertCircle, Layout, Terminal, Maximize2, Minimize2, PanelLeftClose, PanelLeft, Settings, ChevronRight, User, X, ZoomIn } from 'lucide-react';
import AssessmentTimer from '../components/AssessmentTimer';
import { getAssessmentSession, getCurrentProblem, endTest, submitUISolution } from '../api/reactNativeProblemApi';
import { executeReactNative } from '../api/reactNativeApi';
import MultiFileEditor from '../components/MultiFileEditor';
import { useAuth } from '../context/AuthContext';
import RNEmulator from '../components/RNEmulator';

export default function VMAssessmentPage({ level = '4A', durationMinutes = 90, onEndTest }) {
    const { user } = useAuth();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState({
        'App.js': '// Loading...'
    });
    const [isRunning, setIsRunning] = useState(false);
    const [previewHtml, setPreviewHtml] = useState(null);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'console'
    const [showProblem, setShowProblem] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProblemExpanded, setIsProblemExpanded] = useState(false);
    const [imageZoomed, setImageZoomed] = useState(false);

    useEffect(() => {
        loadProblem();
    }, [level]);

    async function loadProblem() {
        try {
            setLoading(true);
            const session = await getAssessmentSession(level);
            if (session?.sessionId) {
                const data = await getCurrentProblem(level);
                setProblem(data);

                // Initialize files from starter code or previous submission if available
                setFiles({
                    'App.js': data.starterCode || '// Start coding here'
                });
            }
        } catch (err) {
            console.error('Failed to load problem:', err);
            setError('Failed to load problem. Please try refreshing.');
        } finally {
            setLoading(false);
        }
    }

    async function handleRunPreview() {
        setIsRunning(true);
        setError(null);
        try {
            const result = await executeReactNative(null, {
                files,
                mode: 'PREVIEW'
            });

            if (result.success && result.html) {
                setPreviewHtml(result.html);
                setLogs(prev => [...prev, { type: 'info', message: 'Build successful', timestamp: new Date() }]);
                setActiveTab('preview');
            } else {
                setError(result.message || 'Execution failed');
                setLogs(prev => [...prev, { type: 'error', message: result.message || 'Execution failed', timestamp: new Date() }]);
                if (result.output) {
                    setLogs(prev => [...prev, { type: 'error', message: result.output, timestamp: new Date() }]);
                }
                setActiveTab('console');
            }
        } catch (err) {
            setError(err.message);
            setLogs(prev => [...prev, { type: 'error', message: err.message, timestamp: new Date() }]);
            setActiveTab('console');
        } finally {
            setIsRunning(false);
        }
    }

    async function handleSubmit() {
        if (!problem) return;
        if (!confirm('Are you ready to submit your solution? This will be saved for review.')) return;

        setIsSubmitting(true);
        try {
            await submitUISolution(problem.id, files);
            alert('Solution submitted successfully!');
        } catch (err) {
            console.error('Submission error:', err);
            alert('Failed to submit: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleFinishTest() {
        if (!confirm('Are you sure you want to finish the test? Your current code will be submitted.')) return;

        setIsSubmitting(true);
        try {
            // Attempt to submit the solution first
            if (problem) {
                await submitUISolution(problem.id, files);
            }
            // Then end the test session
            await endTest(level);
            clearSessionData();
            onEndTest?.();
        } catch (err) {
            console.error('Error during finish test:', err);
            alert('Error submitting code: ' + err.message + '. The test will still be ended.');
            // Fallback: still end the test even if submission fails? 
            // Usually proper to ensure student can leave, but let's at least try to end it.
            await endTest(level);
            clearSessionData();
            onEndTest?.();
        } finally {
            setIsSubmitting(false);
        }
    }

    function clearSessionData() {
        localStorage.removeItem('assessment_session');
        localStorage.removeItem('current_problem');
        localStorage.removeItem('assessment_code');
        localStorage.removeItem(`level_${level}_timer`);
    }

    const ProblemContent = ({ isModal = false }) => (
        <div className={`prose prose-invert prose-sm max-w-none ${isModal ? 'p-6' : ''}`}>
            {isModal && <h2 className="text-xl font-bold text-white mb-4">{problem.title}</h2>}

            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
                {problem.description}
            </div>

            {/* Expected Output Image */}
            {problem.sampleImage && (
                <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Expected Output</h4>
                    <div className="border border-slate-700 rounded-lg p-2 bg-slate-900/50 inline-block">
                        <div className="relative group">
                            <img
                                src={problem.sampleImage}
                                alt="Expected output"
                                className="max-w-full h-auto rounded cursor-pointer transition-opacity hover:opacity-90 max-h-[300px] object-contain"
                                onClick={() => setImageZoomed(true)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded pointer-events-none">
                                <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {problem.ui_required_widgets && (
                <div className="mt-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                        {(typeof problem.ui_required_widgets === 'string'
                            ? JSON.parse(problem.ui_required_widgets)
                            : problem.ui_required_widgets
                        ).map((w, i) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-800 text-blue-300 text-xs font-medium border border-slate-700 rounded-md shadow-sm">
                                {w}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans">
            {/* Top Navigation Bar */}
            <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Code className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-wide">LEVEL {level}</h1>
                            <span className="text-xs text-slate-400 font-medium tracking-wider">CUSTOM VM ENVIRONMENT</span>
                        </div>

                        {/* Student Info Display */}
                        {user && (
                            <div className="hidden md:flex items-center gap-6 px-4 py-1.5 bg-slate-900 rounded-md border border-slate-800 text-xs text-slate-400">
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="font-semibold text-slate-200">{user.full_name}</span>
                                </div>
                                {user.enrollment_no && (
                                    <div className="flex items-center gap-1.5 border-l border-slate-700 pl-4">
                                        <span className="text-slate-500">Enrollment:</span>
                                        <span className="font-mono text-slate-300">{user.enrollment_no}</span>
                                    </div>
                                )}
                                {user.roll_no && (
                                    <div className="flex items-center gap-1.5 border-l border-slate-700 pl-4">
                                        <span className="text-slate-500">Roll:</span>
                                        <span className="font-mono text-slate-300">{user.roll_no}</span>
                                    </div>
                                )}
                                {user.email && (
                                    <div className="flex items-center gap-1.5 border-l border-slate-700 pl-4">
                                        <span className="text-slate-500">Email:</span>
                                        <span className="font-mono text-slate-300">{user.email}</span>
                                    </div>
                                )}
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
                            onClick={handleRunPreview}
                            disabled={isRunning}
                            className={`
                                flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all
                                ${isRunning
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'}
                            `}
                        >
                            {isRunning ? (
                                <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                            Run
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`
                                flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all
                                ${isSubmitting
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}
                            `}
                        >
                            {isSubmitting ? (
                                <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            Submit
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-800 mx-2" />

                    <button
                        onClick={handleFinishTest}
                        disabled={isSubmitting}
                        className="px-4 py-1.5 text-xs font-bold text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 rounded-md transition-all uppercase tracking-wider"
                    >
                        {isSubmitting ? 'Finishing...' : 'Finish Test'}
                    </button>
                </div>
            </header >

            {/* Main Content Area */}
            < div className="flex-1 flex overflow-hidden" >

                {/* Left Panel: Problem Description */}
                < div
                    className={`${showProblem ? 'w-[350px]' : 'w-0'} bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out shrink-0 relative`
                    }
                >
                    {showProblem && (
                        <>
                            <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Problem Description</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsProblemExpanded(true)}
                                        className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800"
                                        title="Expand View"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setShowProblem(false)} className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800">
                                        <PanelLeftClose className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs text-slate-500">Loading problem...</span>
                                    </div>
                                ) : problem ? (
                                    <>
                                        <h2 className="text-lg font-bold text-white mb-2">{problem.title}</h2>
                                        <ProblemContent />
                                    </>
                                ) : (
                                    <div className="text-center text-slate-500 mt-10 text-sm">No problem loaded</div>
                                )}
                            </div>
                        </>
                    )}
                </div >

                {/* Minimized Problem Toggle */}
                {
                    !showProblem && (
                        <div className="w-10 border-r border-slate-800 bg-slate-950 flex flex-col items-center py-4 gap-4 shrink-0">
                            <button
                                onClick={() => setShowProblem(true)}
                                className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-blue-400 transition-colors"
                                title="Show Problem"
                            >
                                <PanelLeft className="w-5 h-5" />
                            </button>
                        </div>
                    )
                }

                {/* Middle Panel: Code Editor */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
                    {/* Toolbar (Now just breadcrumbs/status) */}
                    <div className="h-0 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950 hidden">
                        {/* Hidden as buttons moved to top, keeping div in case we want breadcrumbs later */}
                    </div>

                    {error && (
                        <div className="absolute top-4 right-4 z-50 flex items-center gap-1.5 text-red-200 text-xs px-3 py-2 bg-red-900/80 border border-red-700/50 rounded-md shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            <span className="truncate max-w-[300px]">{error}</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden relative">
                        <MultiFileEditor
                            files={files}
                            onChange={setFiles}
                        />
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className="w-[450px] border-l border-slate-800 bg-slate-950 flex flex-col shrink-0">
                    <div className="h-10 border-b border-slate-800 flex items-center px-1 bg-slate-900">
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`
                                px-4 h-full text-xs font-medium border-b-2 transition-all flex items-center gap-2
                                ${activeTab === 'preview'
                                    ? 'border-blue-500 text-blue-400 bg-slate-800/50'
                                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}
                            `}
                        >
                            <Layout className="w-3.5 h-3.5" />
                            Preview
                        </button>
                        <button
                            onClick={() => setActiveTab('console')}
                            className={`
                                px-4 h-full text-xs font-medium border-b-2 transition-all flex items-center gap-2
                                ${activeTab === 'console'
                                    ? 'border-blue-500 text-blue-400 bg-slate-800/50'
                                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}
                            `}
                        >
                            <Terminal className="w-3.5 h-3.5" />
                            Console
                            {logs.filter(l => l.type === 'error').length > 0 && (
                                <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {logs.filter(l => l.type === 'error').length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden relative bg-black">
                        {activeTab === 'preview' ? (
                            <div className="absolute inset-0 p-4 flex flex-col">
                                <RNEmulator
                                    embedUrl={null}
                                    html={previewHtml}
                                    loading={isRunning}
                                    error={null} // Error handled by logs, but can pass if needed
                                    output={null}
                                />
                            </div>
                        ) : (
                            <div className="absolute inset-0 overflow-y-auto p-4 font-mono text-sm bg-slate-950">
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                                    <span className="text-xs text-slate-500 uppercase tracking-wider">Output Log</span>
                                    <button onClick={() => setLogs([])} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Clear</button>
                                </div>
                                {logs.length === 0 ? (
                                    <div className="text-slate-600 italic text-xs">No output...</div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className={`mb-1.5 font-mono text-xs ${log.type === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
                                            <span className="text-slate-600 mr-2 select-none">[{log.timestamp.toLocaleTimeString([], { hour12: false })}]</span>
                                            <span className="break-all">{log.message}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div >

            {/* Problem Expansion Modal */}
            {isProblemExpanded && problem && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl h-[85vh] bg-slate-900 rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsProblemExpanded(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <ProblemContent isModal={true} />
                        </div>
                    </div>
                </div>
            )}

            {/* Image Zoom Modal */}
            {imageZoomed && problem?.sampleImage && (
                <div
                    className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-8 cursor-pointer animate-in fade-in duration-200"
                    onClick={() => setImageZoomed(false)}
                >
                    <button
                        className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors"
                        onClick={() => setImageZoomed(false)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={problem.sampleImage}
                        alt="Full size preview"
                        className="max-w-full max-h-full object-contain cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div >
    );
}
