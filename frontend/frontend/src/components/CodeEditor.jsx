import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, setCode }) {
  function handleBeforeMount(monaco) {
    monaco.editor.defineTheme("portal-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "A78BFA", fontStyle: "bold" },
        { token: "number", foreground: "FBBF24" },
        { token: "string", foreground: "34D399" },
        { token: "type.identifier", foreground: "38BDF8" },
        { token: "identifier", foreground: "F1F5F9" },
        { token: "delimiter", foreground: "94A3B8" },
      ],
      colors: {
        "editor.background": "#0F172A",
        "editor.foreground": "#F1F5F9",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#94A3B8",
        "editorCursor.foreground": "#38BDF8",
        "editor.selectionBackground": "#1E293B",
        "editor.lineHighlightBackground": "#1E293B",
        "editorIndentGuide.background": "#1E293B",
        "editorIndentGuide.activeBackground": "#334155",
      },
    });
  }

  return (
    <div className="h-full bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
      <Editor
        height="100%"
        language="dart"
        theme="portal-dark"
        beforeMount={handleBeforeMount}
        value={code}
        onChange={(value) => setCode(value)}
        options={{
          fontSize: 14,
          fontFamily: "Fira Code, JetBrains Mono, Consolas, 'Courier New', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          cursorBlinking: "smooth",
          renderLineHighlight: "gutter",
        }}
      />
    </div>
  );
}

