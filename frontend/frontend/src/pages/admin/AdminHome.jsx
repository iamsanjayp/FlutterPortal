import { useEffect, useState } from "react";
import { fetchAdminMetrics } from "../../api/adminApi";
import { 
  Users, 
  BookOpen, 
  Activity, 
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function AdminHome() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  const passCount = metrics?.passCount || 0;
  const failCount = metrics?.failCount || 0;
  const totalCompleted = passCount + failCount;
  const passRate = totalCompleted ? Math.round((passCount / totalCompleted) * 100) : 0;
  const failRate = totalCompleted ? Math.round((failCount / totalCompleted) * 100) : 0;

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      const res = await fetchAdminMetrics();
      setMetrics(res);
    } catch (err) {
      setError(err.message || "Failed to load metrics");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard 
          title="Active Tests" 
          value={metrics?.activeSessions ?? 0}
          badge={metrics?.activeSessions ? "LIVE" : null}
          icon={Activity} 
          color="purple"
        />
        <KPICard 
          title="Students Logged" 
          value={metrics?.userCount ?? 0}
          icon={Users} 
          color="blue"
        />
        <KPICard 
          title="Students Blocked" 
          value={metrics?.blockedCount ?? 0}
          icon={CheckCircle} 
          color="red"
        />
        <KPICard 
          title="Submissions" 
          value={metrics?.submissionsCount ?? 0}
          icon={BookOpen} 
          color="green"
        />
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Completion Rate */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Completion Rate</h3>
          <div className="space-y-4">
            <CompletionChart label="Pass Rate" percentage={passRate} color="blue" />
            <CompletionChart label="Fail Rate" percentage={failRate} color="red" />
          </div>
        </div>

        {/* Pass vs Fail Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pass vs Fail</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              {/* Donut Chart */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="20"
                  strokeDasharray="264"
                  strokeDashoffset={264 - Math.round((passRate / 100) * 264)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">{passRate}%</div>
                  <div className="text-xs text-gray-500">Pass</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600">Pass ({passRate}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-sm text-gray-600">Fail ({failRate}%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(metrics?.recentSubmissions || []).map((row) => (
                <ActivityRow
                  key={row.id}
                  name={row.student_name}
                  id={row.roll_no || row.user_id}
                  question={`${row.problem_id} ${row.problem_title}`}
                  time={new Date(row.created_at).toLocaleString()}
                  status={row.status}
                  sessionId={row.test_session_id}
                />
              ))}
              {!metrics?.recentSubmissions?.length && (
                <tr>
                  <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>
                    No recent submissions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Level Completions */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Students Completed (by Level)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(metrics?.levelCompletions || []).map((row) => (
            <LevelCard key={row.level} level={row.level} count={row.studentCount} />
          ))}
          {!metrics?.levelCompletions?.length && (
            <div className="text-sm text-gray-500">No completions yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function LevelCard({ level, count }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="text-xs uppercase text-gray-500">Level {level}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-800">{count}</div>
      <div className="text-xs text-gray-500">Completed</div>
    </div>
  );
}

function KPICard({ title, value, badge, icon: Icon, color }) {
  const colorClasses = {
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {badge && (
          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded">
            {badge}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function CompletionChart({ label, percentage, color }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-gray-800">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function ActivityRow({ name, id, question, time, status, sessionId }) {
  const statusColor = status === "PASS" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white text-sm font-medium">{name.charAt(0)}</span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">{name}</div>
            <div className="text-xs text-gray-500">{id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{question}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{time}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{sessionId}</td>
    </tr>
  );
}

function MetricCard({ title, value, tint }) {
  const tints = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    sky: "bg-sky-50 text-sky-600 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-5 flex items-center justify-between border-l-4 border-slate-700">
      <div>
        <div className="text-xs uppercase text-slate-400">{title}</div>
        <div className="text-2xl font-semibold text-slate-100 mt-2">{value}</div>
      </div>
      <div className={`h-10 w-10 rounded-full border flex items-center justify-center ${tints[tint] || tints.indigo}`}>
        <div className="h-3 w-3 rounded-full bg-current" />
      </div>
    </div>
  );
}
