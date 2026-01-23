export default function StudentDashboard({ user, level, durationMinutes, questionCount, onLaunch, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <h1 className="text-2xl font-semibold text-slate-800">
            Welcome, {user?.full_name || "Student"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your details before starting the test.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-slate-200 p-4">
              <div className="text-xs uppercase text-slate-400">Email</div>
              <div className="text-sm text-slate-700 mt-1">{user?.email || "-"}</div>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <div className="text-xs uppercase text-slate-400">Enrollment No</div>
              <div className="text-sm text-slate-700 mt-1">{user?.enrollment_no || "-"}</div>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <div className="text-xs uppercase text-slate-400">Roll No</div>
              <div className="text-sm text-slate-700 mt-1">{user?.roll_no || "-"}</div>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <div className="text-xs uppercase text-slate-400">Current Level</div>
              <div className="text-sm text-slate-700 mt-1">{level || "-"}</div>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-700">
              Duration: <span className="font-semibold">{durationMinutes} minutes</span>
            </div>
            <div className="text-sm text-slate-700 mt-1">
              Questions: <span className="font-semibold">{questionCount}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onLaunch}
              className="px-4 py-2 rounded-md bg-sky-500 text-white"
            >
              Launch Portal
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
