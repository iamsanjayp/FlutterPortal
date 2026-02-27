export default function ProblemPanel({ question }) {
  if (!question) return null;

  const testCases = question.testCases || [];
  const sampleCases = testCases.filter(tc => !tc.isHidden);
  const hiddenCases = testCases.filter(tc => tc.isHidden);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 overflow-y-auto">
      <h2 className="text-xl font-semibold mb-2 text-slate-800">
        {question.title}
      </h2>

      <p className="text-slate-700 mb-4">
        {question.description}
      </p>

      <h3 className="font-semibold mb-2 text-slate-800">
        Sample Test Cases
      </h3>

      <div className="space-y-2">
        {sampleCases.map(tc => {
          const status = tc.status ?? "NOT_TESTED";
          const statusClass =
            status === "PASS"
              ? "text-green-600"
              : status === "FAIL"
              ? "text-red-600"
              : "text-slate-400";

          return (
            <div
              key={tc.id}
              className="flex justify-between items-center p-2 border border-slate-200 rounded-md bg-slate-50"
            >
              <span>Input: {tc.input}</span>
              <span className={`text-sm font-semibold ${statusClass}`}>
                {status}
              </span>
            </div>
          );
        })}
      </div>

      <h3 className="font-semibold mt-6 mb-2 text-slate-800">
        Hidden Test Cases
      </h3>

      <div className="space-y-2">
        {hiddenCases.map(tc => {
          const status = tc.status ?? "NOT_TESTED";
          const statusClass =
            status === "PASS"
              ? "text-green-600"
              : status === "FAIL"
              ? "text-red-600"
              : "text-slate-400";

          return (
            <div
              key={tc.id}
              className="flex justify-between items-center p-2 border border-slate-200 rounded-md bg-slate-50"
            >
              <span className="text-sm">
                Hidden Test Case —{" "}
                <span className={`font-semibold ${statusClass}`}>
                  {status}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
