export default function ProblemPanel({ question }) {
  if (!question) return null;

  const testCases = question.testCases || [];
  const sampleCases = testCases.filter(tc => !tc.isHidden);
  const hiddenCases = testCases.filter(tc => tc.isHidden);
  const requiredWidgets = question.uiRequiredWidgets || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-y-auto">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">
        {question.title}
      </h2>

      <p className="text-gray-700 mb-4">
        {question.description}
      </p>

      {requiredWidgets.length > 0 && (
        <div className="mb-5 space-y-4">
          {requiredWidgets.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-800">
                Required Widgets
              </h3>
              <div className="flex flex-wrap gap-2">
                {requiredWidgets.map(widget => (
                  <span
                    key={widget}
                    className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                  >
                    {widget}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


      <h3 className="font-semibold mb-2 text-gray-800">
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
              : "text-gray-400";

          return (
            <div
              key={tc.id}
              className="flex justify-between items-center p-2 border border-gray-200 rounded-md bg-gray-50"
            >
              <span>Input: {tc.input}</span>
              <span className={`text-sm font-semibold ${statusClass}`}>
                {status}
              </span>
            </div>
          );
        })}
      </div>

      <h3 className="font-semibold mt-6 mb-2 text-gray-800">
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
              : "text-gray-400";

          return (
            <div
              key={tc.id}
              className="flex justify-between items-center p-2 border border-gray-200 rounded-md bg-gray-50"
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
