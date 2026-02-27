import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";
import { Play, Save } from 'lucide-react';

export default function RNCodeEditor({
    code,
    setCode,
    onRun,
    onSubmit,
    loading,
    submitting,
    theme = "light"
}) {
    const [editorTheme, setEditorTheme] = useState(theme);

    useEffect(() => {
        setEditorTheme(theme);
    }, [theme]);

    const handleEditorMount = (editor) => {
        // Configure editor instance if needed
        editor.updateOptions({
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
            fontLigatures: true,
        });
    };

    const isDark = theme === 'vs-dark';

    return (
        <div className={`h-full flex flex-col font-sans ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border rounded-lg shadow-sm overflow-hidden`}>
            {/* Editor Header */}
            <div className={`flex items-center justify-between px-4 py-2 border-b ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-blue-500' : 'bg-blue-400'}`}></div>
                    <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>App.js</span>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>React Native</span>
                </div>

                {/* Actions (Only show here if NOT handled by parent, keeping for backward compatibility) */}
                {(onRun || onSubmit) && !loading && !submitting && (
                    <div className="flex items-center gap-2">
                        {/* Hidden in new layout if parent handles controls, but keeping for fallback */}
                    </div>
                )}
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 relative">
                <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    language="javascript"
                    theme={editorTheme}
                    value={code}
                    onChange={(value) => setCode(value)}
                    onMount={handleEditorMount}
                    options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: "on",
                        lineNumbers: "on",
                        renderLineHighlight: "all",
                        quickSuggestions: true,
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: "on",
                        tabCompletion: "on",
                        padding: { top: 16, bottom: 16 },
                    }}
                />
            </div>
        </div>
    );
}
