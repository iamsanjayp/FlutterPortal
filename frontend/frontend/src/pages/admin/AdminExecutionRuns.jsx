import { useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Search, Server, Clock, Play, Terminal, CheckCircle, XCircle } from "lucide-react";
import { fetchExecutionRuns } from "../../api/adminApi";

const STATUS_STYLES = {
  RUNNING: "bg-amber-100 text-amber-700 border-amber-200",
  OK: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PASS: "bg-emerald-100 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
  ERROR: "bg-red-100 text-red-700 border-red-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function AdminExecutionRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRunId, setSelectedRunId] = useState("");

  useEffect(() => {
    loadRuns();
    const interval = setInterval(loadRuns, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadRuns() {
    try {
      setLoading(true);
      const data = await fetchExecutionRuns();
      setRuns(data.runs || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load execution runs");
    } finally {
      setLoading(false);
    }
  }

  const filteredRuns = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return runs.filter(run => {
      const matchesSearch = !search ||
        String(run.runId || "").toLowerCase().includes(search) ||
        String(run.sessionId || "").toLowerCase().includes(search) ||
        String(run.problemId || "").toLowerCase().includes(search) ||
        String(run.userId || "").toLowerCase().includes(search) ||
        String(run.mode || "").toLowerCase().includes(search);

      const matchesMode = modeFilter === "all" || run.mode === modeFilter;
      const matchesStatus = statusFilter === "all" || run.status === statusFilter;

      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [runs, searchTerm, modeFilter, statusFilter]);

  const selectedRun = runs.find(run => run.runId === selectedRunId) || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Execution Runs</h1>
          <p className="text-sm text-gray-500 mt-1">Inspect active and completed Flutter execution sessions</p>
        </div>
        <button
          onClick={loadRuns}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_auto_auto] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by run, session, problem, user, or mode"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Modes</option>
            <option value="TEST_CASE">Test Case</option>
            <option value="CUSTOM">Custom</option>
            <option value="UI_PREVIEW">UI Preview</option>
            <option value="UI_SUBMISSION">UI Submission</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="RUNNING">Running</option>
            <option value="OK">OK</option>
            <option value="PASS">Pass</option>
            <option value="FAILED">Failed</option>
            <option value="ERROR">Error</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Activity className="w-4 h-4" />
              {filteredRuns.length} runs
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
            {filteredRuns.map((run) => (
              <button
                key={run.runId}
                onClick={() => setSelectedRunId(run.runId)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedRunId === run.runId ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{run.mode}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${STATUS_STYLES[run.status] || STATUS_STYLES.COMPLETED}`}>
                        {run.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <div>Run: {run.runId}</div>
                      <div>Session: {run.sessionId || "-"} · Problem: {run.problemId || "-"} · User: {run.userId || "-"}</div>
                      <div>Started: {run.startedAt ? new Date(run.startedAt).toLocaleString() : "-"}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {run.finishedAt ? new Date(run.finishedAt).toLocaleTimeString() : "live"}
                  </div>
                </div>
              </button>
            ))}
            {!filteredRuns.length && (
              <div className="p-8 text-center text-sm text-gray-500">
                {loading ? "Loading execution runs..." : "No execution runs found."}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {selectedRun ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Run Details</h2>
                  <div className="text-xs text-gray-500 mt-1 break-all">{selectedRun.runId}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_STYLES[selectedRun.status] || STATUS_STYLES.COMPLETED}`}>
                  {selectedRun.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <DetailCard label="Mode" value={selectedRun.mode} icon={Play} />
                <DetailCard label="Session" value={selectedRun.sessionId || "-"} icon={Server} />
                <DetailCard label="Problem" value={selectedRun.problemId || "-"} icon={Server} />
                <DetailCard label="User" value={selectedRun.userId || "-"} icon={Server} />
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <div className="text-xs uppercase text-gray-400 mb-1">Created</div>
                  <div>{selectedRun.createdAt ? new Date(selectedRun.createdAt).toLocaleString() : "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-400 mb-1">Updated</div>
                  <div>{selectedRun.updatedAt ? new Date(selectedRun.updatedAt).toLocaleString() : "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-400 mb-1">Result Summary</div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {selectedRun.result ? (
                      <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(selectedRun.result, null, 2)}</pre>
                    ) : (
                      <span className="text-gray-500">No result recorded yet.</span>
                    )}
                  </div>
                </div>
                {selectedRun.error && (
                  <div>
                    <div className="text-xs uppercase text-gray-400 mb-1">Error</div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-xs whitespace-pre-wrap break-words">
                      {selectedRun.error.message}
                      {selectedRun.error.detail ? `\n${selectedRun.error.detail}` : ""}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Console Output</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800 shadow-inner">
                    {selectedRun.result?.rawOutput ? (
                      <pre className="text-xs whitespace-pre-wrap break-words max-h-72 overflow-y-auto">
                        {selectedRun.result.rawOutput}
                      </pre>
                    ) : (
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5" />
                        No console output recorded.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[40vh] flex flex-col items-center justify-center text-center text-gray-500">
              <Activity className="w-10 h-10 mb-3 text-gray-300" />
              <div className="text-sm">Select a run to inspect execution metadata.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-xs uppercase text-gray-400 mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-sm font-medium text-gray-800 break-all">{value}</div>
    </div>
  );
}
