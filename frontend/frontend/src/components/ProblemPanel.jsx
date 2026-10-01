import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Copy, Check } from "lucide-react";

export default function ProblemPanel({ question }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!question) return null;

  const testCases = question.testCases || [];
  const sampleCases = testCases.filter(tc => !tc.isHidden && !tc.is_hidden);
  const hiddenCases = testCases.filter(tc => tc.isHidden || tc.is_hidden);
  const requiredWidgets = question.uiRequiredWidgets || [];

  function copyToClipboard(text, key) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="h-full bg-white flex flex-col overflow-y-auto">
      <div className="p-5 sm:p-6 space-y-6">
        {/* Header & Title */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Problem {question.id ? `#${question.id}` : ""}
            </span>
            {question.level && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                Level {question.level}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            {question.title}
          </h2>
        </div>

        {/* Problem Description */}
        <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          {question.description}
        </div>

        {/* Required Widgets / Constraints if applicable */}
        {requiredWidgets.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Required Widgets & Components
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {requiredWidgets.map(widget => (
                <span
                  key={widget}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-medium"
                >
                  {widget}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sample Test Cases (Input + Sample Output) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Sample Test Cases ({sampleCases.length})
            </h3>
            <span className="text-xs text-slate-400">Inputs & Expected Outputs</span>
          </div>

          <div className="space-y-3">
            {sampleCases.map((tc, idx) => {
              const status = tc.status ?? "NOT_TESTED";
              const expectedOutput = tc.expectedOutput ?? tc.expected_output ?? "";
              const inputVal = tc.input ?? "";

              return (
                <div
                  key={tc.id || idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
                >
                  {/* Card Header */}
                  <div className="px-3.5 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Sample Case #{idx + 1}
                    </span>
                    {status === "PASS" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        PASSED
                      </span>
                    )}
                    {status === "FAIL" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        FAILED
                      </span>
                    )}
                    {status === "NOT_TESTED" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Not Tested
                      </span>
                    )}
                  </div>

                  {/* Input & Output Panels */}
                  <div className="p-3.5 space-y-3">
                    {/* Sample Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Sample Input
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(inputVal, `in-${idx}`)}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                          title="Copy input"
                        >
                          {copiedKey === `in-${idx}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === `in-${idx}` ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap break-all shadow-inner">
                        {inputVal || "<empty>"}
                      </pre>
                    </div>

                    {/* Sample Output */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Sample Output
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(expectedOutput, `out-${idx}`)}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                          title="Copy expected output"
                        >
                          {copiedKey === `out-${idx}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === `out-${idx}` ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap break-all shadow-inner">
                        {expectedOutput || "<empty>"}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}

            {sampleCases.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No sample test cases specified for this question.
              </p>
            )}
          </div>
        </div>

        {/* Hidden Test Cases for Final Grading */}
        {hiddenCases.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Hidden Test Cases ({hiddenCases.length})
              </h3>
              <span className="text-xs text-slate-400">Evaluated on submission</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hiddenCases.map((tc, idx) => {
                const status = tc.status ?? "NOT_TESTED";
                return (
                  <div
                    key={tc.id || idx}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  >
                    <span className="font-medium text-slate-700">Hidden Test #{idx + 1}</span>
                    {status === "PASS" && (
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </span>
                    )}
                    {status === "FAIL" && (
                      <span className="text-rose-700 font-bold text-[11px] flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> FAIL
                      </span>
                    )}
                    {status === "NOT_TESTED" && (
                      <span className="text-slate-400 text-[11px]">Hidden</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

