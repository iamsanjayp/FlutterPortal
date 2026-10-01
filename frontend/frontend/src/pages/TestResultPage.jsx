import { useState } from "react";
import { submitFeedback } from "../api/testApi";

const CATEGORIES = [
  "Problem Clarity",
  "Test Cases",
  "IDE Experience",
  "UI Preview",
  "Difficulty Level",
  "Time Duration",
  "General",
];

const RATING_LABELS = {
  1: "Poor - Needs improvement",
  2: "Fair - Several issues",
  3: "Good - Satisfactory",
  4: "Very Good - Great experience",
  5: "Excellent - Smooth & clear",
};

export default function TestResultPage({ sessionId, summary, onDone }) {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("General");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState("");

  const verdict = (summary?.status || summary?.sessionStatus || "COMPLETED").toUpperCase();
  const totalPassed = summary?.totalPassed ?? (verdict === "PASS" ? summary?.totalCount ?? 0 : 0);
  const totalCount = summary?.totalCount ?? 0;
  const passRate = totalCount > 0 ? Math.round((totalPassed / totalCount) * 100) : null;

  const isPassed = verdict === "PASS";
  const isAwaiting = verdict === "AWAITING_MANUAL";
  const isFailed = verdict === "FAIL";

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!sessionId) {
      if (onDone) onDone();
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      await submitFeedback({
        sessionId,
        feedback: feedback.trim() || `Rated ${rating}/5 - [${category}]`,
        rating,
        category,
      });
      setStatus("sent");
    } catch (err) {
      console.error("Feedback submit error:", err);
      setStatus("error");
      setErrorMessage(err?.message || "Failed to submit feedback. You can still return to your dashboard.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800 font-sans">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Assessment Complete
              </span>
            </div>
            {sessionId && (
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Session #{sessionId}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isPassed ? "Congratulations! Test Passed" : isAwaiting ? "Test Submitted for Review" : "Test Finished"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isPassed
                  ? "All test cases passed. Excellent work!"
                  : isAwaiting
                  ? "Your UI test has been stored and will be reviewed by an evaluator."
                  : "Thank you for completing this assessment."}
              </p>
            </div>

            {/* Verdict Chip */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 border ${
                isPassed
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isAwaiting
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : isFailed
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {verdict}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Result</div>
              <div className={`text-base font-bold mt-0.5 ${isPassed ? "text-emerald-600" : isAwaiting ? "text-amber-600" : "text-slate-800"}`}>
                {verdict}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Solved</div>
              <div className="text-base font-bold text-slate-800 mt-0.5">
                {totalPassed} <span className="text-xs text-slate-400 font-normal">/ {totalCount || "?"}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Score</div>
              <div className="text-base font-bold text-blue-600 mt-0.5">
                {passRate !== null ? `${passRate}%` : "100%"}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="p-6 sm:p-8">
          {status === "sent" ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Thank you for your feedback!</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Your inputs help us improve questions, test cases, and IDE stability.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onDone}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Rate Your Experience
                  </label>
                  <span className="text-xs text-amber-600 font-medium">
                    {RATING_LABELS[hoverRating || rating]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-2xl transition hover:scale-110 focus:outline-none"
                    >
                      <span
                        className={
                          (hoverRating || rating) >= star
                            ? "text-amber-400"
                            : "text-slate-200"
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="text-xs text-slate-400 ml-1.5 font-medium">({rating} / 5)</span>
                </div>
              </div>

              {/* Category Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Topic / Area
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        category === cat
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Comments or Suggestions <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">{feedback.length}/500</span>
                </div>
                <textarea
                  maxLength={500}
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what went well, or any issues/bugs you encountered during the assessment..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition bg-slate-50/50"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onDone}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Skip & Return to Dashboard
                </button>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
                >
                  {status === "sending" ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
