import { useEffect, useState } from "react";
import { fetchAdminMetrics } from "../../api/adminApi";
import {
  Users,
  BookOpen,
  Activity,
  CheckCircle,
  TrendingUp,
  Clock,
  UserCheck,
  Award
} from 'lucide-react';

export default function AdminHome() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const passCount = metrics?.passCount || 0;
  const failCount = metrics?.failCount || 0;
  const totalCompleted = passCount + failCount;
  const passRate = totalCompleted ? Math.round((passCount / totalCompleted) * 100) : 0;
  const failRate = totalCompleted ? Math.round((failCount / totalCompleted) * 100) : 0;

  // Compute level completion stats from real data
  const levelCompletions = metrics?.levelCompletions || [];
  const totalLevelCleared = levelCompletions.reduce((sum, row) => sum + (row.studentCount || 0), 0);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);
      const res = await fetchAdminMetrics();
      setMetrics(res);
    } catch (err) {
      setError(err.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[24px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-text-muted mt-1">Monitor system performance and student progress</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* KPI Cards - Top Row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Total Users"
          value={metrics?.userCount ?? 0}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Active Sessions"
          value={metrics?.activeSessions ?? 0}
          badge={metrics?.activeSessions ? "LIVE" : null}
          icon={Activity}
          color="red"
        />
        <KPICard
          title="Levels Cleared"
          value={totalLevelCleared}
          subtitle={`across ${levelCompletions.length} levels`}
          icon={Award}
          color="purple"
        />
        <KPICard
          title="Tests Today"
          value={metrics?.testsToday ?? 0}
          icon={Clock}
          color="green"
        />
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level Progress */}
        <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[24px]">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Level Completions
          </h3>
          <div className="space-y-5">
            {levelCompletions.length > 0 ? levelCompletions.map((row) => {
              const maxStudents = Math.max(...levelCompletions.map(r => r.studentCount || 0), 1);
              const pct = Math.round(((row.studentCount || 0) / maxStudents) * 100);
              return (
                <ProgressBar
                  key={row.level}
                  label={`Level ${row.level}`}
                  percentage={pct}
                  color={row.level?.startsWith('1') ? 'blue' : row.level?.startsWith('2') ? 'purple' : 'green'}
                  count={`${row.studentCount} students`}
                />
              );
            }) : (
              <p className="text-sm text-text-muted text-center py-4">No level completions yet.</p>
            )}
          </div>
        </div>

        {/* Pass vs Fail Chart */}
        <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[24px]">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-6">Overall Pass Rate</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              {/* Donut Chart */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="var(--bg-main)"
                  strokeWidth="20"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="20"
                  strokeDasharray="377"
                  strokeDashoffset={377 - Math.round(passRate / 100 * 377)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">{passRate}%</div>
                  <div className="text-xs text-gray-500">Pass Rate</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600">Pass ({passCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-sm text-gray-600">Fail ({failCount})</span>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Questions"
          value={metrics?.questionCount ?? 0}
          icon={BookOpen}
          iconColor="text-success"
          bgColor="bg-success-soft"
        />
        <MetricCard
          title="Students Blocked"
          value={metrics?.blockedCount ?? 0}
          icon={CheckCircle}
          iconColor="text-danger"
          bgColor="bg-danger-soft"
        />
        <MetricCard
          title="Total Submissions"
          value={metrics?.submissionsCount ?? 0}
          icon={Clock}
          iconColor="text-accent"
          bgColor="bg-accent-soft"
        />
      </section>

      {/* Recent Activity */}
      <section className="bg-surface rounded-[10px] border border-border-subtle shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Recent Submissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-main border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Problem</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Submitted At</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {(metrics?.recentSubmissions || []).map((row) => (
                <ActivityRow
                  key={row.id}
                  name={row.student_name}
                  id={row.roll_no || row.user_id}
                  question={`${row.problem_title || `Problem ${row.problem_id}`}`}
                  time={new Date(row.created_at).toLocaleString()}
                  status={row.status}
                />
              ))}
              {!metrics?.recentSubmissions?.length && (
                <tr>
                  <td className="px-6 py-8 text-sm text-text-muted text-center" colSpan={4}>
                    No recent submissions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KPICard({ title, value, subtitle, badge, icon: Icon, color, trend }) {
  const colorClasses = {
    purple: 'bg-accent-soft text-accent',
    blue: 'bg-accent-soft text-accent',
    red: 'bg-danger-soft text-danger',
    green: 'bg-success-soft text-success',
  };

  return (
    <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[24px] hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-12 h-12 rounded-[10px] ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className="px-2 py-1 bg-danger-soft text-danger text-[10px] font-bold uppercase tracking-wider rounded-md animate-pulse">
            {badge}
          </span>
        )}
        {trend && (
          <span className="text-xs font-semibold text-success">{trend}</span>
        )}
      </div>
      <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
      <p className="text-[28px] font-bold text-text-primary leading-none tracking-tight">{value}</p>
      {subtitle && <p className="text-xs text-text-muted mt-2">{subtitle}</p>}
    </div>
  );
}

function ProgressBar({ label, percentage, color, count }) {
  const colorClasses = {
    purple: 'bg-accent',
    blue: 'bg-accent',
    green: 'bg-success',
    gray: 'bg-border-subtle',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <div className="text-right flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary">{percentage}%</span>
          <span className="text-[11px] text-text-muted px-1.5 py-0.5 bg-main rounded">{count}</span>
        </div>
      </div>
      <div className="w-full bg-main rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, iconColor, bgColor }) {
  return (
    <div className="bg-surface rounded-[10px] border border-border-subtle p-[24px] flex items-center gap-4">
      <div className={`w-[48px] h-[48px] rounded-[10px] ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-muted mb-1 truncate">{title}</p>
        <p className="text-[28px] font-bold text-text-primary leading-none tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function ActivityRow({ name, id, question, time, status }) {
  const statusColor = status === "COMPLETED" || status === "PASS"
    ? "text-success bg-success-soft"
    : status === "SUBMITTED"
      ? "text-accent bg-accent-soft"
      : status === "PENDING"
        ? "text-warning bg-warning-soft"
        : "text-text-muted bg-main";

  return (
    <tr className="hover:bg-main/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-soft border border-border-subtle flex items-center justify-center shrink-0">
            <span className="text-accent text-xs font-bold">{name?.charAt(0) || '?'}</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-text-primary truncate">{name}</div>
            <div className="text-[11px] text-text-muted truncate">{id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-text-primary max-w-[200px] truncate">{question}</td>
      <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">{time}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}
