import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, BookOpen, Clock3, Flame, Layers3, PlayCircle, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { fetchStudentDashboard } from "../api/authApi";

export default function StudentDashboard({ user, level, durationMinutes, questionCount, onLaunch, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchStudentDashboard();
        if (!mounted) return;
        setDashboard(data.dashboard || null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load dashboard");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = dashboard?.stats || {};
  const currentLevel = dashboard?.currentLevelDetails;
  const levelRoadmap = dashboard?.levels || [];
  const recentSessions = dashboard?.recentSessions || [];
  const activeSchedule = dashboard?.activeSchedule;
  const nextSchedule = dashboard?.nextSchedule;
  const canLaunchTest = Boolean(dashboard?.canLaunchTest);

  const launchLabel = canLaunchTest ? "Launch Test Portal" : "Waiting for active slot";
  const launchHelper = canLaunchTest
    ? activeSchedule
      ? `Active slot: ${activeSchedule.name}`
      : "You can launch the portal now."
    : nextSchedule
      ? `Next registered slot starts on ${new Date(nextSchedule.start_at).toLocaleString()}`
      : "You are not registered for an active slot right now.";

  const progressLabel = useMemo(() => {
    if (!levelRoadmap.length) return "Level progress";
    const index = levelRoadmap.findIndex((item) => item.levelCode === (dashboard?.currentLevelDetails?.levelCode || level));
    if (index < 0) return "Level progress";
    return `${index + 1} / ${levelRoadmap.length}`;
  }, [dashboard?.currentLevelDetails?.levelCode, level, levelRoadmap]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/10">
          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.1),_transparent_30%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.8fr] lg:items-end">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Student Dashboard
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                    Welcome back, {user?.full_name || "Student"}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                    Track your level progress, study the current portion list, open Flutter resources, and launch the test portal when your slot is active.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                  <Pill icon={Layers3} label={`Current level: ${level || "-"}`} />
                  <Pill icon={Clock3} label={`${durationMinutes || currentLevel?.durationMinutes || 60} min test window`} />
                  <Pill icon={BookOpen} label={`${questionCount || currentLevel?.questionCount || 0} questions`} />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Launch status</div>
                    <div className="mt-1 text-lg font-semibold text-white">{launchLabel}</div>
                  </div>
                  <ShieldCheck className={`h-9 w-9 ${canLaunchTest ? "text-emerald-300" : "text-amber-300"}`} />
                </div>
                <p className="mt-3 text-sm text-slate-300">{launchHelper}</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={onLaunch}
                    disabled={!canLaunchTest}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:from-blue-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Launch Test Portal
                  </button>
                  <button
                    onClick={onLogout}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Attempts" value={stats.totalAttempts ?? 0} icon={Activity} tone="blue" />
          <StatCard title="Passes" value={stats.passCount ?? 0} icon={Trophy} tone="emerald" />
          <StatCard title="Fails" value={stats.failCount ?? 0} icon={Flame} tone="rose" />
          <StatCard title="Awaiting manual" value={stats.awaitingManualCount ?? 0} icon={Clock3} tone="amber" />
          <StatCard title="Pass rate" value={`${stats.passRate ?? 0}%`} icon={ShieldCheck} tone="indigo" />
          <StatCard title="Progress" value={dashboard?.levelProgress ?? 0} suffix="%" icon={ArrowRight} tone="slate" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Panel title="Current level overview" icon={Layers3}>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>{currentLevel?.levelCode || level || "-"}</Badge>
                    <Badge tone="muted">{currentLevel?.assessmentType || "TEST_CASE"}</Badge>
                    <Badge tone="muted">Pass {currentLevel?.passThreshold ?? 85}%</Badge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {currentLevel?.studentOverview || "Your level details will appear here once configured from the admin panel."}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniInfo label="Duration" value={`${currentLevel?.durationMinutes || durationMinutes || 60} min`} />
                    <MiniInfo label="Questions" value={currentLevel?.questionCount || questionCount || 0} />
                    <MiniInfo label="Progress" value={progressLabel} />
                  </div>
                </>
              )}
            </Panel>

            <Panel title="Portions to cover" icon={BookOpen}>
              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              ) : currentLevel?.portions?.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {currentLevel.portions.map((portion, index) => (
                    <div key={`${portion}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-800">{portion}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No portions have been added yet.</p>
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Flutter resources" icon={BookOpen}>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              ) : currentLevel?.resources?.length ? (
                <div className="space-y-3">
                  {currentLevel.resources.map((resource, index) => (
                    <a
                      key={`${resource.url}-${index}`}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{resource.label}</div>
                        <div className="mt-1 break-all text-xs text-slate-500">{resource.url}</div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 text-slate-400" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No Flutter resources have been added yet.</p>
              )}
            </Panel>

            <Panel title="Your recent activity" icon={Activity}>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              ) : recentSessions.length ? (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-800">Level {session.level}</div>
                          <div className="text-xs text-slate-500">{new Date(session.started_at).toLocaleString()}</div>
                        </div>
                        <Badge tone={session.status === "PASS" ? "green" : session.status === "FAIL" ? "rose" : "amber"}>
                          {session.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No attempts recorded yet.</p>
              )}
            </Panel>

            <Panel title="Slot access" icon={ShieldCheck}>
              {activeSchedule ? (
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="font-semibold text-slate-800">{activeSchedule.name}</div>
                  <div>Active until {new Date(activeSchedule.end_at).toLocaleString()}</div>
                </div>
              ) : nextSchedule ? (
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="font-semibold text-slate-800">Next registered slot</div>
                  <div>{nextSchedule.name}</div>
                  <div>Starts {new Date(nextSchedule.start_at).toLocaleString()}</div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No registered slot found.</p>
              )}
            </Panel>
          </div>
        </section>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-blue-600" />
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({ title, value, suffix = "", icon: Icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{title}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}{suffix}
          </div>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone] || tones.slate}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-100 text-blue-700",
    muted: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  };

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.blue}`}>{children}</span>;
}

function Pill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-100">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
