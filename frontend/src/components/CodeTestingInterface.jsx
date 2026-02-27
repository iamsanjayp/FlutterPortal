import { useState } from 'react';
import { Play, Send, CheckCircle, XCircle, Lock } from 'lucide-react';

/**
 * Code Testing Interface Component
 * LeetCode-style interface for CODE-type problems (Levels 1A-2C)
 */
export default function CodeTestingInterface({ problem, onSubmit, onRunTests }) {
    const [code, setCode] = useState(problem?.starterCode || '');
    const [testResults, setTestResults] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRunTests = async () => {
        setIsRunning(true);
        try {
            const results = await onRunTests(code);
            setTestResults(results);
        } catch (error) {
            console.error('Error running tests:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const results = await onSubmit(code);
            setTestResults(results);
        } catch (error) {
            console.error('Error submitting code:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase mr-2">
                            Problem #{problem?.id}
                        </span>
                        <span className="text-sm text-slate-600">CODE Challenge</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleRunTests}
                            disabled={isRunning || !code.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            {isRunning ? 'Running...' : 'Run Tests'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !code.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg font-medium transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Problem Statement */}
                <div className="w-1/2 border-r border-slate-200 bg-white overflow-auto">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">
                            {problem?.title}
                        </h2>

                        <div className="prose prose-slate max-w-none mb-6">
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {problem?.description}
                            </p>
                        </div>

                        {/* Sample Test Cases */}
                        {problem?.sampleTests && problem.sampleTests.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                                    Sample Test Cases
                                </h3>
                                <div className="space-y-3">
                                    {problem.sampleTests.map((test, idx) => (
                                        <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Input</div>
                                                    <code className="block text-sm font-mono text-slate-800 bg-white px-2 py-1 rounded">
                                                        {test.input}
                                                    </code>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Expected Output</div>
                                                    <code className="block text-sm font-mono text-slate-800 bg-white px-2 py-1 rounded">
                                                        {test.expected}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {problem.hiddenTestCount > 0 && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                                        <Lock className="w-4 h-4" />
                                        <span>+ {problem.hiddenTestCount} hidden test case(s)</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Code Editor & Results */}
                <div className="w-1/2 flex flex-col bg-slate-900">
                    {/* Code Editor */}
                    <div className="flex-1 overflow-hidden">
                        <div className="h-full flex flex-col">
                            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
                                <span className="text-sm text-slate-300 font-medium">Solution.js</span>
                            </div>
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="flex-1 bg-slate-900 text-slate-100 font-mono text-sm p-4 resize-none focus:outline-none"
                                placeholder="// Write your solution here..."
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Test Results Panel */}
                    {testResults && (
                        <div className="h-64 border-t border-slate-700 bg-slate-800 overflow-auto">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-white uppercase">Test Results</h3>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-green-400">
                                            {testResults.passed}/{testResults.total} Passed
                                        </span>
                                        {testResults.executionTime && (
                                            <span className="text-slate-400">
                                                {testResults.executionTime}ms
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {testResults.error && (
                                    <div className="bg-red-900/30 border border-red-700 rounded p-3 mb-4">
                                        <p className="text-red-300 text-sm font-mono">{testResults.error}</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {testResults.testResults?.map((result, idx) => (
                                        <div
                                            key={idx}
                                            className={`rounded p-3 border ${result.passed
                                                    ? 'bg-green-900/20 border-green-700'
                                                    : 'bg-red-900/20 border-red-700'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {result.passed ? (
                                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-400" />
                                                    )}
                                                    <span className={`text-sm font-medium ${result.passed ? 'text-green-300' : 'text-red-300'
                                                        }`}>
                                                        Test Case {result.testNumber}
                                                        {!result.isPublic && ' (Hidden)'}
                                                    </span>
                                                </div>
                                                {result.executionTime && (
                                                    <span className="text-xs text-slate-400">
                                                        {result.executionTime}ms
                                                    </span>
                                                )}
                                            </div>

                                            {result.isPublic && (
                                                <div className="space-y-1 text-xs font-mono">
                                                    {result.input && (
                                                        <div>
                                                            <span className="text-slate-400">Input: </span>
                                                            <span className="text-slate-200">{result.input}</span>
                                                        </div>
                                                    )}
                                                    {result.expectedOutput && (
                                                        <div>
                                                            <span className=" text-slate-400">Expected: </span>
                                                            <span className="text-slate-200">{result.expectedOutput}</span>
                                                        </div>
                                                    )}
                                                    {result.actualOutput && (
                                                        <div>
                                                            <span className="text-slate-400">Got: </span>
                                                            <span className={result.passed ? 'text-green-300' : 'text-red-300'}>
                                                                {result.actualOutput}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {result.error && (
                                                        <div>
                                                            <span className="text-red-400">Error: </span>
                                                            <span className="text-red-300">{result.error}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {!result.isPublic && (
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Lock className="w-3 h-3" />
                                                    <span>Test details hidden</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {testResults.status && (
                                    <div className={`mt-4 p-3 rounded border ${testResults.status === 'PASS'
                                            ? 'bg-green-900/30 border-green-700'
                                            : 'bg-red-900/30 border-red-700'
                                        }`}>
                                        <p className={`text-sm font-medium ${testResults.status === 'PASS' ? 'text-green-300' : 'text-red-300'
                                            }`}>
                                            {testResults.status === 'PASS'
                                                ? '✓ All tests passed! Solution accepted.'
                                                : `✗ ${testResults.failed} test(s) failed. Keep trying!`
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
