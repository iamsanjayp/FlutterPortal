export default function ResultPanel({ results }) {
  return (
    <div className="text-sm">
      <span
        className={`font-semibold ${
          results.status === "PASS"
            ? "text-green-600"
            : "text-red-600"
        }`}
      >
        {results.status}
      </span>
      <span className="ml-4 text-gray-600">
        Time: {results.executionTimeMs} ms
      </span>
    </div>
  );
}
