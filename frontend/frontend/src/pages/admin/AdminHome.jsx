import { useEffect, useState } from "react";
import { fetchAdminMetrics, fetchSchedules } from "../../api/adminApi";
import { 
  Users, 
  BookOpen, 
  Activity, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Sparkles,
  ClipboardCheck,
  FileCode,
  ChevronRight
} from 'lucide-react';

export default function AdminHome({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const passCount = metrics?.passCount || 0;
  const failCount = metrics?.failCount || 0;
  const totalCompleted = passCount + failCount;
  const passRate = totalCompleted ? Math.round((passCount / totalCompleted) * 100) : 0;

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError("");
    try {
      const [metricsRes, schedulesRes] = await Promise.all([
        fetchAdminMetrics(),
        fetchSchedules()
      ]);
      setMetrics(metricsRes);
      setSchedules(schedulesRes.schedules || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickNav(key) {
    if (typeof onNavigate === 'function') {
      onNavigate(key);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Portal Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time system health, live exam slots, and quick access hubs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs font-medium text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadDashboardData} className="underline font-bold hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* 4 Focused High-Impact KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Live Tests */}
        <div 
          onClick={() => handleQuickNav("tests")}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Live Tests</span>
            <div className={`p-2 rounded-xl ${metrics?.activeSessions ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{metrics?.activeSessions ?? 0}</span>
            {metrics?.activeSessions > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="text-xs text-gray-400">Idle</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-blue-600 font-semibold group-hover:underline">
            <span>Monitor test sessions</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Registered Students */}
        <div 
          onClick={() => handleQuickNav("students")}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Students</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{metrics?.userCount ?? 0}</span>
            {metrics?.blockedCount > 0 && (
              <span className="text-xs text-rose-600 font-semibold">({metrics.blockedCount} blocked)</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-purple-600 font-semibold group-hover:underline">
            <span>Manage accounts</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Question Bank Size */}
        <div 
          onClick={() => handleQuickNav("questions")}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question Bank</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{metrics?.questionCount ?? 0}</span>
            <span className="text-xs text-gray-500 font-medium">Problems loaded</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-emerald-600 font-semibold group-hover:underline">
            <span>Explore questions</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Submissions & Pass Rate */}
        <div 
          onClick={() => handleQuickNav("submissions")}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Submissions / Pass Rate</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{metrics?.submissionsCount ?? 0}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {passRate}% pass rate
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-indigo-600 font-semibold group-hover:underline">
            <span>Review test submissions</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* Quick Navigation Action Hub */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Quick Navigation Hub
          </h2>
          <span className="text-xs text-gray-400">Direct shortcuts to primary portal functions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Action 1: Test Slots */}
          <button
            type="button"
            onClick={() => handleQuickNav("scheduling")}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all text-left flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Test Slots & Scheduling</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Create exam windows, enroll students, and assign live teachers & reviewers.
              </p>
            </div>
          </button>

          {/* Action 2: Question Bank */}
          <button
            type="button"
            onClick={() => handleQuickNav("questions")}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all text-left flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">Question Bank</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Manage problems, starter templates, asset bundles, and edit test cases.
              </p>
            </div>
          </button>

          {/* Action 3: Live Tests */}
          <button
            type="button"
            onClick={() => handleQuickNav("tests")}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all text-left flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800 group-hover:text-amber-600 transition-colors">Live Tests Monitoring</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Track active sessions in real time, view timers, and handle student test resets.
              </p>
            </div>
          </button>

          {/* Action 4: Code Review (Coding) */}
          <button
            type="button"
            onClick={() => handleQuickNav("submissions")}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Code Review (Coding)</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Inspect submitted Dart code, review test case execution logs, and assign marks.
              </p>
            </div>
          </button>

          {/* Action 5: Code Review (UI Test) */}
          <button
            type="button"
            onClick={() => handleQuickNav("manual-grading")}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-pink-400 hover:shadow-md transition-all text-left flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800 group-hover:text-pink-600 transition-colors">Code Review (UI Test)</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-pink-600 transition-colors" />
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Perform visual comparison grading against reference Figma mockups.
              </p>
            </div>
          </button>

          {/* Action 6: Students & Accounts */}
          <button
            type="button"
            onClick={() => handleQuickNav("students")}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all text-left flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Students & Accounts</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Manage student profiles, reset test levels, unlock accounts, and import rosters.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Operational Widgets: Live/Upcoming Slots & Recent Submissions */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live / Upcoming Test Slots */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-800">Today's Exam Slots</h3>
              <p className="text-xs text-gray-500">Live and upcoming test sessions scheduled</p>
            </div>
            <button
              onClick={() => handleQuickNav("scheduling")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <span>Manage all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-2.5 flex-1 overflow-y-auto max-h-96">
            {schedules.slice(0, 5).map((slot) => {
              const startTime = new Date(slot.start_at);
              const endTime = new Date(slot.end_at);
              const now = new Date();
              const isLive = slot.is_active && now >= startTime && now <= endTime;
              const isUpcoming = now < startTime;

              return (
                <div
                  key={slot.id}
                  className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-gray-200 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 truncate">{slot.name || `Slot #${slot.id}`}</span>
                      {isLive && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                          Live Now
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {slot.live_teacher_name && (
                        <span>Teacher: <strong>{slot.live_teacher_name}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-700">
                      {slot.registration_count || 0} students
                    </span>
                  </div>
                </div>
              );
            })}

            {schedules.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-600">No exam slots configured</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Click "Test Slots" above to schedule a new test slot.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Submissions Feed */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-800">Recent Submissions</h3>
              <p className="text-xs text-gray-500">Live activity stream of submitted assessments</p>
            </div>
            <button
              onClick={() => handleQuickNav("submissions")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-2.5 flex-1 overflow-y-auto max-h-96">
            {(metrics?.recentSubmissions || []).slice(0, 6).map((sub) => {
              const isPass = sub.status === "PASS";
              const isFail = sub.status === "FAIL";

              return (
                <div
                  key={sub.id}
                  className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-gray-200 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-800 truncate">{sub.student_name || "Student"}</span>
                      {sub.roll_no && (
                        <span className="text-[10px] text-gray-400 font-mono">({sub.roll_no})</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {sub.problem_title ? sub.problem_title : `Question #${sub.problem_id}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-gray-400 hidden sm:inline">
                      {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isPass && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </span>
                    )}
                    {isFail && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                        <XCircle className="w-3 h-3" /> FAIL
                      </span>
                    )}
                    {!isPass && !isFail && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-200 text-gray-700">
                        {sub.status || "Pending"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {(!metrics?.recentSubmissions || metrics.recentSubmissions.length === 0) && (
              <div className="py-12 text-center text-gray-400">
                <FileCode className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-600">No recent submissions</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Submissions will appear here once students submit tests.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Level Distribution Summary */}
      {metrics?.levelCompletions?.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-800">Students Completed by Level</h3>
              <p className="text-xs text-gray-500">Distribution of certified students progressing through tiers</p>
            </div>
            <button
              onClick={() => handleQuickNav("levels")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <span>Manage Levels</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {metrics.levelCompletions.map((lvl) => (
              <div key={lvl.level} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80 text-center">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Level {lvl.level}</div>
                <div className="mt-1 text-2xl font-black text-gray-800">{lvl.studentCount}</div>
                <div className="text-[10px] text-gray-400 font-medium mt-0.5">Passed</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
