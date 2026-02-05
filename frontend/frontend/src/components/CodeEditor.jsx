import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, setCode }) {
  function handleBeforeMount(monaco) {
    monaco.editor.defineTheme("portal-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "7C3AED", fontStyle: "bold" },
        { token: "number", foreground: "F59E0B" },
        { token: "string", foreground: "10B981" },
        { token: "type.identifier", foreground: "38BDF8" },
        { token: "identifier", foreground: "E2E8F0" },
        { token: "delimiter", foreground: "94A3B8" },
      ],
      colors: {
        "editor.background": "#0B1220",
        "editor.foreground": "#E2E8F0",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#94A3B8",
        "editorCursor.foreground": "#22D3EE",
        "editor.selectionBackground": "#1F2A44",
        "editor.lineHighlightBackground": "#0F172A",
        "editorIndentGuide.background": "#1E293B",
        "editorIndentGuide.activeBackground": "#334155",
      },
    });
  }

  return (
    <div className="h-full bg-slate-950 rounded-lg shadow-sm border border-slate-800 overflow-hidden">
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
