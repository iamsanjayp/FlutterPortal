import { useState } from "react";
import { submitFeedback } from "../api/testApi";

export default function TestResultPage({ sessionId, summary, onDone }) {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState(null);
  const verdict = summary?.status || summary?.sessionStatus || "-";

  async function handleSubmit() {
    if (!sessionId || !feedback.trim()) return;
    setStatus("sending");
    try {
      await submitFeedback({ sessionId, feedback: feedback.trim() });
      setStatus("sent");
      if (onDone) onDone();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <div className="text-xs uppercase text-slate-400">Test Result</div>
          <h1 className="text-2xl font-semibold text-slate-800">Your Test is Complete</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase text-slate-400">Verdict</div>
            <div className={`text-lg font-semibold ${verdict === "PASS" ? "text-emerald-600" : "text-rose-600"}`}>
              {verdict}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase text-slate-400">Passed</div>
            <div className="text-lg font-semibold text-slate-800">
              {summary?.totalPassed ?? 0}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase text-slate-400">Total</div>
            <div className="text-lg font-semibold text-slate-800">
              {summary?.totalCount ?? 0}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-700">Feedback</div>
          <textarea
            className="mt-2 w-full h-28 resize-none rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700"
            placeholder="Share feedback about the test..."
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={status === "sending"}
              className="px-4 py-2 rounded-md bg-sky-500 text-white text-sm"
            >
              {status === "sending" ? "Submitting..." : "Submit Feedback"}
            </button>
            {status === "error" && (
              <span className="text-xs text-rose-600">Failed to submit feedback</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
